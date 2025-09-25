const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 게시물 작성
router.post('/', async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }

    try {
        const newPost = await db.Post.create({
            title: title,
            content: content,
            userId: userId
        });

        res.redirect('/');
    } catch (error) {
        console.error('게시물 생성 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

router.get('/new', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/user/login');
    }

    // `layout.ejs`에 필요한 데이터와 함께 뷰를 렌더링합니다.
    res.render('new', {
        title: "새 게시물 작성",
        isLoggedIn: !!req.session.userId,
        isAdmin: !!req.session.isAdmin,
        nickname: req.session.nickname
    });
});

// 게시물 조회
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
            order: orderOption,
            include: [{ 
                model: db.User,
                attributes: ['nickname']
            }]
        });

        res.status(200).json({
            totalPosts: count,
            currentPage: page,
            postsPerPage: limit,
            totalPages: Math.ceil(count / limit),
            posts: rows
        });

    } catch (error) {
        console.error('게시물 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

// 게시물 수정
router.patch('/:id', async (req, res) => {
    const userId = req.session.userId;
    const postId = req.params.id;
    const { title, content } = req.body;

    try {
        // 로그인 상태 확인
        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        // 게시물 존재 여부 및 작성자 확인
        const post = await db.Post.findOne({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ message: '해당 게시물을 찾을 수 없습니다.' });
        }

        // 로그인된 사용자가 게시물의 작성자인지 확인
        if (post.userId !== userId) {
            return res.status(403).json({ message: '게시물을 수정할 권한이 없습니다.' });
        }

        // 게시물 업데이트
        const updatedPost = await post.update({
            title: title || post.title,
            content: content || post.content,
        });

        res.status(200).json({
            message: '게시물이 성공적으로 수정되었습니다.',
            post: updatedPost
        });

    } catch (error) {
        console.error('게시물 수정 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

router.get('/:id/edit', async (req, res) => {
    const postId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/user/login');
    }

    try {
        const post = await db.Post.findOne({
            where: { id: postId },
            include: [{
                model: db.User, // 게시물 작성자 정보 포함
                attributes: ['id', 'nickname']
            }]
        });

        if (!post) {
            return res.status(404).render('error', {
                title: "오류",
                message: '해당 게시물을 찾을 수 없습니다.'
            });
        }

        const user = await db.User.findByPk(userId);
        const isAdmin = user && user.is_admin;

        // 게시물 작성자이거나 관리자만 수정 페이지에 접근 가능
        if (post.userId !== userId && !isAdmin) {
            return res.status(403).render('error', {
                title: "권한 없음",
                message: '게시물을 수정할 권한이 없습니다.'
            });
        }

        res.render('edit', {
            title: `게시물 수정: ${post.title}`,
            isLoggedIn: !!userId,
            isAdmin: isAdmin,
            post: post,
            users: await db.User.findAll({ attributes: ['id', 'nickname'] }) // 작성자 변경을 위한 사용자 목록
        });

    } catch (error) {
        console.error('게시물 수정 페이지 로딩 중 오류 발생:', error);
        res.status(500).render('error', {
            title: "오류",
            message: '서버 내부 오류가 발생했습니다.'
        });
    }
});

// 게시물 삭제
router.delete('/:id', async (req, res) => {
    const userId = req.session.userId;
    const postId = req.params.id;

    try {
        if (!userId) {
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        }

        const post = await db.Post.findOne({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ message: '해당 게시물을 찾을 수 없습니다.' });
        }
        
        // 로그인된 사용자의 admin 여부 확인
        const user = await db.User.findByPk(userId);
        const isAdmin = user && user.is_admin;

        // 게시물 작성자이거나 관리자인지 검증
        if (post.userId !== userId && !isAdmin) {
            return res.status(403).json({ message: '게시물을 삭제할 권한이 없습니다.' });
        }

        // 소프트 삭제 실행
        // Model에 paranoid: true 설정이 되어있으므로, destroy() 호출 시 deletedAt 필드가 채워짐.
        // 별도의 조건 없이도 소프트 삭제된 게시물은 조회 결과에서 제외됨.
        await db.Post.destroy({ where: { id: postId } });

        res.status(200).json({ message: '게시물이 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error('게시물 삭제 중 오류 발생:', error);
        res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

// 게시물 상세보기
router.get('/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await db.Post.findOne({
            where: { id: postId },
            include: [{
                model: db.User, // 게시물 작성자 정보 포함
                attributes: ['nickname', 'is_admin']
            }, {
                model: db.Comment,
                as: 'Comments',
                order: [['createdAt', 'DESC']],
                include: [{
                    model: db.User, // 댓글 작성자 정보 포함
                    attributes: ['nickname', 'is_admin']
                }]
            }]
        });

        if (!post) {
            return res.status(404).render('error', {
                title: "오류",
                message: '해당 게시물을 찾을 수 없습니다.'
            });
        }

        // 조회수 증가 로직 (선택사항)
        await post.increment('views');

        res.render('show', {
            title: post.title,
            isLoggedIn: !!req.session.userId,
            isAdmin: req.session.isAdmin,
            user: req.session.userId ? { id: req.session.userId, is_admin: req.session.isAdmin } : null,
            post: post,
        });

    } catch (error) {
        console.error('게시물 상세 조회 중 오류 발생:', error);
        res.status(500).render('error', {
            title: "오류",
            message: '서버 내부 오류가 발생했습니다.'
        });
    }
});

module.exports = router;