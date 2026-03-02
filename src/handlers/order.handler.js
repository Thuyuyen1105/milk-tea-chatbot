const { Telegraf,Markup } = require('telegraf')
const { Product, OrderItem, Order } = require('../models')

async function showOrders(ctx) {
    const orders = await Order.findAll({
        where: {
            telegramUserId: ctx.from.id.toString(),
            status: ['CONFIRMED', 'PREPARING', 'COMPLETED']
        },
        include: {
            model: OrderItem,
            include: Product,
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
}
async function checkout(ctx) {
    const order = await Order.findOne({
        where: {
            telegramUserId: ctx.from.id.toString(),
            status: 'CART',
        },
        include: {
            model: OrderItem,
            include: Product,
        },
    })

    if (!order) {
        return ctx.reply('Không có đơn hàng để thanh toán')
    }

    order.status = 'CONFIRMED'
    let total = 0

    order.OrderItems.forEach(item => {
        const price = item.basePrice * item.quantity
        total += price

    })

    order.totalPrice=total
    await order.save()
    ctx.reply('Xác nhận đặt đơn thành công')
    return total
}
module.exports= {
    showOrders,
    checkout
}