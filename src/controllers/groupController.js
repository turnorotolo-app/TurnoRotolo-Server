import Group from '../models/Group.js';
import User from '../models/User.js';
import { generateInviteCode } from '../utils/inviteCode.js';

/**
 * @desc    Crea nuovo gruppo
 * @route   POST /api/groups
 * @access  Private
 */
export const createGroup = async (req, res, next) => {
  try {
    const { name } = req.body;

    // Genera codice invito univoco
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existingGroup = await Group.findOne({ inviteCode });
      if (!existingGroup) isUnique = true;
    }

    // Crea gruppo con l'utente corrente come admin e primo membro
    const group = await Group.create({
      name,
      adminId: req.user._id,
      inviteCode,
      members: [{
        userId: req.user._id,
        name: req.user.name,
        score: 0
      }]
    });

    // Aggiungi gruppo alla lista dell'utente
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    res.status(201).json({
      success: true,
      message: '🎉 Gruppo creato con successo!',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni tutti i gruppi dell'utente
 * @route   GET /api/groups
 * @access  Private
 */
export const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.userId': req.user._id,
      isActive: true
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: groups.length,
      data: { groups }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni dettagli gruppo specifico
 * @route   GET /api/groups/:id
 * @access  Private (solo membri)
 */
export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('adminId', 'name email')
      .populate('members.userId', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato'
      });
    }

    // Verifica che l'utente sia membro
    const isMember = group.members.some(
      m => m.userId._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato'
      });
    }

    res.status(200).json({
      success: true,
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aggiorna nome gruppo
 * @route   PUT /api/groups/:id
 * @access  Private (solo admin)
 */
export const updateGroup = async (req, res, next) => {
  try {
    const { name } = req.body;

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: '✅ Gruppo aggiornato',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Elimina gruppo
 * @route   DELETE /api/groups/:id
 * @access  Private (solo admin)
 */
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    // Soft delete
    group.isActive = false;
    await group.save();

    res.status(200).json({
      success: true,
      message: '🗑️ Gruppo eliminato',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unisciti a gruppo con codice invito
 * @route   POST /api/groups/join/:code
 * @access  Private
 */
export const joinGroup = async (req, res, next) => {
  try {
    const { code } = req.params;

    const group = await Group.findOne({ 
      inviteCode: code.toUpperCase(),
      isActive: true 
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato con questo codice'
      });
    }

    // Verifica se già membro
    const isMember = group.members.some(
      m => m.userId.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        error: 'Sei già membro di questo gruppo'
      });
    }

    // Aggiungi membro
    group.members.push({
      userId: req.user._id,
      name: req.user.name,
      score: 0
    });

    await group.save();

    // Aggiungi gruppo alla lista dell'utente
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    res.status(200).json({
      success: true,
      message: '🎊 Ti sei unito al gruppo!',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aggiungi membro manualmente
 * @route   POST /api/groups/:id/members
 * @access  Private (solo admin)
 */
export const addMember = async (req, res, next) => {
  try {
    const { userId, name } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    await req.group.addMember(userId, name || user.name);

    await User.findByIdAndUpdate(userId, {
      $push: { groups: req.group._id }
    });

    res.status(200).json({
      success: true,
      message: '👥 Membro aggiunto',
      data: { group: req.group }
    });
  } catch (error) {
    if (error.message === 'Membro già presente nel gruppo') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Rimuovi membro
 * @route   DELETE /api/groups/:id/members/:userId
 * @access  Private (solo admin)
 */
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Non può rimuovere se stesso se è admin
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'L\'admin non può rimuoversi dal gruppo'
      });
    }

    await req.group.removeMember(userId);

    await User.findByIdAndUpdate(userId, {
      $pull: { groups: req.group._id }
    });

    res.status(200).json({
      success: true,
      message: '👋 Membro rimosso',
      data: { group: req.group }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aggiorna pesi parametri
 * @route   PUT /api/groups/:id/weights
 * @access  Private (solo admin)
 */
export const updateWeights = async (req, res, next) => {
  try {
    const { distance, wait, money } = req.body;

    if (distance !== undefined) req.group.weights.distance = distance;
    if (wait !== undefined) req.group.weights.wait = wait;
    if (money !== undefined) req.group.weights.money = money;

    await req.group.save();

    res.status(200).json({
      success: true,
      message: '⚖️ Pesi aggiornati',
      data: { weights: req.group.weights }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset punteggi gruppo
 * @route   POST /api/groups/:id/reset-scores
 * @access  Private (solo admin)
 */
export const resetScores = async (req, res, next) => {
  try {
    await req.group.resetScores();

    res.status(200).json({
      success: true,
      message: '🔄 Punteggi resettati',
      data: { group: req.group }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni prossimo turno
 * @route   GET /api/groups/:id/next-person
 * @access  Private (solo membri)
 */
export const getNextPerson = async (req, res, next) => {
  try {
    const nextPerson = req.group.getNextPerson();

    if (!nextPerson) {
      return res.status(404).json({
        success: false,
        error: 'Nessun membro nel gruppo'
      });
    }

    res.status(200).json({
      success: true,
      message: '🎯 Prossimo turno determinato',
      data: { nextPerson }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Esci dal gruppo
 * @route   POST /api/groups/:id/leave
 * @access  Private
 */
export const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    // Admin non può uscire
    if (group.adminId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'L\'admin deve prima trasferire il ruolo o eliminare il gruppo'
      });
    }

    await group.removeMember(req.user._id);

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { groups: group._id }
    });

    res.status(200).json({
      success: true,
      message: '👋 Hai lasciato il gruppo',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};