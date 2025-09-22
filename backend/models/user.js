const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING(80),
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(128),
            allowNull: false,
        },
        nickname: {
            type: DataTypes.STRING(80),
            unique: true,
            allowNull: false,
        },
        is_admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'users',
        timestamps: false,
    });

    return User;
};