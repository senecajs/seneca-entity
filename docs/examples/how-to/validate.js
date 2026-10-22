// How-to: Validate entity data. Run: node docs/examples/how-to/validate.js
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')

// Seneca's validator: shape on Seneca 4, Gubu on Seneca 3, with the same
// builders (Open, Skip, Required, ...).
const Valid = Seneca.valid

async function main() {
  const seneca = Seneca({ log: 'warn' }).use(Entity, {
    ent: {
      // A prepared shape: used as it is. List id so that saved entities,
      // which carry an id, pass the (closed) shape when updated.
      '-/-/person': {
        valid: Valid({ id: String, name: String, age: Number }),
      },
      // A function returning the specification: built by the plugin.
      '-/shop/product': {
        valid: () => ({ name: String, price: Number, tags: [String] }),
      },
      // A JSON shape (for configuration files).
      '-/shop/order': {
        valid_json: { product: 'String', quantity: 1, note: 'Skip(String)' },
      },
    },
  })

  const Person = seneca.entity('person')

  const alice = await Person.make$({ name: 'Alice', age: 7 }).save$()
  console.log('valid:   ', alice.data$(false))

  // On update only the fields present are checked; missing ones are allowed.
  console.log('updated: ', (await Person.make$({ id: alice.id, age: 8 }).save$()).data$(false))

  try {
    await Person.make$({ name: 'Alice', age: 'seven' }).save$()
  } catch (err) {
    console.log('invalid: ', err.message)
    console.log('props:   ', err.props)
  }

  // Defaults from the shape are applied: quantity becomes 1.
  const order = await seneca.entity('shop/order').make$({ product: 'kiwi' }).save$()
  console.log('defaults:', order.data$(false))

  // Check without saving.
  const product = seneca.entity('shop/product').make$({ name: 'fig', price: 'cheap' })
  console.log('valid$():', product.valid$())
  console.log('errors:  ', product.valid$({ errors: true }).map((e) => e.path + ' ' + e.why))

  // The shape itself is available.
  console.log('shape:   ', seneca.entity('shop/order').valid$({ shape: true }).stringify())

  // Validation also runs in callback mode; the error is thrown synchronously.
  try {
    seneca.make$('person', { name: 1 }).save$(function () {})
  } catch (err) {
    console.log('callback mode:', err.props[0])
  }

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
