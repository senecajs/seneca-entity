// Tutorial: Getting started with entities, steps 3 and 4.
// Run: node docs/examples/getting-started/02-query-and-remove.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

async function main() {
  const seneca = Seneca({ log: 'warn' }).use(Entity)

  // Person is a template: make$ creates entities of the same kind.
  const Person = seneca.entity('person')

  await Person.make$({ name: 'Alice', game: 'chess', score: 3 }).save$()
  await Person.make$({ name: 'Lily', game: 'chess', score: 7 }).save$()
  await Person.make$({ name: 'Humpty', game: 'riddles', score: 5 }).save$()

  // list$ with no query returns everything.
  const all = await Person.list$()
  console.log('all:    ', all.map((p) => p.name))

  // Query fields must equal the given values.
  const players = await Person.list$({ game: 'chess' })
  console.log('chess:  ', players.map((p) => p.name))

  // $ directives control the result; they are not field conditions.
  const top = await Person.list$({ sort$: { score: -1 }, limit$: 2 })
  console.log('top two:', top.map((p) => p.name + ':' + p.score))

  // load$ with a query returns the first match.
  const humpty = await Person.load$({ game: 'riddles' })
  console.log('humpty: ', humpty.data$(false))

  // Entity objects know what they are and what fields they carry.
  console.log('fields: ', humpty.fields$(), humpty.entity$, humpty.is$('person'))

  // remove$ on a loaded entity removes that record.
  await humpty.remove$()
  console.log('after remove:', (await Person.list$()).length)

  // remove$ with a query removes one match; all$ removes every match.
  await Person.remove$({ game: 'chess', all$: true })
  console.log('after remove all$:', (await Person.list$()).length)

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
