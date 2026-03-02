const { Telegraf,Markup } = require('telegraf')
const { Product, OrderItem, Order, OrderItemTopping } = require('../models')

async function showOrders(ctx) {
    const orders = await Order.findAll({
        where: {
            telegramUserId: ctx.from.id.toString(),
            status: ['CONFIRMED', 'PREPARING', 'COMPLETED']
        },
        include: {
            model: OrderItem,
            include: [
                Product,
                {
                    model: OrderItemTopping,
                    required: false
                }
            ]
        },
    })

    if (orders.length === 0) {
        return ctx.reply('Bạn chưa có đơn hàng nào')
    }

    let text = 'Lịch sử đơn hàng:\n\n'

    for (const order of orders) {
        let total = 0

        order.OrderItems.forEach(item => {
            total += item.basePrice * item.quantity
        })

        text += `Đơn #${order.id} - ${total}đ\n`
    }

    ctx.reply(text)
}async function checkout(ctx) {

    const order = await Order.findOne({
        where: {
            telegramUserId: ctx.from.id.toString(),
            status: 'CART',
        },
        include: {
            model: OrderItem,
            include: [
                Product,
                {
                    model: OrderItemTopping,
                    include: Product,
                    required: false
                }
            ]
        }
    })

    if (!order || order.OrderItems.length === 0) {
        await ctx.reply('Không có đơn hàng để thanh toán')
        return null
    }

    let total = 0

    for (const item of order.OrderItems) {

        let itemTotal = item.basePrice * item.quantity

        if (item.OrderItemToppings?.length) {
            for (const topping of item.OrderItemToppings) {
                itemTotal += topping.price * item.quantity
            }
        }

        total += itemTotal
    }

    order.status = 'CONFIRMED'
    order.totalPrice = total
    await order.save()

    return order   // 🔥 TRẢ VỀ FULL ORDER
}

module.exports= {
    showOrders,
    checkout
}