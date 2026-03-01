const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const OrderItem = sequelize.define('OrderItem', {
    size: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    basePrice: DataTypes.INTEGER,
})

module.exports = OrderItem