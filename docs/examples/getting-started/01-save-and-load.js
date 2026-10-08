// Tutorial: Getting started with entities, step 2.
// Run: node docs/examples/getting-started/01-save-and-load.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  const seneca = Seneca({ log: 'warn' }).use(Entity)

  // Create an entity object. Nothing is stored yet.
  const alice = seneca.entity('person')
  alice.name = 'Alice'
  alice.location = 'Wonderland'
  console.log('before save:', alice.id, String(alice))

  // save$ sends the message sys:entity,cmd:save to the store.
  // The default in-memory store generates an id and replies with the saved entity.
  const saved = await alice.save$()
  console.log('after save: ', saved.id, String(saved))

  // load$ by id returns a new entity object with the stored data.
  const loaded = await seneca.entity('person').load$(saved.id)
  console.log('loaded:     ', loaded)

  // An entity with an id is updated, not created.
  loaded.location = 'Looking Glass'
  const updated = await loaded.save$()
  console.log('updated:    ', updated.data$())

  // load$ returns null when nothing matches.
  console.log('missing:    ', await seneca.entity('person').load$('no-such-id'))

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
