// How-to: Share entities across services over a transport.
// Two instances in one process: a data service that owns the store, and a
// client that has no store of its own. Run: node docs/examples/how-to/transport.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  // The data service: entity plugin with the default in-memory store,
  // exposing every entity message (pattern sys:entity) over HTTP.
  // Expected errors would be logged; keep the output readable.
  const service = Seneca({ tag: 'service', log: 'silent' })
    .use('seneca-transport')
    .use(Entity)
    .listen({ type: 'web', port: 8270, pin: 'sys:entity' })

  await new Promise((resolve) => service.ready(resolve))

  // A rule that lives in the service: people need a name.
  service.message('sys:entity,cmd:save,name:person', async function (msg) {
    if (null == msg.ent.name) {
      throw new Error('a person needs a name')
    }
    return this.prior(msg)
  })

  // The client: entity plugin without a store; entity messages go to the service.
  const client = Seneca({ tag: 'client', log: 'silent' })
    .use('seneca-transport')
    .use(Entity, { mem_store: false })
    .client({ type: 'web', port: 8270, pin: 'sys:entity' })

  await new Promise((resolve) => client.ready(resolve))

  // The same API; the data lives in the service.
  const saved = await client.entity('person').make$({ name: 'Alice', born: new Date(0) }).save$()
  console.log('client saved:', saved)

  const people = await client.entity('person').list$({ sort$: { name: 1 } })
  console.log('client list: ', people.map((p) => p.name))

  console.log('service has: ', (await service.entity('person').load$(saved.id)).data$(false))

  // Entities rebuilt from a reply are in callback mode: their methods do not
  // return promises. Make a promise mode entity from the data to await them.
  const alice = client.entity(saved.data$())
  alice.location = 'Wonderland'
  await alice.save$()
  console.log('service sees:', (await service.entity('person').load$(alice.id)).location)

  // Errors raised in the service reach the client as errors.
  try {
    await client.entity('person').make$({ location: 'nowhere' }).save$()
  } catch (err) {
    console.log('remote error:', err.message)
  }

  await client.close()

  // seneca-transport 8.3.0 stops its HTTP listener in a role:seneca,cmd:close
  // hook. Seneca 3 and Seneca 4.0.0 call that hook when closing; 4.0.0-rc5
  // does not, so call it here or the process does not exit.
  if ('4.0.0-rc5' === service.version) {
    await service.post('role:seneca,cmd:close')
  }
  await service.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
