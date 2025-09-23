const express = require('express');
const router = express.Router();
const { db } = require('../db');
const bcrypt = require('bcrypt');

router.get('/', async (req, res) => {
    const users = await db.User.findAll();
    res.status(200).json(users);
});

// 회원 가입
router.post('/signup', async (req, res) => {
    const { username, password, nickname } = req.body;

    if (!username || !password || !nickname) {
        return res.status(400).json({ message: '모든 필드를 입력해야 합니다.' });
    }

    try {
        const existingUser = await db.User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(409).json({ message: '이미 존재하는 사용자 이름입니다.' });
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.User.create({
            username: username,
            password: hashedPassword,
            nickname: nickname,
            is_admin: false // 기본값이지만 명시
        });

        res.status(201).json({
            message: '회원가입 완료.',
            user: {
                id: newUser.id,
                username: newUser.username,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('회원가입 중 오류 발생:', error);
        res.status.jso({ message: 'Internal Server Error' });
    }
});

// ID 유효성 체크
router.get('/check-username', async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ message: 'ID를 입력하세요.' });
    }

    try {
        const existingUser = await db.User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(200).json({ available: false })
        } else {
            return res.status(200).json({ available: true })
        }
    } catch (error) {
        console.error('An error occurred while checking id duplication.');
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 닉네임 유효성 체크
router.get('/check-nickname', async (req, res) => {
    const { nickname } = req.query;
    if (!nickname) {
        return res.status(400).json({ message: '사용자 이름을 입력해주세요.' });
    }

    try {
        const existingUser = await db.User.findOne({ where: { nickname: nickname } });
        if (existingUser) {
            return res.status(200).json({ available: false });
        } else {
            return res.status(200).json({ available: true });
        }
    } catch (error) {
        console.error('An error occurred while checking nickname duplication.', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('유저 네임:', username);

    try {
        const user = await db.User.findOne({ where: { username: username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid ID or PW' });
        }

        const isPasswrodValid = await bcrypt.compare(password, user.password);
        if (!isPasswrodValid) {
            return res.status(401).json({ message: 'Invalid ID or PW' });
        }

        req.session.userId = user.id;
        req.session.isAdmin = true;
        console.log(req.session);

        res.status(200).json({
            message: 'Login Success!',
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error('An Error occurred while login:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
});

// 로그아웃
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('로그아웃 중 오류 발생:', err);
            return res.status(500).json({ message: '로그아웃에 실패했습니다.' });
        }
        res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
    });
});

// 회원 탈퇴
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await db.User.destroy({ where: { id: userId } });

        if (result === 0) {
            return res.status(404).json({ message: 'No user you requested in DB.' });
        }
        res.status(200).json({ message: `userId : ${userId} user is deleted.` });
    } catch (error) {
        console.error('An error occurred while user deletion:', error);
        res.status(500).json({ message: 'Internal Sever Error.' });
    }
});


module.exports = router;

