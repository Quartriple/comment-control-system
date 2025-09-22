const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const port = 3000;

const { syncDatabase } = require('./db');
const indexRouter = require('./routes/index');
const commentsRouter = require('./routes/comments');

const app = express();

syncDatabase();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/comments', commentsRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
})

module.exports = app;
