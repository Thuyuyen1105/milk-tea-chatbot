# Milk Tea Telegram Bot

Telegram Bot hỗ trợ quán trà sữa tự động nhận đơn hàng, tính tiền và gửi thông tin đơn đến chủ quán.

Bot hỗ trợ:
- Đặt hàng bằng AI (Natural Language)
- Đặt hàng bằng Inline Button
- Quản lý giỏ hàng
- Tính tổng tiền tự động
- Gửi thông báo đơn cho chủ quán

## Demo
Link deploy: https://milk-tea-chatbot.onrender.com
(Do sử dụng render freetier để deploy nên sau 15ph không sử dụng hệ thống ngủ. Trước
khi tương tác với chat bot xin kích hoạt link deploy để khởi động lại )
Bot: https://t.me/milktea_0103_bot
Video demo: https://drive.google.com/drive/folders/16yXPhteo-rozB7AWBxUvBu4oH90TaCcg?usp=drive_link

## Tech Stack

- NodeJS
- Telegraf (Telegram Bot Framework)
- PostgreSQL
- Sequelize ORM
- Google Gemini API (AI parsing)
- Render (Deploy)

## Cài đặt

1. Clone repo

git clone https://github.com/Thuyuyen1105/milk-tea-chatbot
cd milk-tea-chatbot

2. Cài đặt package

npm install

3. Tạo file .env

BOT_TOKEN=
DATABASE_PATH=./dev.db
OWNER_TELEGRAM_ID=
GEMINI_API_KEY=

4. Tạo database và seed dữ liệu

node scripts/seedFromCSV.js

5. Chạy server

npm start

## Environment Variables

| Tên biến | Mô tả |
|----------|-------|
| BOT_TOKEN | Telegram Bot Token |
| DATABASE_URL | Kết nối PostgreSQL |
| OWNER_TELEGRAM_ID | ID Telegram của chủ quán |
| GEMINI_API_KEY | API key cho AI parsing |

## Quy trình xử lý

1. Người dùng gửi tin nhắn
2. Hệ thống phát hiện intent
3. Nếu là đặt hàng → gọi AI
4. Chuẩn hóa dữ liệu
5. Lưu vào giỏ hàng (CART)
6. Xác nhận 2 bước
7. Nhấn FINAL_CHECKOUT
8. Gửi thông tin đơn cho chủ quán

