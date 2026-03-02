require('dotenv').config()
const { Telegraf, Markup, session } = require('telegraf')


const { Product, OrderItem } = require('../models')
const { getOrCreateOrder } = require('../services/order.service')
const { showMenu } = require('../handlers/menu.handler')
const { showCart, clearAll } = require('../handlers/cart.handler')
const { showOrders, checkout } = require('../handlers/order.handler')
const { safeEdit } = require('../helpers/editMessage')
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {}
    }
    return next()
})

// =======================
// START
// =======================
bot.start(async ctx => {
    const keyboard = [
        [
            Markup.button.callback('📋 Xem Menu', 'VIEW_MENU'),
            Markup.button.callback('🛒 Giỏ Hàng', 'VIEW_CART')
        ],
        [
            Markup.button.callback('📦 Lịch Sử Đơn Hàng', 'VIEW_HISTORY')
        ]
    ]

    await ctx.reply(
        'Chào mừng đến với quán Trà Sữa cô Hai',
        Markup.inlineKeyboard(keyboard)
    )
})

// =======================
// COMMANDS
// =======================
bot.command('menu', async(ctx)=>
{

    await showMenu(ctx)
})
bot.command('cart', showCart)
bot.command('clear', clearAll)
bot.command('orders', showOrders)

// =======================
// CATEGORY
// =======================
bot.action(/CATEGORY_(.+)/, async ctx => {
    await ctx.answerCbQuery()
    const category = ctx.match[1]

    const products = await Product.findAll({
        where: { category, available: true }
    })

    const buttons = products.map(p => [
        Markup.button.callback(
            `${p.name} (${p.priceM}đ - ${p.priceL}đ)`,
            `PRODUCT_${p.id}`
        )
    ])

    buttons.push([
        Markup.button.callback('⬅️ Quay lại', 'VIEW_MENU1')
    ])

    await safeEdit(ctx,
        `Danh mục: ${category}`,
        Markup.inlineKeyboard(buttons)
    )
})

// =======================
// PRODUCT → CHỌN SIZE
// =======================
bot.action(/PRODUCT_(\d+)/, async ctx => {
    await ctx.answerCbQuery()

    const product = await Product.findByPk(ctx.match[1])
    if (!product) return

    const buttons = [
        [
            Markup.button.callback(
                `Size M - ${product.priceM}đ`,
                `SIZE_${product.id}_M`
            ),
            Markup.button.callback(
                `Size L - ${product.priceL}đ`,
                `SIZE_${product.id}_L`
            )
        ],
        [
            Markup.button.callback(
                'Quay lại',
                `CATEGORY_${product.category}`
            )
        ]
    ]

    await safeEdit(ctx,
        `Chọn size cho ${product.name}`,
        Markup.inlineKeyboard(buttons)
    )
})

// =======================
// LỰA CHỌN SIZE
// =======================
bot.action(/SIZE_(\d+)_(M|L)/, async ctx => {
    await ctx.answerCbQuery()

    const productId = ctx.match[1]
    const size = ctx.match[2]

    const product = await Product.findByPk(productId)
    if (!product) return

    const price = size === 'M' ? product.priceM : product.priceL

    // Lưu tạm vào session
    ctx.session.tempItem = {
        productId: product.id,
        productName: product.name,
        size,
        basePrice: price,
        quantity: 1
    }

    await showQuantitySelector(ctx)
})
// =======================
// LỰA CHỌN SỐ LƯỢNG
// =======================
bot.action('QTY_PLUS', async ctx => {
    await ctx.answerCbQuery()

    ctx.session.tempItem.quantity += 1
    await showQuantitySelector(ctx)
})

