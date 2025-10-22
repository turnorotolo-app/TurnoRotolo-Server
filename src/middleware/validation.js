import { body, param, validationResult } from 'express-validator';

/**
 * Middleware per gestire gli errori di validazione
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errori di validazione',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validazione registrazione utente
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('Il nome deve essere tra 2 e 50 caratteri'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email è obbligatoria')
    .isEmail().withMessage('Email non valida')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La password è obbligatorIA')
    .isLength({ min: 6 }).withMessage('La password deve avere almeno 6 caratteri'),
  
  handleValidationErrors
];

/**
 * Validazione login utente
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email è obbligatorIA')
    .isEmail().withMessage('Email non valida')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La password è obbligatorIA'),
  
  handleValidationErrors
];

/**
 * Validazione creazione gruppo
 */
export const validateCreateGroup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Il nome del gruppo è obbligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('Il nome deve essere tra 2 e 50 caratteri'),
  
  handleValidationErrors
];

/**
 * Validazione aggiunta membro
 */
export const validateAddMember = [
  body('userId')
    .notEmpty().withMessage('L\'ID utente è obbligatorio')
    .isMongoId().withMessage('ID utente non valido'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('Il nome deve essere tra 2 e 50 caratteri'),
  
  handleValidationErrors
];

/**
 * Validazione creazione ordine
 */
export const validateCreateOrder = [
  body('groupId')
    .notEmpty().withMessage('Il gruppo è obbligatorio')
    .isMongoId().withMessage('ID gruppo non valido'),
  
  body('restaurant')
    .trim()
    .notEmpty().withMessage('Il nome del ristorante è obbligatorio')
    .isLength({ max: 100 }).withMessage('Il nome del ristorante è troppo lungo'),
  
  body('distance')
    .notEmpty().withMessage('La distanza è obbligatoria')
    .isIn(['short', 'medium', 'long']).withMessage('Distanza non valida (short, medium, long)'),
  
  body('wait')
    .notEmpty().withMessage('Il tempo d\'attesa è obbligatorio')
    .isIn(['low', 'medium', 'high']).withMessage('Tempo d\'attesa non valido (low, medium, high)'),
  
  body('money')
    .notEmpty().withMessage('L\'anticipo è obbligatorio')
    .isIn(['low', 'medium', 'high']).withMessage('Anticipo non valido (low, medium, high)'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Le note non possono superare 500 caratteri'),
  
  body('manualPersonId')
    .optional({ nullable: true })
    .isMongoId().withMessage('ID persona manuale non valido'),

  handleValidationErrors
];

/**
 * Validazione aggiornamento pesi
 */
export const validateUpdateWeights = [
  body('distance')
    .optional()
    .isFloat({ min: 0, max: 2 }).withMessage('Il peso distanza deve essere tra 0 e 2'),
  
  body('wait')
    .optional()
    .isFloat({ min: 0, max: 2 }).withMessage('Il peso attesa deve essere tra 0 e 2'),
  
  body('money')
    .optional()
    .isFloat({ min: 0, max: 2 }).withMessage('Il peso anticipo deve essere tra 0 e 2'),
  
  handleValidationErrors
];

/**
 * Validazione parametro ID MongoDB
 */
export const validateMongoId = [
  param('id')
    .isMongoId().withMessage('ID non valido'),
  
  handleValidationErrors
];

/**
 * Validazione parametro Group ID MongoDB
 */
export const validateGroupId = [
  param('groupId')
    .isMongoId().withMessage('ID gruppo non valido nel parametro'),

  handleValidationErrors
];

/**
 * Validazione codice invito
 */
export const validateInviteCode = [
  param('code')
    .trim()
    .notEmpty().withMessage('Il codice invito è obbligatorio')
    .isLength({ min: 6, max: 6 }).withMessage('Il codice invito deve essere di 6 caratteri')
    .matches(/^[A-Z0-9]{6}$/i).withMessage('Formato codice invito non valido'),
  
  handleValidationErrors
];