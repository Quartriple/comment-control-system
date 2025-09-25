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
        const userCount = await db.User.count();

        const recentPosts = await db.Post.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.User, attributes: ['nickname'] },
                { // 댓글 모델을 LEFT JOIN으로 포함하여 개수를 계산합니다.
                    model: db.Comment,
                    attributes: [], 
                    duplicating: false,
                    required: false // LEFT JOIN
                }
            ],
            attributes: {
                include: [
                    // 댓글 개수를 'commentCount'라는 이름으로 집계합니다.
                    [db.sequelize.fn('COUNT', db.sequelize.col('Comments.id')), 'commentCount']
                ]
            },
            group: ['Post.id'], // 게시물 ID별로 그룹화
            subQuery: false
        });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const { 
            veracity, 
            topic, 
            userNickname,
            startDate,   
            endDate,     
            sortBy = 'createdAt', 
            sortOrder = 'DESC' 
        } = req.query; 
        
        const whereClause = {};
        let targetUserId = null;

        if (userNickname) {
            const user = await db.User.findOne({ where: { nickname: userNickname } });
            if (user) {
                targetUserId = user.id;
            } else {
                targetUserId = -1; 
            }
        }
        
        if (targetUserId) {
            whereClause.userId = targetUserId;
        }

        if (veracity) {
            whereClause.veracity = veracity.toUpperCase();
        }

        // topic 필터링 조건 추가 (부분 일치 검색)
        if (topic) {
            whereClause.topic = { [Op.like]: `%${topic}%` };
        }

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt[Op.gte] = new Date(startDate); 
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); 
                end.setHours(0, 0, 0, 0);      
                whereClause.createdAt[Op.lt] = end; 
            }
        }

        const validSortColumns = ['hate_score', 'createdAt', 'updatedAt'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const orderOption = [[sortColumn, sortDirection]];

        // 댓글 목록을 필터링 및 정렬하여 가져옵니다.
        const { count: commentCount, rows: comments } = await db.Comment.findAndCountAll({
            where: whereClause,
            order: orderOption,
            limit: limit,
            offset: offset,
            include: [{ model: db.User, attributes: ['nickname'] }]
        });

        const totalPages = Math.ceil(commentCount / limit);

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
            userNickname: userNickname || '',
            startDate: startDate || '',      
            endDate: endDate || '',          
            currentPage: page,
            limit: limit,
            totalPages: totalPages,
            sortBy: sortColumn,
            sortOrder: sortDirection,
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