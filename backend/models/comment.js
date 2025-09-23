const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Comment = sequelize.define('Comment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        // 혐오도를 0 ~ 100 사이의 정수 값으로 저장
        hateful_score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        // 혐오도에 대한 분석 내용을 저장
        hate_reasoning: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // 진위 여부를 'TRUE', 'FALSE', 'UNSURE'로 저장
        veracity: {
            type: DataTypes.ENUM('TRUE', 'FALSE', 'UNSURE'),
            allowNull: false,
            defaultValue: 'TRUE',
        },
        // 진위 여부 판단에 대한 근거를 저장
        veracity_reasoning: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // 진위 여부 판단에 근거가 된 정보 소스(링크)를 저장
        source: {
            type: DataTypes.STRING,
            allowNull: true,
        },
         // 댓글의 주제를 저장 (확장성 고려)
        topic: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // 댓글의 카테고리 저장(확장성 고려)
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'comments',
        timestamps: true,
    });

    Comment.associate = (models) => {
        // Comment는 하나의 User에 속합니다.
        Comment.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE',
        });
        // Comment는 하나의 Post에 속합니다.
        Comment.belongsTo(models.Post, {
            foreignKey: 'postId',
            onDelete: 'CASCADE',
        });
    };

    return Comment;
};