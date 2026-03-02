const { Markup } = require('telegraf')
const { Product } = require('../models')
const { safeEdit } = require('../helpers/editMessage')

async function showMenu(ctx, isEdit = false) {
    const categories = await Product.findAll({
        attributes: ['category'],
        where: {
            available: true,
        },
        group: ['category'],
    })

    const filtered = categories
        .map(c => c.category)
        .filter(c => c !== 'Topping')

    const buttons = filtered.map(c => [
        Markup.button.callback(c, `CATEGORY_${c}`)
    ])

    buttons.push([
        Markup.button.callback('🛒 Giỏ hàng', 'VIEW_CART')
    ])

    const keyboard = Markup.inlineKeyboard(buttons)

    if (isEdit) {
        return safeEdit(ctx, 'Chọn danh mục:', keyboard)
    }
    return ctx.reply('Chọn danh mục:', keyboard)
}

module.exports = { showMenu }