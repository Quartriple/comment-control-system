const express = require('express');
const router  = express.Router();
const { db } = require('../db');
const { Op, where } = require('sequelize');

router.post('/', async (req, res) => {
    const { content, postId } = req.body;
    let { userId } =  req.session;

    if (!userId) {
        // return res.status(401).json({ message: '로그인이 필요합니다.' });
        userId = 1;
    }

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

        // AI 서버 응답에서 새로운 필드를 추출하고 변수에 할당합니다.
        const { hate_score, hate_reasoning, veracity, veracity_reasoning, source, topic, category } = aiResult;

        const newComment = await db.Comment.create({
            content: content,
            hate_score: hate_score,
            hate_reasoning: hate_reasoning,
            veracity: veracity,
            veracity_reasoning: veracity_reasoning,
            source: source,
            topic: topic,
            category: category,
            userId: userId,
            postId: postId         
        });

        res.status(201).json({
            message: 'Comment submitted successfully.',
            comment: newComment,
            // analysis: aiResult,
        });

    } catch (error) {
        console.error('Error submitting comment:', error);
        res.status(500).json({ message: 'An internal error occurred.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const { postId, userId, veracity, topic, category, sortBy, sortOrder } = req.query;
        
        const whereClause = {};
        const orderClause = [];

        if (postId) {
            whereClause.postId = postId;
        }
        if (userId) {
            whereClause.userId = userId;
        }
        if (veracity) {
            whereClause.veracity = veracity.toUpperCase();
        }
        if (topic) {
            whereClause.topic = { [Op.like]: `%${topic}%` };
        }
        if (category) {
            whereClause.category = { [Op.like]: `%${category}%` };
        }

        const validSortColumns = ['hate_score', 'createdAt', 'updatedAt'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        orderClause.push([sortColumn, sortDirection])

        const comments = await db.Comment.findAll({
            where: whereClause,
            orderClause: orderClause,
            include: [{
                model: db.User, // 작성자 정보
                attributes: ['nickname']
            }, {
                model: db.Post, // 게시글 정보
                attributes: ['title']
            }]
        });
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'An error occurred fetching comments.' });
    }
});

router.patch('/:id', async (req, res) => {
    const commentId = req.params.id;
    const { content } = req.body;
    let userId = req.session.userId || 1;

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const comment = await db.Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: '댓글 수정 권한이 없습니다.' });
        }
        
        const flaskResponse = await fetch('http://localhost:5000/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({comment: content})
        });

        if (!flaskResponse.ok) {
            return res.status(500).json({ message: 'Flask Server is not available.'});
        }

        const aiResult  = await flaskResponse.json();

        const {
            hate_score,
            hate_reasoning,
            veracity,
            veracity_reasoning,
            source,
            topic,
            category
        } = aiResult;

        await comment.update({
            content: content,
            hate_score: hate_score,
            hate_reasoning: hate_reasoning,
            veracity: veracity,
            veracity_reasoning: veracity_reasoning,
            source: source,
            topic: topic,
            category: category
        });

        res.status(200).json({
            message: '댓글이 성공적으로 수정되었습니다.',
            comment: comment,
            analysis: aiResult
        });

    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'An internal error occurred.' });
    }
});

router.delete('/:id', async (req, res) => {
    const commentId = req.params.id;
    let userId = req.session.userId || 1; // 테스트용 향후, 수정

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    try {
        const comment = await db.Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        const user = await db.User.findByPk(userId);
        const isAdmin = user && user.is_admin;

        // 댓글 작성자이거나 관리자인지 확인
        if (comment.userId !== userId && !isAdmin) {
            return res.status(403).json({ message: '댓글 삭제 권한이 없습니다.' });
        }

        await db.Comment.destroy({
            where: { id: commentId }
        });

        res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

module.exports = router;