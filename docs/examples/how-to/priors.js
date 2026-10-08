// How-to: Customize entity operations with priors. Run: node docs/examples/how-to/priors.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  // Expected errors would be logged at level warn; keep the output readable.
  const seneca = Seneca({ log: 'silent' }).use(Entity)
  await new Promise((resolve) => seneca.ready(resolve))

  // Add a timestamp to every saved entity of every kind.
  seneca.message('sys:entity,cmd:save', async function (msg) {
    msg.ent.saved_at = 'T0'
    return this.prior(msg)
  })

  // Validate one kind: more specific pattern, runs first.
  seneca.message('sys:entity,cmd:save,name:person', async function (msg) {
    if (null == msg.ent.name) {
      throw new Error('a person needs a name')
    }
    return this.prior(msg)
  })

  // Hide a field when listing: wrap the store's reply.
  seneca.message('sys:entity,cmd:list,name:person', async function (msg) {
    const list = await this.prior(msg)
    for (const person of list) {
      delete person.secret
    }
    return list
  })

  // Per operation hints travel with the entity as directive$ or custom$.
  seneca.message('sys:entity,cmd:save,name:person', async function (msg) {
    if (msg.audit$) {
      msg.ent.audit = msg.audit$
    }
    if (msg.ent.custom$.source) {
      msg.ent.source = msg.ent.custom$.source
    }
    return this.prior(msg)
  })

  const Person = seneca.entity('person')

  const alice = await Person.make$({ name: 'Alice', secret: 'x' })
    .directive$({ audit$: 'ticket-1' })
    .custom$({ source: 'import' })
    .save$()
  console.log('saved:', alice.data$(false))

  try {
    await Person.make$({ secret: 'y' }).save$()
  } catch (err) {
    console.log('rejected:', err.message)
  }

  console.log('listed:', (await Person.list$()).map((p) => p.data$(false)))

  // Other kinds are not affected by the name:person actions.
  console.log('thing:', (await seneca.entity('thing').make$({ secret: 'z' }).save$()).data$(false))

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
