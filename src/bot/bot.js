require('dotenv').config()
const { Telegraf, Markup, session } = require('telegraf')


const { Product, OrderItem, Order } = require('../models')
const { getOrCreateOrder } = require('../services/order.service')
const { showMenu } = require('../handlers/menu.handler')
const { showCart, clearAll } = require('../handlers/cart.handler')
const { showOrders, checkout } = require('../handlers/order.handler')
const { showQuantitySelector } = require('../handlers/quantity.handler')
const { safeEdit } = require('../helpers/editMessage')
const {formatMoney} = require('../helpers/formatMoney')
const { detectIntent, parseOrder } = require("../services/ai.service")
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
            `${p.name} (${formatMoney(p.priceM)}đ - ${formatMoney(p.priceL)}đ)`,
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
                `Size M - ${formatMoney(product.priceM)}đ`,
                `SIZE_${product.id}_M`
            ),
            Markup.button.callback(
                `Size L - ${formatMoney(product.priceL)}đ`,
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
        quantity: 1,
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
bot.on("text", async (ctx) => {

    const text = ctx.message.text
    const intent = detectIntent(text)

    const products = await Product.findAll({
        where: { available: true }
    })

    /* ====================
       SHOW MENU
    ==================== */
    if (intent === "SHOW_MENU") {
        // 1. Nhóm sản phẩm theo category
        const groupedProducts = products.reduce((acc, product) => {
            const cat = product.category || "Khác"; // Backup nếu category trống
            if (!acc[cat]) {
                acc[cat] = [];
            }
            acc[cat].push(product);
            return acc;
        }, {});

        // 2. Xây dựng nội dung tin nhắn
        let msg = "📋 **MENU CỦA QUÁN**\n\n";

        for (const category in groupedProducts) {
            msg += `─── **${category.toUpperCase()}** ───\n`; // Tiêu đề danh mục

            groupedProducts[category].forEach(p => {
                // Hiển thị tên kèm giá nếu cần (ví dụ lấy giá)
                msg += `• ${p.name} (${formatMoney(p.priceM)}đ)-  (${formatMoney(p.priceL)}đ) \n`;
            });

            msg += "\n"; // Khoảng trống giữa các danh mục
        }

        return ctx.reply(msg, { parse_mode: "Markdown" });
    }

    /* ====================
       HELP
    ==================== */
    if (intent === "HELP") {
        return ctx.reply(
            "Bạn có thể nhập:\n" +
            "• Cho chị 2 trà vải size L\n" +
            "• Gửi menu\n"
        )
    }

    /* ====================
       ORDER
    ==================== */
    if (intent === "ORDER") {

        const parsed = await parseOrder(text, products)

        if (!parsed || !parsed.items || !parsed.items.length) {
            return ctx.reply("Mình chưa hiểu đơn của bạn 😢")
        }

        // VALIDATE DB
        for (const item of parsed.items) {
            const product = products.find(p => p.id === item.productId)
            if (!product) {
                return ctx.reply("Có sản phẩm không hợp lệ.")
            }
        }

        // CONFIRM
        let confirmMsg = "🛒 Mình hiểu:\n\n"

        parsed.items.forEach((item, i) => {
            const product = products.find(p => p.id === item.productId)
            confirmMsg += `${i + 1}. ${product.name} (${item.size}) x${item.quantity}\n`
        })

        confirmMsg += "\nXác nhận chứ?"

        ctx.session.aiOrder = parsed.items

        return ctx.reply(confirmMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Đúng", callback_data: "AI_CONFIRM" }],
                    [{ text: "❌ Sai", callback_data: "AI_CANCEL" }]
                ]
            }
        })
    }

    return ctx.reply("Bạn cần gì ạ?")
})
// =======================
// FINAL CHECKOUT
// =======================
bot.action('FINAL_CHECKOUT', async ctx => {
    await ctx.answerCbQuery()

    const order = await getOrCreateOrder(ctx.from.id.toString())

    if (!order || order.status !== 'CART') {
        return ctx.reply('Không tìm thấy đơn hàng.')
    }

    const total = await checkout(ctx)
    if (!total) return

    // ===== LẤY CHI TIẾT ĐƠN =====
    const fullOrder = await Order.findOne({
        where: { id: order.id },
        include: {
            model: OrderItem,
            include: Product
        }
    })

    const orderedAt = new Date()
    fullOrder.status = 'CONFIRMED'
    fullOrder.orderedAt = orderedAt
    await fullOrder.save()

    // ===== FORMAT NỘI DUNG =====
    let message = `ĐƠN MỚI\n\n`
    message += `Khách: ${ctx.from.first_name} ${ctx.from.last_name || ''}\n`
    message += `Telegram ID: ${ctx.from.id}\n`
    message += `Thời gian: ${orderedAt.toLocaleString('vi-VN')}\n\n`

    message += `Chi tiết:\n`

    fullOrder.OrderItems.forEach((item, index) => {
        const price = item.basePrice * item.quantity
        message += `${index + 1}. ${item.Product.name} (${item.size}) x${item.quantity} - ${price.toLocaleString('vi-VN')}đ\n`
    })

    message += `\n💰 Tổng tiền: ${total.toLocaleString('vi-VN')}đ\n`

    if (fullOrder.note) {
        message += `\n📝 Ghi chú:\n${fullOrder.note}\n`
    }

    // ===== GỬI CHO MẸ BẠN =====
    await bot.telegram.sendMessage(
        process.env.OWNER_TELEGRAM_ID,
        message,
        Markup.inlineKeyboard([
            [Markup.button.callback('👩‍🍳 Bắt đầu pha', `START_${order.id}`)],
            [Markup.button.callback('❌ Hủy đơn', `CANCEL_${order.id}`)]
        ])

    )

    await safeEdit(ctx,
        '✅ Đặt hàng thành công!\nQuán đang chuẩn bị cho bạn.'
    )
})

