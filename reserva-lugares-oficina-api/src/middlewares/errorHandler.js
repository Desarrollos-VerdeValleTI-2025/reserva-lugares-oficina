const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error no controlado', err);

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.expose ? err.message : 'Ha ocurrido un error interno. Por favor, intente nuevamente más tarde.'
    },
  });
};

module.exports = errorHandler;
