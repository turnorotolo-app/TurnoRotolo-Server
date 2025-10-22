import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import orderRoutes from './routes/orders.js';

// Carica variabili d'ambiente
dotenv.config();

// Connetti al database
connectDB();

const app = express();
const PORT = process.env.PORT || 8080;

// Imposto 'trust proxy' per funzionare dietro reverse proxy (es. Railway)
// Questo è necessario per far funzionare correttamente express-rate-limit e per ottenere l'IP corretto dell'utente.
app.set('trust proxy', 1);

// ====================================
// MIDDLEWARE
// ====================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Troppe richieste da questo IP, riprova più tardi'
  }
});
app.use('/api/', limiter);

// ====================================
// ROUTES
// ====================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RotoloTurno API v1.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'RotoloTurno API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups',
      orders: '/api/orders'
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/orders', orderRoutes);

// Gestore 404 (deve essere dopo tutte le altre rotte e prima del gestore di errori)
// Rimuoviamo il percorso '*' e usiamo un middleware standard.
app.use((req, res, next) => {
  const error = new Error(`Endpoint non trovato - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  // Passiamo l'errore al nostro gestore centralizzato
  next(error);
});

// Error handler (deve essere l'ultimo middleware in assoluto)
app.use(errorHandler);

// ====================================
// START SERVER
// ====================================
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log('RotoloTurno Backend API');
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log('=================================\n');
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
