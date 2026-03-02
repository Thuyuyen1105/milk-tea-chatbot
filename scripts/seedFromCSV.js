require('dotenv').config()
const fs = require('fs')
const { parse } = require('csv-parse')
const { sequelize, Product } = require('../src/models')

async function seed() {
    await sequelize.sync({ force: true }) // reset DB cho sạch

    const records = []

    fs.createReadStream('Menu.csv')
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (row) => records.push(row))
        .on('end', async () => {
            for (const row of records) {
                await Product.create({
                    itemId: row.item_id,
                    name: row.name,
                    description: row.description,
                    category: row.category,
                    priceM: parseInt(row.price_m),
                    priceL: parseInt(row.price_l),
                    isTopping: row.category === 'Topping',
                    available:
                        row.available
                            ?.toString()
                            .trim()
                            .toLowerCase() === 'true',
                })
            }

            console.log('Seed done')
            process.exit()
        })
}

seed()