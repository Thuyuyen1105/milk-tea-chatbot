require('dotenv').config()
const { sequelize } = require('./models')

async function start() {
    await sequelize.sync({ alter: true })
    console.log('Database synced')
}

start()