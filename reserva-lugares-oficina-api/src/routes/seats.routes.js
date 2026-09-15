const express = require('express');
const router = express.Router();
const seatsController = require('../controllers/seatsController');

router.get('/', seatsController.getSeats);
module.exports = router;