const express = require('express');
const router  = express.Router();
const { db } = require('../db');
const comment = require('../models/comment');

router.post('/', async (req, res) => {
    const { content } = req.body;

    try {
        const flaskResponse = await fetch('http://localhost:5000/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({comment: content})
        });

        if (!flaskResponse.ok) {
            return res.status(500).json({ message: 'Flask Server is not available.'});
        }

        const aiResult  = await flaskResponse.json();

        const newComment = await db.Comment.create({
            content: content,
            is_hateful: aiResult.is_hateful,
        });

        res.status(201).json({
            message: 'Comment submitted successfully.',
            comment: newComment,
            analysis: aiResult,
        });

    } catch (error) {
        console.error('Error submitting comment:', error);
        res.status(500).json({ message: 'An internal error occurred.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const comments = await db.Comment.findAll();
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'An error occurred fetching comments.' });
    }
})
module.exports = router;