/* Copyright (c) 2022 Richard Rodger and other contributors, MIT License */

const Seneca = require('seneca')
const Entity = require('../')

describe('readme', function () {
  test('quick', async function () {
    const seneca = Seneca().test().use(Entity)
    const Person = seneca.entity('person')

    let alice = Person.make$()

    alice.name = 'Alice'
    alice.location = 'Wonderland'

    alice = await alice.save$()
    // console.log(alice)

    let alsoAlice = await Person.load$(alice.id)
    alsoAlice.location = 'Looking Glass'

    await alsoAlice.save$()

    let lily = await Person.make$({
      name: 'Lily',
      location: 'Looking Glass',
    }).save$()

    // console.log(lily.data$())

    await lily
      .data$({
        game: 'chess',
      })
      .save$()

    let people = await Person.list$()
    // console.log(people)

    let players = await Person.list$({ game: 'chess' })
    // console.log(players)
  })
})
