// Tutorial: Getting started with entities, step 5.
// Run: node docs/examples/getting-started/03-callbacks.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

const seneca = Seneca({ log: 'warn' }).use(Entity)

// Close the instance whether the operations succeed or fail.
function finish(err) {
  if (err) {
    console.error(err)
    process.exitCode = 1
  }
  seneca.close()
}

// seneca.make$ creates entities in callback mode.
const book = seneca.make$('book', { title: 'Alice in Wonderland', year: 1865 })

book.save$(function (err, saved, meta) {
  if (err) return finish(err)
  console.log('saved:', saved.id, String(saved))
  console.log('meta: ', meta.pattern)

  // Methods with a callback return the entity, so calls can be chained.
  seneca.make$('book').load$(saved.id, function (err, loaded) {
    if (err) return finish(err)
    console.log('loaded:', loaded.data$(false))

    loaded.list$({ year: 1865 }, function (err, list) {
      if (err) return finish(err)
      console.log('list:', list.length)
      finish()
    })
  })
})