bot.action(/START_(\d+)/, async (ctx) => {
    const orderId = ctx.match[1]

    const order = await Order.findByPk(orderId)
    if (!order) return

    order.status = 'PREPARING'
    await order.save()

    await ctx.answerCbQuery('Đã chuyển sang đang pha')

    await ctx.editMessageReplyMarkup({
        inline_keyboard: [
            [{ text: '✅ Đã pha xong', callback_data: `READY_${order.id}` }]
        ]
    })
})
bot.action(/READY_(\d+)/, async (ctx) => {
    const orderId = ctx.match[1]
    const order = await Order.findByPk(orderId)

    order.status = 'READY'
    await order.save()

    await ctx.answerCbQuery('Đã sẵn sàng')

    // Gửi cho khách
    await bot.telegram.sendMessage(
        order.telegramUserId,
        '🧋 Đơn của bạn đã sẵn sàng. Mời bạn ghé quán lấy nhé!'
    )
    await ctx.editMessageReplyMarkup({
        inline_keyboard: [
            [{ text: '📦 Đã nhận', callback_data: `DONE_${order.id}` }]

        ]
    })
})
bot.action(/DONE_(\d+)/, async (ctx) => {
    const orderId = ctx.match[1]
    const order = await Order.findByPk(orderId, {
        include: {
            model: OrderItem,
            include: Product
        }
    })

    if (!order) return

    const completedAt = new Date()


    order.status = 'COMPLETED'
    await order.save()

    await ctx.answerCbQuery('Hoàn tất đơn')
    let message = `✅ ĐƠN ĐÃ HOÀN THÀNH\n\n`
    message += `Khách: ${ctx.from.first_name} ${ctx.from.last_name || ''}\n`
    message += `Telegram ID: ${order.telegramUserId}\n`
    message += `Thời gian đặt: ${order.createdAt.toLocaleString('vi-VN')}\n`
    message += `Hoàn tất lúc: ${completedAt.toLocaleString('vi-VN')}\n\n`

    message += `Chi tiết:\n`

    order.OrderItems.forEach((item, index) => {
        const price = item.basePrice * item.quantity
        message += `${index + 1}. ${item.Product.name} (${item.size}) x${item.quantity} - ${price.toLocaleString('vi-VN')}đ\n`
    })

    message += `\n💰 Tổng tiền: ${order.totalPrice.toLocaleString('vi-VN')}đ\n`

    if (order.note) {
        message += `\n📝 Ghi chú:\n${order.note}\n`
    }

    message += `\n📦 Trạng thái: ĐÃ NHẬN`

    // ===== ĐỔI TEXT & XÓA NÚT =====
    await safeEdit(ctx, message)
})
bot.action(/CANCEL_(\d+)/, async (ctx) => {
    const orderId = ctx.match[1]
    const order = await Order.findByPk(orderId)

    order.status = 'CANCELLED'
    await order.save()

    await bot.telegram.sendMessage(
        order.telegramUserId,
        '❌ Xin lỗi, hiện tại quán không thể thực hiện đơn này.'
    )

    await ctx.answerCbQuery('Đã hủy đơn')
})
bot.action("AI_CONFIRM", async (ctx) => {

    const items = ctx.session.aiOrder
    if (!items) return

    const order = await getOrCreateOrder(ctx.from.id.toString())

    for (const item of items) {

        const product = await Product.findByPk(item.productId)

        const price = item.size === "L"
            ? product.priceL
            : product.priceM

        await OrderItem.create({
            OrderId: order.id,
            ProductId: product.id,
            size: item.size,
            quantity: item.quantity,
            basePrice: price
        })
    }

    ctx.session.aiOrder = null

    await ctx.reply("Đã thêm vào giỏ hàng.")
})
bot.action("AI_CANCEL", async (ctx) => {

    ctx.session.aiOrder = null

    await ctx.answerCbQuery("Đã hủy")

    await ctx.editMessageText("❌ Đã hủy thao tác đặt hàng.")
})
module.exports = bot