import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware per proteggere le routes - verifica JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  // Controlla se il token è presente nell'header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Estrae il token dopo "Bearer "
    token = req.headers.authorization.split(' ')[1];
  }

  // Verifica presenza token
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Non autorizzato - Token mancante'
    });
  }

  try {
    // Verifica e decodifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trova l'utente dal token (esclude la password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Non autorizzato - Token non valido'
    });
  }
};

/**
 * Middleware per verificare che l'utente sia admin del gruppo
 */
export const isGroupAdmin = async (req, res, next) => {
  try {
    const groupId = req.params.id || req.params.groupId;
    const Group = (await import('../models/Group.js')).default;
    
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato'
      });
    }

    // Verifica se l'utente è l'admin del gruppo
    if (group.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato - Solo l\'admin può eseguire questa azione'
      });
    }

    // Salva il gruppo nella request per usi futuri
    req.group = group;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware per verificare che l'utente sia membro del gruppo
 */
export const isGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.id || req.params.groupId;
    const Group = (await import('../models/Group.js')).default;
    
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo non trovato'
      });
    }

    // Verifica se l'utente è membro del gruppo
    const isMember = group.members.some(
      member => member.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato - Non sei membro di questo gruppo'
      });
    }

    // Salva il gruppo nella request per usi futuri
    req.group = group;
    next();
  } catch (error) {
    next(error);
  }
};