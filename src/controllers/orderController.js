import Order from '../models/Order.js';
import Group from '../models/Group.js';
import { calculateScore, calculateGroupStats } from '../utils/scoreCalculator.js';

/**
 * @desc    Crea nuovo ordine
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { groupId, restaurant, distance, wait, money, notes, manualPersonId } = req.body;

    // Trova gruppo
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato'
      });
    }

    // Verifica che l'utente sia membro
    const isMember = group.members.some(
      m => m.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Non sei membro di questo gruppo'
      });
    }

    // Determina chi DOVREBBE andare (punteggio più basso)
    const suggestedPerson = group.getNextPerson();
    if (!suggestedPerson) {
      return res.status(400).json({
        success: false,
        error: 'Nessun membro disponibile nel gruppo'
      });
    }

    let personForOrder;
    let wasManualOverride = false;
    let suggestedPersonId = null;
    let suggestedPersonName = null;
    let responseMessage;

    if (manualPersonId && manualPersonId !== suggestedPerson.userId.toString()) {
      personForOrder = group.members.find(
        m => m.userId.toString() === manualPersonId
      );

      if (!personForOrder) {
        return res.status(404).json({
          success: false,
          error: 'Persona selezionata manualmente non trovata nel gruppo'
        });
      }
      wasManualOverride = true;
      suggestedPersonId = suggestedPerson.userId;
      suggestedPersonName = suggestedPerson.name;
      responseMessage = `🎉 Ordine creato! ${personForOrder.name} andrà a ritirare al posto di ${suggestedPerson.name}`;
    } else {
      // Scelta standard (o manuale che conferma il suggerito)
      personForOrder = suggestedPerson;
      responseMessage = `🎉 Ordine creato! ${personForOrder.name} andrà a ritirare`;
    }


    // Calcola punteggio
    const score = calculateScore(distance, wait, money, group.weights);

    // Crea ordine
    const order = await Order.create({
      groupId,
      personId: personForOrder.userId,
      personName: personForOrder.name,
      restaurant,
      distance,
      wait,
      money,
      score,
      notes,
      wasManualOverride,
      suggestedPersonId,
      suggestedPersonName
    });

    // Aggiorna punteggio
    await group.updateMemberScore(personForOrder.userId, score);

    res.status(201).json({
      success: true,
      message: `${responseMessage} (+${score} punti)`,
      data: { 
        order,
        nextPerson: {
          name: personForOrder.name,
          newScore: personForOrder.score + score
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni tutti gli ordini di un gruppo
 * @route   GET /api/orders/group/:groupId
 * @access  Private (solo membri)
 */
export const getGroupOrders = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    // Verifica accesso al gruppo
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato'
      });
    }

    const isMember = group.members.some(
      m => m.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato'
      });
    }

    // Ottieni ordini con paginazione
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ groupId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('personId', 'name email');

    const total = await Order.countDocuments({ groupId });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni dettagli ordine specifico
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('groupId', 'name')
      .populate('personId', 'name email');
      // Anche qui, i nuovi campi sono già inclusi

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }

    // Verifica accesso
    const group = await Group.findById(order.groupId);
    const isMember = group.members.some(
      m => m.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Elimina ordine
 * @route   DELETE /api/orders/:id
 * @access  Private (solo admin gruppo)
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }

    // Verifica che l'utente sia admin del gruppo
    const group = await Group.findById(order.groupId);
    
    if (group.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Solo l\'admin può eliminare ordini'
      });
    }

    // Rimuovi punteggio dal membro
    await group.updateMemberScore(order.personId, -order.score);

    // Elimina ordine
    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '🗑️ Ordine eliminato e punteggi aggiornati',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni statistiche ordini gruppo
 * @route   GET /api/orders/group/:groupId/stats
 * @access  Private (solo membri)
 */
export const getGroupOrderStats = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    // Verifica accesso
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato'
      });
    }

    const isMember = group.members.some(
      m => m.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato'
      });
    }

    // Ottieni ordini
    const orders = await Order.find({ groupId });

    // Calcola statistiche
    const stats = calculateGroupStats(group.members, orders);
    const totalOverrides = orders.filter(o => o.wasManualOverride).length;
    const overridePercentage = orders.length > 0 ? (totalOverrides / orders.length) * 100 : 0;

    // Statistiche aggiuntive per parametri
    const distanceStats = {
      short: orders.filter(o => o.distance === 'short').length,
      medium: orders.filter(o => o.distance === 'medium').length,
      long: orders.filter(o => o.distance === 'long').length
    };

    const waitStats = {
      low: orders.filter(o => o.wait === 'low').length,
      medium: orders.filter(o => o.wait === 'medium').length,
      high: orders.filter(o => o.wait === 'high').length
    };

    const moneyStats = {
      low: orders.filter(o => o.money === 'low').length,
      medium: orders.filter(o => o.money === 'medium').length,
      high: orders.filter(o => o.money === 'high').length
    };

    // Top 5 ristoranti più ordinati
    const restaurantCounts = {};
    orders.forEach(order => {
      restaurantCounts[order.restaurant] = (restaurantCounts[order.restaurant] || 0) + 1;
    });

    const topRestaurants = Object.entries(restaurantCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        totalOverrides,
        overridePercentage: parseFloat(overridePercentage.toFixed(1)),
        distanceStats,
        waitStats,
        moneyStats,
        topRestaurants
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni ordini personali
 * @route   GET /api/orders/my
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ personId: req.user._id })
      .sort('-createdAt')
      .populate('groupId', 'name');

    const totalScore = orders.reduce((sum, order) => sum + order.score, 0);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalScore,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};