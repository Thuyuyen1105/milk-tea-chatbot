const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const OrderItemTopping = sequelize.define('OrderItemTopping', {
    price: DataTypes.INTEGER,
})

module.exports = OrderItemTopping