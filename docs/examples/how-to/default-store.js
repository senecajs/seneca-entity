// How-to: Configure the default store. Run: node docs/examples/how-to/default-store.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  const seneca = Seneca({ log: 'warn' })
    // Do not load the default in-memory store automatically.
    .use(Entity, { mem_store: false })
    // Store for everything that has no more specific store (the default).
    .use({ name: 'mem-store', tag: 'main' })
    // A second store for one entity kind: only -/-/log messages reach it.
    .use({ name: 'mem-store', tag: 'logs' }, { map: { '-/-/log': '*' } })

  await new Promise((resolve) => seneca.ready(resolve))

  console.log('plugins:', Object.keys(seneca.plugins()).filter((n) => n.startsWith('mem-store')))

  await seneca.entity('person').make$({ name: 'Alice' }).save$()
  await seneca.entity('log').make$({ event: 'login' }).save$()

  // native$ returns the store's underlying data: here each store's own map.
  console.log('person store holds:', Object.keys((await seneca.entity('person').native$()).undefined))
  console.log('log store holds:   ', Object.keys((await seneca.entity('log').native$()).undefined))

  // The patterns show the routing: name:log is a more specific pattern.
  console.log('save patterns:', seneca.list('sys:entity,cmd:save').map((p) => p.name || '(any)'))

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
