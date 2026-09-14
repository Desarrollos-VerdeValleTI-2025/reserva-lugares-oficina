require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./config/logger');
const authMiddleware = require('./middlewares/authMiddleware');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');

const healthRoutes = require('./routes/health.routes');
const seatsRoutes = require('./routes/seats.routes');
const reservationsRoutes = require('./routes/reservations.routes');

const app = express();

// Parseo de body JSON
app.use(express.json());

// Seguridad global
app.use(helmet());
app.use(cors({ origin: process.env.ORIGENES_PERMITIDOS.split(',') }));

// Log de cada request HTTP, canalizado a winston
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Límite de tasa sobre /api: no hay login/recuperación de contraseña propios (la autenticación
// la delega Azure AD), así que se aplica un límite global razonable en vez de uno por endpoint.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // por IP, por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
    }
  }
});

// Rutas
app.use(healthRoutes);

app.use('/api', apiLimiter);

// Todo lo que cuelgue de /api/ requiere token válido (Actividad 4)
app.use('/api', authMiddleware);
app.use('/api/seats', seatsRoutes);
app.use('/api/reservations', reservationsRoutes);

// Manejo de ruta no encontrada y de errores centralizado (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;
