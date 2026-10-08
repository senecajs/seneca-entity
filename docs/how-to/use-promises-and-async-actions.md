# Use entities with promises and in async actions

How to use the promise form of the entity API, inside and outside
actions, and how to avoid the one trap: entities in callback mode. The
complete program is
[docs/examples/how-to/promises-async-actions.js](../examples/how-to/promises-async-actions.js).

## 1. Create entities with `seneca.entity`

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity')

const seneca = Seneca({ log: 'warn' }).use(Entity)

const product = await seneca.entity('shop/product').make$({ name: 'kiwi', price: 2 }).save$()
const found = await seneca.entity('shop/product').load$({ name: 'kiwi' })
const all = await seneca.entity('shop/product').list$()
```

Entities created by `seneca.entity` are in *promise mode*: `save$`,
`load$`, `list$`, `remove$` and `native$` return promises when called
without a callback. Entities they create (with `make$`, or as results
of operations) are in promise mode too. `seneca.make$` creates entities
in callback mode instead; see
[Entity API: modes and return values](../reference/entity-api.md#modes-and-return-values).

Promise mode is part of the entity plugin. It works on Seneca 3
without seneca-promisify, which Seneca 3 needs only for `seneca.post`,
`seneca.message` and promise returning `ready` and `close`. On Seneca 4
those are built in.

## 2. Use entities inside async actions

Inside an action, create entities from `this`, the action's delegate:

```js
seneca.message('role:shop,cmd:order', async function (msg) {
  const product = await this.entity('shop/product').load$({ name: msg.product })
  if (null == product) {
    throw new Error('unknown product: ' + msg.product)
  }
  const order = await this.entity('shop/order')
    .make$({ product: product.id, quantity: msg.quantity, total: product.price * msg.quantity })
    .save$()
  return { order: order.data$(false) }
})

const result = await seneca.post('role:shop,cmd:order', { product: 'kiwi', quantity: 3 })
```

Entity messages sent through `this` are children of the action: logs
and traces show them under `role:shop,cmd:order`. An entity created
from the outer `seneca` variable works too, but its messages start new
traces.

## 3. Handle errors with `try` and `catch`

Store errors reject the promise. Validation errors
([Validate entity data](validate-entity-data.md)) are thrown by `save$`
before any message is sent; inside an `async` function that also
becomes a rejection, so one `try` block catches both:

```js
try {
  await seneca.post('role:shop,cmd:order', { product: 'durian', quantity: 1 })
} catch (err) {
  console.log('error:', err.message)   // error: unknown product: durian
}
```

On Seneca 4 the error is the original one. On Seneca 3 it is wrapped
(`seneca: Action cmd:order,role:shop failed: unknown product: durian.`)
with the original as `err.orig`; write `(err.orig || err).message` when
code must run on both.

## 4. Convert callback mode entities before awaiting

Entities that Seneca builds for you are in callback mode: results of
plain messages (`seneca.post('sys:entity,cmd:list,...')`), entities
arriving over a transport, and anything made with `seneca.make$`. Their
store methods do not return promises. `await ent.save$()` on such an
entity resolves at once with the entity itself, without waiting for
the store, and the save runs in the background.

Make a promise mode entity from the data first:

```js
const orders = await seneca.post('sys:entity,cmd:list,base:shop,name:order')
const order = seneca.entity(orders[0].data$())
order.status = 'paid'
await order.save$()
```

`seneca.entity(ent.data$())` keeps the canon, the `id` and every field.
It does not copy `custom$` or `directive$`. The alternative is to call
the methods with a callback, which works in either mode.

## 5. Get the meta data of an operation

Add `meta$: true` to the query (or to the `save$` data) to receive the
action meta data with the result:

```js
const loaded = await seneca.entity('shop/order').load$({ id: order.id, meta$: true })
loaded.meta$.pattern   // 'cmd:load,sys:entity'
loaded.meta$.action    // 'mem-store/entity_load/16'
```

For an array result, `meta$` is a property of the array; for a `null`
result, the promise resolves to `{ entity$: null, meta$ }`.

## 6. Run operations in parallel

Entity promises are ordinary promises:

```js
const [count, cheapest] = await Promise.all([
  seneca.entity('shop/order').list$().then((list) => list.length),
  seneca.entity('shop/order').load$({ sort$: { total: 1 } }),
])
```

## 7. Wait for plugins to load on Seneca 4.0.0-rc5

`await seneca.ready()` does not resolve on an instance that has already
finished loading in Seneca 4.0.0-rc5 (fixed in 4.0.0). The callback
form works on every version:

```js
await new Promise((resolve) => seneca.ready(resolve))
```

## The program's output

```
order: { product: 'ctl4dx', quantity: 3, total: 6, id: '9an9dy' }
error: unknown product: durian
orders: 1 -/shop/order paid
meta$: cmd:load,sys:entity mem-store/entity_load/16
parallel: 1 6
```
