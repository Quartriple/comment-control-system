const express = require('express');
const router = express.Router();
const { db } = require('../db');


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'DESC';

        const validSortColumns = ['createdAt', 'views', 'likes'];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({ message: '유효하지 않은 정렬 기준입니다.' });
        }

        const validSortOrders = ['ASC', 'DESC'];
        if (!validSortOrders.includes(sortOrder.toUpperCase())) {
            return res.status(400).json({ message: '유효하지 않은 정렬 순서입니다. (ASC 또는 DESC)' });
        }

        const orderOption = [[sortBy, sortOrder.toUpperCase()]];

        const { count, rows } = await db.Post.findAndCountAll({
            limit: limit,
            offset: offset,
            order: orderOption
        });

        const viewData = {
            title: "고객센터 게시판 · Admin 대시보드",
            isLoggedIn: req.session.userId ? true : false,
            posts: rows
        };

        res.render('board', viewData);

    } catch (error) {
        console.error('게시물 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

module.exports = router;
