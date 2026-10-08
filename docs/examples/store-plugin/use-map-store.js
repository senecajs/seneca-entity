// Tutorial: Writing a store plugin. Uses map-store.js as the only store.
// Run: node docs/examples/store-plugin/use-map-store.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')
const MapStore = require('./map-store')

async function main() {
  const seneca = Seneca({ log: 'warn' })
    .use(Entity, { mem_store: false }) // no default store
    .use(MapStore)

  await new Promise((resolve) => seneca.ready(resolve))

  console.log('store actions:', seneca.list('sys:entity').map((p) => p.cmd).join(','))

  const Fruit = seneca.entity('fruit')
  const apple = await Fruit.make$({ name: 'apple', price: 2 }).save$()
  const pear = await Fruit.make$({ name: 'pear', price: 3 }).save$()
  await Fruit.make$({ id$: 'kiwi0', name: 'kiwi', price: 1 }).save$()
  console.log('saved:', String(apple), String(pear))

  console.log('load by id:  ', (await Fruit.load$('kiwi0')).data$(false))
  console.log('sorted names:', (await Fruit.list$({ sort$: { price: 1 } })).map((f) => f.name))
  console.log('fields$:     ', (await Fruit.list$({ name: 'pear', fields$: ['price'] })).map((f) => f.data$(false)))

  apple.price = 4
  console.log('updated:     ', (await apple.save$()).data$(false))
  console.log('merge$ false:', (await Fruit.make$({ id: pear.id, price: 5 }).save$({ merge$: false })).data$(false))

  console.log('removed:     ', String(await Fruit.remove$({ name: 'kiwi', load$: true })))
  console.log('remaining:   ', (await Fruit.list$()).length)
  const tables = await Fruit.native$()
  console.log('native$:     ', [...tables.keys()], tables.get('-/-/fruit').size)

  await seneca.close()
  console.log('closed, tables cleared:', tables.size)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
