require('dotenv').config()

const { sequelize } = require('./models')
const bot = require('./bot/bot')

async function start() {
    try {
        await sequelize.sync()
        console.log('Database synced')

        await bot.launch()
        console.log('Bot is running...')
    } catch (error) {
        console.error(error)
    }
}

start()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))