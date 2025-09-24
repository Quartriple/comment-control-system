const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { Op, where } = require('sequelize');

router.get('/', async (req, res) => {
    const isAdmin = req.session.isAdmin;

    if (!isAdmin) {
        return res.status(403).render('error', {
            title: '접근 금지',
            message: '관리자만 접근할 수 있습니다.',
            isLoggedIn: !!req.session.userId,
            isAdmin: req.session.isAdmin,
        });
    }

    try {
        const postCount = await db.Post.count();
        const commentCount = await db.Comment.count();
        const userCount = await db.User.count();

        const recentPosts = await db.Post.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: db.User, attributes: ['nickname'] }]
        });
        
        // 쿼리 파라미터를 가져옵니다. sortOrder가 없을 경우 기본값으로 'DESC'를 사용합니다.
        const { veracity, topic, sortOrder = 'DESC' } = req.query;
        const whereClause = {};

        // veracity 필터링 조건 추가
        if (veracity) {
            whereClause.veracity = veracity.toUpperCase();
        }

        // topic 필터링 조건 추가 (부분 일치 검색)
        if (topic) {
            whereClause.topic = { [Op.like]: `%${topic}%` };
        }

        // 댓글 목록을 필터링 및 정렬하여 가져옵니다.
        const comments = await db.Comment.findAll({
            where: whereClause,
            order: [['createdAt', sortOrder]],
            include: [{ model: db.User, attributes: ['nickname'] }]
        });

        res.render('admin', {
            title: "관리자 대시보드",
            isLoggedIn: !!req.session.userId,
            isAdmin: req.session.isAdmin,
            postCount: postCount,
            commentCount: commentCount,
            userCount: userCount,
            recentPosts: recentPosts,
            comments: comments,
            veracity: veracity || '',
            topic: topic || '',
            sortOrder: sortOrder,
        });
    } catch (error) {
        console.error('관리자 대시보드 조회 중 오류 발생:', error);
        res.status(500).render('error', {
            title: "오류",
            message: '서버 내부 오류가 발생했습니다.',
            isLoggedIn: !!req.session.userId,
            isAdmin: req.session.isAdmin,
        });
    }
});

module.exports = router;