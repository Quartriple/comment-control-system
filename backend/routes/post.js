const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.post('/', async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.userId;
});

module.exports = router;