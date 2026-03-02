const { Markup } = require('telegraf')
const { Product, OrderItem, Order } = require('../models')
const { showMenu } = require('./menu.handler')

async function showCart(ctx) {
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
        await showMenu(ctx)
        return ctx.editMessageText('🛒 Giỏ hàng đang trống')
    }

    let text = 'GIỎ HÀNG\n\n'
    let total = 0

    order.OrderItems.forEach((item, index) => {
        const price = item.basePrice * item.quantity
        total += price

        text += `${index + 1}. ${item.Product.name} (${item.size}) x${item.quantity} - ${price}đ\n`
    })

    text += `\nTổng: ${total}đ`

    const buttons = [
        [Markup.button.callback('Thanh toán', 'CONFIRM_ORDER')],
        [Markup.button.callback('Xóa giỏ', 'CLEAR_CART')],
        [Markup.button.callback('Tiếp tục mua', 'VIEW_MENU')]
    ]

    await ctx.editMessageText(text, Markup.inlineKeyboard(buttons))
}


async function clearAll(ctx) {
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
}
module.exports= {
    showCart,
    clearAll
}