bot.action('QTY_MINUS', async ctx => {
    await ctx.answerCbQuery()

    if (ctx.session.tempItem.quantity > 1) {
        ctx.session.tempItem.quantity -= 1
    }

    await showQuantitySelector(ctx)
})
bot.action('ADD_TO_CART', async ctx => {
    await ctx.answerCbQuery()

    const item = ctx.session.tempItem
    if (!item) return

    const order = await getOrCreateOrder(ctx.from.id.toString())

    await OrderItem.create({
        OrderId: order.id,
        ProductId: item.productId,
        size: item.size,
        quantity: item.quantity,
        basePrice: item.basePrice,
    })

    ctx.session.tempItem = null

    await safeEdit(ctx,
        `Đã thêm ${item.productName} (${item.size}) x${item.quantity} vào giỏ`
    )

    await ctx.reply(
        'Bạn muốn làm gì tiếp theo?',
        Markup.inlineKeyboard([
            [Markup.button.callback('🛒 Xem giỏ hàng', 'VIEW_CART')],
            [Markup.button.callback('➕ Thêm món khác', 'VIEW_MENU1')]
        ])
    )
})
// =======================
// VIEW MENU
// =======================
bot.action('VIEW_MENU', async ctx => {
    await ctx.answerCbQuery()
    await showMenu(ctx, true)
})
bot.action('VIEW_MENU1', async ctx => {
    await ctx.answerCbQuery()
    await showMenu(ctx, true)
})
// =======================
// VIEW CART
// =======================
bot.action('VIEW_CART', async ctx => {
    await ctx.answerCbQuery()
    await showCart(ctx)
})

// =======================
// VIEW HISTORY
// =======================
bot.action('VIEW_HISTORY', async ctx => {
    await ctx.answerCbQuery()
    await showOrders(ctx)
})

// =======================
// XOÁ GIỎ
// =======================
bot.action('CLEAR_CART', async ctx => {
    await ctx.answerCbQuery()
    await clearAll(ctx)
})
// =======================
// CONFIRM ORDER → HỎI NOTE
// =======================
bot.action('CONFIRM_ORDER', async ctx => {
    await ctx.answerCbQuery()

    const order = await getOrCreateOrder(ctx.from.id.toString())

    if (!order || order.status !== 'CART') {
        return ctx.reply('Không tìm thấy đơn hàng.')
    }

    ctx.session.waitingOrderNote = true

    await ctx.reply(
        `📝 Bạn có ghi chú cho toàn bộ đơn hàng không?

Ví dụ:
- Giao trước 5h chiều
- Ít đá tất cả các ly
- Gọi trước khi giao

Nếu không có, hãy gõ: KHONG`
    )
})

bot.action(/REMOVE_ITEM_(\d+)/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {})

    const itemId = ctx.match[1]

    await OrderItem.destroy({
        where: { id: itemId }
    })

    await showCart(ctx)
})
// =======================
// NHẬN TEXT NOTE
// =======================
bot.on('text', async ctx => {

    if (!ctx.session.waitingOrderNote) return

    const order = await getOrCreateOrder(ctx.from.id.toString())
    const text = ctx.message.text.trim()

    if (text.toUpperCase() !== 'KHONG') {
        order.note = text
    }

    await order.save()

    ctx.session.waitingOrderNote = false

    await ctx.reply(
        'Đã ghi nhận ghi chú.\nBạn xác nhận đặt hàng?',
        Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Xác nhận đặt hàng', 'FINAL_CHECKOUT')]
        ])
    )
})

// =======================
// FINAL CHECKOUT
// =======================
bot.action('FINAL_CHECKOUT', async ctx => {
    await ctx.answerCbQuery()

    const total = await checkout(ctx)
    if (!total) return

    await bot.telegram.sendMessage(
        process.env.OWNER_TELEGRAM_ID,
        `Đơn mới từ ${ctx.from.first_name}\n💰 Tổng: ${total}đ`
    )

    await safeEdit(ctx,
        'Đặt hàng thành công!\nQuán đang chuẩn bị cho bạn.'
    )
})

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
                Markup.button.callback('Thêm vào giỏ', 'ADD_TO_CART')
            ],
            [
                Markup.button.callback('❌ Hủy', 'VIEW_MENU1')
            ]
        ])
    )
}


module.exports = bot