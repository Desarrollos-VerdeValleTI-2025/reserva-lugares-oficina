const seatsService = require('../services/seatsService');

const getSeats = async (req, res, next) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'El parámetro date es requerido' }
        });
    }

    try{
        const seatsGrid = await seatsService.getSeatsGrid(date);
        res.json({ success: true, data: seatsGrid });
    } catch (err) {
        next(err);
    }
};

module.exports = { getSeats };
