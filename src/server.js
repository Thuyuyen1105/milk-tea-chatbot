require('dotenv').config()

const express = require('express')
const { sequelize } = require('./models')
const bot = require('./bot/bot')

const app = express()
const PORT = process.env.PORT || 3000

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

app.get('/', (req, res) => {
    res.send('Milk Tea Bot is running')
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

start()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))