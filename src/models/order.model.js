const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Order = sequelize.define('Order', {
    telegramUserId: DataTypes.STRING,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'PENDING',
    },
    totalPrice: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
})

module.exports = Order