const { body, validationResult } = require('express-validator');

const validateSeatId = body('seatId')
    .notEmpty().withMessage('seatId es requerido').bail()
    .isInt().withMessage('seatId debe ser un número entero')
    ;

const validateDate = body('date')
    .isISO8601().withMessage('date debe ser una fecha válida en formato YYYY-MM-DD');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: errors.array().map(e => e.msg).join(', ') }
        });
    }
    next();
};

const validateReservationBody = [validateSeatId, validateDate, handleValidationErrors];

module.exports = { validateReservationBody };