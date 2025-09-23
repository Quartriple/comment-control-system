const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite 데이터베이스 연결 설정
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'project.db'),
    logging: false
});

// 모델 정의를 가져와서 데이터베이스와 연결
const User = require('./models/user')(sequelize);
const Comment = require('./models/comment')(sequelize);
const Post = require('./models/post')(sequelize);

// 모델들을 객체로 내보내 다른 파일에서 사용 가능
const db = {
    sequelize,
    User,
    Comment,
    Post,
};

// 모델 관계 설정
if (db.User.associate) {
    db.User.associate(db);
}
if (db.Comment.associate) {
    db.Comment.associate(db);
}
if (db.Post.associate) {
    db.Post.associate(db);
}

// DB Schema 동기화
async function syncDatabase() {
    try {
        // force: true, 동기화할 때마다 기존 테이블 삭제 및 재생성(**개발 단계에서만 사용!)
        await sequelize.sync({ force: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.log('Unable to sync the database.', error);
    }
}

module.exports = { db, syncDatabase };

