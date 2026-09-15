const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
});

router.get('/health/secure', authMiddleware, (req, res) => {
    res.json({ success: true, data: { status: 'ok', user: req.user.email } });
});

module.exports = router;