const { Markup } = require("telegraf")
async function feature(ctx){

    return ctx.reply(
        `Bạn muốn làm gì tiếp nào`,
        Markup.inlineKeyboard([
            [
                Markup.button.callback("📋 Xem Menu", "VIEW_MENU"),
                Markup.button.callback("🛒 Giỏ Hàng", "VIEW_CART")
            ],
        ])
    )
}
async function showGuide(ctx) {

    const message =
        `🤖 HƯỚNG DẪN SỬ DỤNG BOT ĐẶT TRÀ SỮA

📌 CÁCH 1: Dùng nút bấm
- Bấm "📋 Xem Menu" để xem sản phẩm
- Bấm "🛒 Giỏ Hàng" để xem đơn hiện tại

📌 CÁCH 2: Đặt hàng bằng AI (gõ tự nhiên như nói chuyện)

Ví dụ:
• Cho chị 2 trà vải size L
• 1 trà đào M ít đá
• 3 trà sữa thêm trân châu
• 2 trà chanh leo L thêm pudding ít đường

Bot sẽ tự hiểu:
- Tên món
- Size (M/L)
- Số lượng
- Topping

Bạn chỉ cần xác nhận lại trước khi thêm vào giỏ.
Ghi chú sẽ được thêm ở cuối quá trình đặt đơn

Chúc bạn đặt hàng vui vẻ 🧋✨
`

    return ctx.reply(
        message,
        Markup.inlineKeyboard([
            [
                Markup.button.callback("📋 Xem Menu", "VIEW_MENU"),
                Markup.button.callback("🛒 Giỏ Hàng", "VIEW_CART")
            ],
        ])
    )
}

module.exports = { showGuide, feature }