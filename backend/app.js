const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fileStore = require('session-file-store')(session);
const expressLayouts = require('express-ejs-layouts');
const port = 3000;

const { syncDatabase } = require('./db');
const indexRouter = require('./routes/index');
const commentsRouter = require('./routes/comments');
const userRouter = require('./routes/user');
const postRouter = require('./routes/post');

const app = express();

syncDatabase();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    httpOnly: true,    // 자바스크립트를 통해 세션 쿠키를 사용할 수 없도록 함
    secure: false,    // https 환경에서만 session 정보를 주고받도록처리
    secret: 'secret key',    // 암호화하는 데 쓰일 키
    resave: false,    // 세션을 언제나 저장할지 설정함
    saveUninitialized: true,    // 세션이 저장되기 전 uninitialized 상태로 미리 만들어 저장
    cookie: {    // 세션 쿠키 설정 (세션 관리 시 클라이언트에 보내는 쿠키)
      httpOnly: true,
      Secure: true
    },
    store : new fileStore()
  }));

app.use('/', indexRouter);
app.use('/comments', commentsRouter);
app.use('/user', userRouter);
app.use('/post', postRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
})

module.exports = app;
