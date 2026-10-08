// How-to: Use entities with promises and in async actions.
// Run: node docs/examples/how-to/promises-async-actions.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  // Expected errors would be logged at level warn; keep the output readable.
  const seneca = Seneca({ log: 'silent' }).use(Entity)

  // An async action uses this.entity: the entity belongs to the action's
  // delegate, so its messages are traced as children of the action.
  seneca.message('role:shop,cmd:order', async function (msg) {
    const product = await this.entity('shop/product').load$({ name: msg.product })
    if (null == product) {
      throw new Error('unknown product: ' + msg.product)
    }
    const order = await this.entity('shop/order')
      .make$({ product: product.id, quantity: msg.quantity, total: product.price * msg.quantity })
      .save$()
    return { order: order.data$(false) }
  })

  await new Promise((resolve) => seneca.ready(resolve))

  await seneca.entity('shop/product').make$({ name: 'kiwi', price: 2 }).save$()

  const result = await seneca.post('role:shop,cmd:order', { product: 'kiwi', quantity: 3 })
  console.log('order:', result.order)

  try {
    await seneca.post('role:shop,cmd:order', { product: 'durian', quantity: 1 })
  } catch (err) {
    console.log('error:', err.message)
  }

  // Results of plain messages are entities too, but in callback mode (they
  // are built with seneca.make$), so their methods take callbacks. Make a
  // promise mode entity from the data before awaiting its methods.
  const orders = await seneca.post('sys:entity,cmd:list,base:shop,name:order')
  const order = seneca.entity(orders[0].data$())
  order.status = 'paid'
  await order.save$()
  const reloaded = await seneca.entity('shop/order').load$(order.id)
  console.log('orders:', orders.length, orders[0].entity$, reloaded.status)

  // Meta data of the operation: ask for it with the meta$ directive.
  const loaded = await seneca.entity('shop/order').load$({ id: orders[0].id, meta$: true })
  console.log('meta$:', loaded.meta$.pattern, loaded.meta$.action)

  // Several operations in parallel
  const [count, first] = await Promise.all([
    seneca.entity('shop/order').list$().then((list) => list.length),
    seneca.entity('shop/order').load$({ sort$: { total: 1 } }),
  ])
  console.log('parallel:', count, first.total)

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
