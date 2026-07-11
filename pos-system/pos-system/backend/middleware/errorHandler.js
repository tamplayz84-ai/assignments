// Centralized error handler. Any next(err) call in controllers lands here.
function errorHandler(err, req, res, next) {
  console.error(err);

  // Sequelize unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'A record with this value already exists.',
      details: err.errors?.map((e) => e.message),
    });
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation failed.',
      details: err.errors?.map((e) => e.message),
    });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error.' });
}

module.exports = errorHandler;
