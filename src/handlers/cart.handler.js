const { Markup } = require('telegraf')
const { Product, OrderItem, Order } = require('../models')
const { showMenu } = require('./menu.handler')
const { safeEdit } = require('../helpers/editMessage')

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
        return safeEdit(ctx,'🛒 Giỏ hàng đang trống')
    }

    let text = '🛒 GIỎ HÀNG\n\n'
    let total = 0

    const buttons = []

    order.OrderItems.forEach((item, index) => {
        const price = item.basePrice * item.quantity
        total += price

        text += `${index + 1}. ${item.Product.name} (${item.size}) x${item.quantity} - ${price}đ\n`

        // 👉 Nút xoá từng sản phẩm
        buttons.push([
            Markup.button.callback(
                `❌ Xóa ${index + 1}`,
                `REMOVE_ITEM_${item.id}`
            )
        ])
    })

    text += `\nTổng: ${total}đ`

    // Nút cuối
    buttons.push(
        [Markup.button.callback('💳 Thanh toán', 'CONFIRM_ORDER')],
        [Markup.button.callback('🗑 Xóa toàn bộ', 'CLEAR_CART')],
        [Markup.button.callback('🛍 Tiếp tục mua', 'VIEW_MENU')]
    )

    await safeEdit(ctx,text, Markup.inlineKeyboard(buttons))
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