const { GoogleGenerativeAI } = require("@google/generative-ai")
const stringSimilarity = require("string-similarity")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
})

/* ================================
   INTENT DETECTION (KHÔNG GỌI AI)
================================ */

function detectIntent(text) {
    const t = text.toLowerCase().trim()

    // xem menu
    if (
        t.includes("menu") ||
        t.includes("xem đồ") ||
        t.includes("có gì") ||
        t.includes("bán gì") ||
        t.includes("gửi menu")
    ) return "SHOW_MENU"

    // trợ giúp
    if (
        t.includes("giúp") ||
        t.includes("hướng dẫn") ||
        t === "help"
    ) return "HELP"

    // có dấu hiệu đặt hàng
    if (
        /\d/.test(t) ||
        t.includes("size") ||
        t.includes("ly") ||
        t.includes("cho") ||
        t.includes("mua")
    ) return "ORDER"

    return "UNKNOWN"
}

/* ================================
   AI PARSE ORDER (TRẢ productId)
================================ */

async function parseOrderAI(text, products) {

    const productList = products
        .map(p => `${p.id} - ${p.name}`)
        .join("\n")

    const prompt = `
Bạn là AI đặt trà sữa.

Chỉ được chọn sản phẩm từ danh sách sau:

${productList}

Phân tích tin nhắn:
"${text}"

Nếu không tìm thấy sản phẩm hợp lệ, trả về:
{ "error": "NOT_FOUND" }

Trả JSON duy nhất dạng:

{
  "items": [
    {
      "productId": số nguyên,
      "size": "M hoặc L",
      "quantity": số nguyên,
      "note": ""
    }
  ]
}

Không được tự tạo productId.
Chỉ trả JSON.
`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        let content = response.text()

        content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()

        return JSON.parse(content)

    } catch (err) {
        console.error("Gemini error:", err.message)
        return null
    }
}

/* ================================
   RULE-BASED FALLBACK (MIỄN PHÍ)
================================ */

function fallbackParse(text, products) {
    const input = text.toLowerCase()
    const results = []

    for (const p of products) {
        const name = p.name.toLowerCase()

        const similarity = stringSimilarity.compareTwoStrings(input, name)

        if (input.includes(name) || similarity > 0.4) {

            const sizeMatch = input.match(/\b(m|l)\b/)
            const size = sizeMatch ? sizeMatch[1].toUpperCase() : "M"

            const qtyMatch = input.match(/\d+/)
            const quantity = qtyMatch ? parseInt(qtyMatch[0]) : 1

            const noteMatch = input.match(/ít đá|ít đường|không đá|nhiều đá/)
            const note = noteMatch ? noteMatch[0] : ""

            results.push({
                productId: p.id,
                size,
                quantity,
                note
            })
        }
    }

    if (!results.length) return null

    return { items: results }
}

/* ================================
   MAIN PARSE FUNCTION
================================ */

async function parseOrder(text, products) {

    // 1️⃣ Thử AI trước
    const aiResult = await parseOrderAI(text, products)

    if (aiResult && aiResult.items) {
        return aiResult
    }

    // 2️⃣ Fallback nếu AI fail / hết quota
    console.log("Using fallback parser...")
    return fallbackParse(text, products)
}

module.exports = {
    detectIntent,
    parseOrder
}