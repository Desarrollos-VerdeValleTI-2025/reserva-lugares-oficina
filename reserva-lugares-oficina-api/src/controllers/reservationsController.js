const reservationsService = require('../services/reservationsService');

const getMine = async (req, res, next) => {
    try {
        const reservations = await reservationsService.getReservationsByUserEmail(req.user.email);
        res.json({ success: true, data: reservations });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { seatId, date } = req.body;
        const userEmail = req.user.email;

        const reservation = await reservationsService.createReservation({ seatId, date, userEmail });
        res.status(201).json({ success: true, data: reservation });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { seatId, date } = req.body;
        const userEmail = req.user.email;

        const reservation = await reservationsService.updateReservation(id, { seatId, date, userEmail });
        res.json({ success: true, data: reservation });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const userEmail = req.user.email;

        const removed = await reservationsService.deleteReservation(id, userEmail);
        res.json({ success: true, data: removed })
    } catch (err) {
        next(err);
    }
};

module.exports = { getMine, create, update, remove };
