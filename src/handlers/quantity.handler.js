const { Telegraf, Markup, session } = require('telegraf')
const { safeEdit } = require('../helpers/editMessage')


async function showQuantitySelector(ctx) {
    const item = ctx.session.tempItem

    await safeEdit(ctx,
        `🧋 ${item.productName}
Size: ${item.size}

Chọn số lượng:
Số lượng: ${item.quantity}`,
        Markup.inlineKeyboard([
            [
                Markup.button.callback('➖', 'QTY_MINUS'),
                Markup.button.callback(`${item.quantity}`, 'IGNORE'),
                Markup.button.callback('➕', 'QTY_PLUS')
            ],
            [
                // Markup.button.callback('Thêm vào giỏ', 'ADD_TO_CART')
                Markup.button.callback('Tiếp tục chọn topping', 'CHOOSE_TOPPING')
            ],
            [
                Markup.button.callback('❌ Hủy', 'VIEW_MENU1')
            ]
        ])
    )
}

module.exports = {showQuantitySelector}