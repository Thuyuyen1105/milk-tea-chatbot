const { Product } = require('./src/models')

async function test() {
    const products = await Product.findAll()
    console.log(products.map(p => p.toJSON()))
}

test()