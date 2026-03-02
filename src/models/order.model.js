const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Order = sequelize.define('Order', {
    telegramUserId: DataTypes.STRING,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'CART',
    },
    totalPrice: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    note: DataTypes.STRING,
})

module.exports = Order