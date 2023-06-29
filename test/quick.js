const Seneca = require('seneca')
const Entity = require('..')

async function run() {
  let s0 = Seneca().test().use(Entity)

  let x0 = await s0.entity('foo').save$({ x: 0 })
  console.log('x0', x0)
}

run()
