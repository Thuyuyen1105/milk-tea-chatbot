const { Sequelize } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './dev.db',
    logging: false,
})

module.exports = sequelize