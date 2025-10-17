import User from '../models/User.js';

/**
 * @desc    Registrazione nuovo utente
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Verifica se l'email esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email già registrata'
      });
    }

    // Crea utente
    const user = await User.create({
      name,
      email,
      password
    });

    // Genera token JWT
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: '🎉 Registrazione completata con successo!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login utente
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Trova utente e include la password per la verifica
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Verifica password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Genera token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: '✅ Login effettuato con successo!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          groups: user.groups
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ottieni profilo utente corrente
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('groups', 'name memberCount');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          groups: user.groups,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aggiorna profilo utente
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: '✅ Profilo aggiornato con successo',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cambia password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Trova utente con password
    const user = await User.findById(req.user._id).select('+password');

    // Verifica password attuale
    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Password attuale non corretta'
      });
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    // Genera nuovo token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: '🔐 Password aggiornata con successo',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};