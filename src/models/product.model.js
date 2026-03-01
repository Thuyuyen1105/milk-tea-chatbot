const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Product = sequelize.define('Product', {
    itemId: {
        type: DataTypes.STRING,
        unique: true,
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    category: DataTypes.STRING,
    priceM: DataTypes.INTEGER,
    priceL: DataTypes.INTEGER,
    isTopping: DataTypes.BOOLEAN,
    available: DataTypes.BOOLEAN,
})

module.exports = Product