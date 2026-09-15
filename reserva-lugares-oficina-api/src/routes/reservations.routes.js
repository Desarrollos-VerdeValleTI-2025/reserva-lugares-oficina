const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservationsController');
const { validateReservationBody } = require('../middlewares/reservationValidators');

router.get('/me', reservationsController.getMine);
router.post('/', validateReservationBody, reservationsController.create);
router.put('/:id', validateReservationBody, reservationsController.update);
router.delete('/:id', reservationsController.remove);

module.exports = router;
