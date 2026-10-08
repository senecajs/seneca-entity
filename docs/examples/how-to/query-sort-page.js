// How-to: Query, sort and page. Run: node docs/examples/how-to/query-sort-page.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  const seneca = Seneca({ log: 'warn' }).use(Entity)
  const Product = seneca.entity('shop/product')

  const names = ['apple', 'pear', 'kiwi', 'plum', 'fig']
  for (let i = 0; i < names.length; i++) {
    await Product.make$({ id$: 'p' + i, name: names[i], price: (i + 1) * 10, stock: i % 2 }).save$()
  }

  // Field equality
  console.log('stock 1:  ', (await Product.list$({ stock: 1 })).map((p) => p.name))

  // Several ids: an array of ids, or a field matching any value of an array
  console.log('ids:      ', (await Product.list$(['p0', 'p4'])).map((p) => p.name))
  console.log('name in:  ', (await Product.list$({ name: ['kiwi', 'fig'] })).map((p) => p.name))

  // Sort, then page with skip$ and limit$
  console.log('by price: ', (await Product.list$({ sort$: { price: -1 } })).map((p) => p.price))
  console.log('page 2:   ', (await Product.list$({ sort$: { price: 1 }, skip$: 2, limit$: 2 })).map((p) => p.name))

  // Only some fields (id is always included)
  console.log('fields$:  ', (await Product.list$({ name: 'fig', fields$: ['price'] })).map((p) => p.data$(false)))

  // load$ with a query returns the first match; sort$ decides which
  console.log('cheapest: ', (await Product.load$({ sort$: { price: 1 } })).name)

  // Comparison operators: supported by seneca-mem-store, not by every store
  console.log('price>=30:', (await Product.list$({ price: { $gte: 30 } })).map((p) => p.name))

  // Count by listing: there is no count operation in the entity API
  console.log('count:    ', (await Product.list$({ fields$: [] })).length)

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
