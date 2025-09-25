const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Post = sequelize.define('Post', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        views: { // 조회수
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        likes: { // 좋아요
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        is_published: { // 공개 여부
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
    }, {
        tableName: 'posts',
        timestamps: true, // `createdAt`과 `updatedAt` 자동 추가.
        // paranoid: true, // 소프트 삭제(바로 삭제x, `deletedAt` 컬럼을 통해 보여질지 말지 관리)를 활성화합니다.
    });

    // 사용자 모델과 관계 설정
    Post.associate = (models) => {
        Post.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE',
        });
        Post.hasMany(models.Comment, {
            foreignKey: 'postId',
            onDelete: 'CASCADE',
        });
    };

    return Post;
};