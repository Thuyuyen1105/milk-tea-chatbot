const { Telegraf } = require('telegraf')
const { Product, OrderItem } = require('../models')
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



module.exports = bot