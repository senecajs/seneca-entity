/* Copyright (c) 2022-2026 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')

describe('readme', function () {
  // Mirrors the Quick Example in README.md.
  test('quick', async function () {
    const seneca = Seneca().test().use(Entity)

    const Person = seneca.entity('person')

    const alice = await Person.make$({
      name: 'Alice',
      location: 'Wonderland',
    }).save$()

    const found = await Person.load$(alice.id)
    found.location = 'Looking Glass'
    await found.save$()

    await Person.make$({ name: 'Lily', game: 'chess' }).save$()

    const people = await Person.list$({ sort$: { name: 1 } })
    expect(people.map((p) => p.data$(false))).toMatchObject([
      { name: 'Alice', location: 'Looking Glass', id: alice.id },
      { name: 'Lily', game: 'chess' },
    ])

    const players = await Person.list$({ game: 'chess' })
    expect(players.map((p) => p.name)).toEqual(['Lily'])

    await seneca.close()
  })
})
