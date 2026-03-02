require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Dùng thư viện này

// 1. Khởi tạo với API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function main() {
    try {
        // 2. Chọn model (flash cho rẻ và nhanh)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            // Chỉ định AI luôn trả về JSON để bạn dễ lưu vào database
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            Bạn là máy lọc đơn hàng trà sữa. 
            Khách nói: "Lấy cho tui 2 hồng trà sữa ít đường ship qua 123 Lê Lợi, sđt 0901234567"
            Hãy lọc ra JSON: { "item": string, "quantity": number, "address": string, "phone": string }
        `;

        const result = await model.generateContent(prompt);
        console.log("Dữ liệu đơn hàng:", result.response.text());

    } catch (error) {
        console.error("Lỗi rồi:", error.message);
    }
}

main();
