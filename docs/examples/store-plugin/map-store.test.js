// Tutorial: Writing a store plugin. A test with the Node.js test runner.
// Run: node docs/examples/store-plugin/map-store.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Seneca = require('seneca')
const Entity = require('../../..') // in your own project: require('@seneca/entity')
const MapStore = require('./map-store')

function makeSeneca() {
  return Seneca().test().use(Entity, { mem_store: false }).use(MapStore)
}

test('save, load, list, remove', async () => {
  const seneca = makeSeneca()
  await new Promise((resolve) => seneca.ready(resolve))

  const Foo = seneca.entity('foo')
  const foo0 = await Foo.make$({ a: 1 }).save$()
  assert.equal(typeof foo0.id, 'string')

  const foo1 = await Foo.load$(foo0.id)
  assert.deepEqual(foo1.data$(false), { a: 1, id: foo0.id })

  await Foo.make$({ a: 2 }).save$()
  assert.equal((await Foo.list$()).length, 2)
  assert.equal((await Foo.list$({ a: 2 })).length, 1)

  await foo1.remove$()
  assert.equal((await Foo.list$()).length, 1)
  assert.equal(await Foo.load$(foo0.id), null)

  await seneca.close()
})

test('directives', async () => {
  const seneca = makeSeneca()
  await new Promise((resolve) => seneca.ready(resolve))

  const Bar = seneca.entity('bar')
  for (const n of [3, 1, 2]) {
    await Bar.make$({ n, tag: 'x' }).save$()
  }

  const sorted = await Bar.list$({ sort$: { n: -1 } })
  assert.deepEqual(sorted.map((b) => b.n), [3, 2, 1])

  const page = await Bar.list$({ sort$: { n: 1 }, skip$: 1, limit$: 1 })
  assert.deepEqual(page.map((b) => b.n), [2])

  const chosen = await Bar.make$({ id$: 'bar0', n: 0 }).save$()
  assert.equal(chosen.id, 'bar0')

  await Bar.remove$({ tag: 'x', all$: true })
  assert.deepEqual((await Bar.list$()).map((b) => b.id), ['bar0'])

  await seneca.close()
})
