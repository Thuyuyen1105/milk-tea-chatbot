
const { Markup } = require('telegraf')
const { Product, OrderItem, Order, OrderItemTopping } = require('../models')
const { showMenu } = require('./menu.handler')
const { safeEdit } = require('../helpers/editMessage')
const { formatMoney } = require('../helpers/formatMoney')
const { feature } = require (`../handlers/guide.handler`)
async function showCart(ctx) {

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
            ],
        },
    })

    if (!order || order.OrderItems.length === 0) {
        await showMenu(ctx)
        return safeEdit(ctx, '🛒 Giỏ hàng đang trống')
    }

    let text = '🛒 GIỎ HÀNG\n\n'
    let total = 0
    const buttons = []

    for (let i = 0; i < order.OrderItems.length; i++) {

        const item = order.OrderItems[i]

        // ===== BASE =====
        let itemTotal = item.basePrice * item.quantity

        text += `${i + 1}. ${item.Product.name} (${item.size}) x${item.quantity}`

        text += ` - ${formatMoney(item.basePrice * item.quantity)}đ\n`

        // ===== TOPPING =====
        if (item.OrderItemToppings?.length) {

            for (const topping of item.OrderItemToppings) {

                const toppingTotal = topping.price * item.quantity

                itemTotal += toppingTotal

                text += `   + ${topping.Product.name} x${item.quantity} - ${formatMoney(toppingTotal)}đ\n`
            }
        }

        text += `   ➜ Thành tiền: ${formatMoney(itemTotal)}đ\n\n`

        total += itemTotal

        buttons.push([
            Markup.button.callback(
                `❌ Xóa ${i + 1}`,
                `REMOVE_ITEM_${item.id}`
            )
        ])
    }

    text += `💰 TỔNG: ${formatMoney(total)}đ`

    buttons.push(
        [Markup.button.callback('Hoàn tất đặt món', 'CONFIRM_ORDER')],
        [Markup.button.callback('Tiếp tục mua', 'VIEW_MENU1')],
        [Markup.button.callback('🗑 Xóa toàn bộ', 'CLEAR_CART')],

    )

    await safeEdit(ctx, text, Markup.inlineKeyboard(buttons))
}

module.exports = { showCart }
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
    return feature(ctx)
}
module.exports= {
    showCart,
    clearAll
}