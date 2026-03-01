const { Telegraf } = require('telegraf')
const { Product, OrderItem, Order } = require('../models')
const { getOrCreateOrder } = require('../services/order.service')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(ctx => {
    ctx.reply('Chào mừng đến với quán Trà Sữa cô Hai. Gõ /menu để xem menu')
})

bot.command('menu', async ctx => {
    const categories = await Product.findAll({
        attributes: ['category'],
        group: ['category'],
    })

    const text = categories.map(c => c.category).join('\n')

    ctx.reply('Danh mục:\n' + text)
})
bot.command('cart', async ctx => {
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

    if (!order || order.OrderItems.length === 0) {
        return ctx.reply('Giỏ hàng đang trống')
    }

    let text = 'Giỏ hàng:\n\n'
    let total = 0

    order.OrderItems.forEach(item => {
        const price = item.basePrice * item.quantity
        total += price

        text += `${item.quantity}x ${item.Product.name} (${item.size || '-'}) - ${price}đ\n`
    })

    text += `\nTổng tiền: ${total}đ`

    ctx.reply(text)
})
bot.command('checkout', async ctx => {
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

    await bot.telegram.sendMessage(
        process.env.OWNER_TELEGRAM_ID,
        `Đơn mới từ ${ctx.from.first_name}\nTổng tiền: ${total}đ`
    )

})
bot.command('clear', async ctx => {
    const order = await Order.findOne({
        where: {
            telegramUserId: ctx.from.id.toString(),
            status: 'CART',
        },
    })

    if (!order) {
        return ctx.reply('Giỏ hàng đã trống')
    }

    await OrderItem.destroy({
        where: { OrderId: order.id },
    })

    ctx.reply('Giỏ hàng đã được xóa')
})

bot.command('orders', async ctx => {
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
})

bot.on('text', async ctx => {
    const code = ctx.message.text.trim()

    const product = await Product.findOne({
        where: { itemId: code },
    })

    if (!product) return

    const order = await getOrCreateOrder(ctx.from.id.toString())

    await OrderItem.create({
        OrderId: order.id,
        ProductId: product.id,
        size: product.isTopping ? null : 'M',
        quantity: 1,
        basePrice: product.priceM,
    })

    ctx.reply('Đã thêm vào giỏ hàng')
})

module.exports = bot