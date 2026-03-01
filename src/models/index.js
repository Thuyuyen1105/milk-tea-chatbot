const sequelize = require('../database')

const Product = require('./product.model')
const Order = require('./order.model')
const OrderItem = require('./orderItem.model')
const OrderItemTopping = require('./orderItemTopping.model')

// Relations
Order.hasMany(OrderItem)
OrderItem.belongsTo(Order)

Product.hasMany(OrderItem)
OrderItem.belongsTo(Product)

OrderItem.hasMany(OrderItemTopping)
OrderItemTopping.belongsTo(OrderItem)

Product.hasMany(OrderItemTopping, { as: 'ToppingProduct' })
OrderItemTopping.belongsTo(Product)

module.exports = {
    sequelize,
    Product,
    Order,
    OrderItem,
    OrderItemTopping,
}