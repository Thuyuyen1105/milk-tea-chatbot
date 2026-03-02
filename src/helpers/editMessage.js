async function safeEdit(ctx, text, keyboard) {
    try {
        await ctx.editMessageText(text, keyboard)
    } catch (err) {
        if (err.description?.includes('message is not modified')) {
            return
        }
        console.error(err)
    }
}

module.exports = {safeEdit};