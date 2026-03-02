const { Order, OrderItem, OrderItemTopping, Product } = require('../models')

async function getOrCreateOrder(userId) {
    let order = await Order.findOne({
        where: { telegramUserId: userId, status: 'CART' },
    })

    if (!order) {
        order = await Order.create({
            telegramUserId: userId,
            status: 'CART',
        })
    }

    return order
}
async function calculateTotal(orderId) {

    const items = await OrderItem.findAll({
        where: { OrderId: orderId },
        include: {
            model: OrderItemTopping,
            required: false   // QUAN TRỌNG: vẫn lấy item dù không có topping
        }
    })

    let total = 0

    for (const item of items) {

        // Giá base x số lượng
        let itemTotal = item.basePrice * item.quantity

        // Nếu có topping
        if (item.OrderItemToppings?.length) {

            for (const topping of item.OrderItemToppings) {
                itemTotal += topping.price * item.quantity
            }
        }

        total += itemTotal
    }

    await Order.update(
        { totalPrice: total },
        { where: { id: orderId } }
    )

    return total
}

module.exports = { getOrCreateOrder, calculateTotal }