const { Order, OrderItem, OrderItemTopping, Product } = require('../models')

async function getOrCreateOrder(userId) {
    let order = await Order.findOne({
        where: { telegramUserId: userId, status: 'PENDING' },
    })

    if (!order) {
        order = await Order.create({
            telegramUserId: userId,
        })
    }

    return order
}

async function calculateTotal(orderId) {
    const items = await OrderItem.findAll({
        where: { OrderId: orderId },
        include: [OrderItemTopping],
    })

    let total = 0

    for (const item of items) {
        let itemTotal = item.basePrice * item.quantity

        for (const topping of item.OrderItemToppings) {
            itemTotal += topping.price * item.quantity
        }

        total += itemTotal
    }

    await Order.update({ totalPrice: total }, { where: { id: orderId } })

    return total
}

module.exports = { getOrCreateOrder, calculateTotal }