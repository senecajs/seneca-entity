# Validate entity data

How to reject invalid data before it reaches the store, using
[Gubu](https://github.com/rjrodger/gubu) shapes in the `ent` option.
The complete program is
[docs/examples/how-to/validate.js](../examples/how-to/validate.js).

## 1. Define a shape per entity kind

The `ent` option is keyed by canon string. Each entry can have a
`valid` shape, in one of three forms, or a `valid_json` shape:

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity')

// Gubu is bundled with Seneca; Seneca.util.Gubu is the copy Seneca uses.
const Gubu = Seneca.util.Gubu

const seneca = Seneca({ log: 'warn' }).use(Entity, {
  ent: {
    // A Gubu shape: used as it is. List id so that saved entities,
    // which carry an id, pass the (closed) shape when updated.
    '-/-/person': {
      valid: Gubu({ id: String, name: String, age: Number }),
    },
    // A function returning the specification: wrapped by the plugin.
    '-/shop/product': {
      valid: () => ({ name: String, price: Number, tags: [String] }),
    },
    // A JSON shape (for configuration files).
    '-/shop/order': {
      valid_json: { product: 'String', quantity: 1, note: 'Skip(String)' },
    },
  },
})
```

* A prepared shape (`Gubu({...})`, or `seneca.valid({...})` on Seneca 4)
  is used as it is. Shapes built by any copy or version of Gubu work,
  including `Seneca.util.Gubu` (Gubu 9 on Seneca 4, Gubu 8 on Seneca 3).
* A plain specification object, or a function returning one, is wrapped
  with the plugin's own Gubu. The function form avoids sharing one
  specification object between kinds.
* `valid_json` is the JSON form produced by `shape.jsonify()`, built
  with `Gubu.build`. Types are strings (`'String'`, `'Number'`), values
  are defaults (`quantity: 1` means a number, default 1), and builders
  are written as strings (`'Skip(String)'`, `$$: 'Open'`).

## 2. Save valid and invalid data

```js
const Person = seneca.entity('person')

const alice = await Person.make$({ name: 'Alice', age: 7 }).save$()

try {
  await Person.make$({ name: 'Alice', age: 'seven' }).save$()
} catch (err) {
  console.log('invalid: ', err.message)
  console.log('props:   ', err.props)
}
```

```
valid:    { name: 'Alice', age: 7, id: 'pf6ury' }
invalid:  Validation failed for property "age" with string "seven" because the string is not of type number.
props:    [ { path: 'age', what: 'type', type: 'number', value: 'seven' } ]
```

Validation runs inside `save$`, before any message is sent, and the
error is thrown. With `await` it becomes a rejection; in callback mode
it is thrown synchronously from the `save$` call, so wrap the call in
`try`/`catch` rather than checking `err` in the callback. The error is
a `GubuError`; `err.props` lists each failure with its path, the check
that failed, the expected type and the value (see
[Errors](../reference/errors.md)).

## 3. Defaults are applied

A shape value that is not a type is a default. Saving an order without
a quantity stores `quantity: 1`:

```js
const order = await seneca.entity('shop/order').make$({ product: 'kiwi' }).save$()
// defaults: { product: 'kiwi', quantity: 1, id: '70o50t' }
```

## 4. Check without saving

`valid$` runs the same check on the entity's current data:

```js
const product = seneca.entity('shop/product').make$({ name: 'fig', price: 'cheap' })
product.valid$()                    // false
product.valid$({ errors: true })    // [ { path: 'price', why: 'type', ... } ]
product.valid$({ throws: true })    // throws the GubuError
seneca.entity('shop/order').valid$({ shape: true }).stringify()
// {"product":"String","quantity":"1","note":"\"\""}
```

`valid$()` returns `true` for kinds without a shape. When the data is
valid, defaults from the shape are written into the entity.

## 5. Updates and the `id` field

A saved entity carries an `id`. Gubu shapes are closed by default
(unknown properties fail), so a shape that does not mention `id`
rejects every update:

```
Validation failed for object "{id:cyard3,a:2}" because the property "id" is not allowed.
```

Either list `id: String` in the shape, as the `person` shape above
does (`id` is skipped when the entity is new and has none), or make
the shape open: `Gubu.Open({ name: String })`, or `$$: 'Open'` in
`valid_json`. An open shape also accepts fields you did not declare.

When the entity has an `id`, every top level field is treated as
optional, so a partial update such as `make$({ id, age: 8 }).save$()`
passes; present values are still type checked. A new entity must
satisfy the whole shape.

```
updated:  { name: 'Alice', age: 8, id: 'pf6ury' }
```

## 6. Skip fields for one save

The `skip$` directive in the `save$` data names fields that may be
absent this time (their values are still checked when present):

```js
await seneca.entity('bar').save$({ a: 1, skip$: ['b'] })   // b is required by the shape, but not now
```

## 7. Only known kinds

With `strict: true`, creating an entity whose canon is not in `ent`
throws `Entity: unknown entity: -/-/persn`. Kinds that need no
validation are listed with an empty object (`'-/-/thing': {}`), and a
canon pattern with unset parts admits a whole zone or base
(`'sys/-/-': {}`).

```js
seneca.use(Entity, { strict: true, ent: { '-/-/person': { valid: personShape }, '-/-/thing': {} } })
```

## 8. Where validation does not run

The shapes apply to `save$` and `valid$` only. A plain
`sys:entity,cmd:save` message sent with `seneca.act`, and data arriving
from a transport, are not validated by the plugin. To validate at the
store boundary as well, add a prior on `sys:entity,cmd:save` that calls
`msg.ent.valid$({ throws: true })` (see
[Customize operations with priors](customize-operations-with-priors.md)).

## The program's output

```
valid:    { name: 'Alice', age: 7, id: 'pf6ury' }
updated:  { name: 'Alice', age: 8, id: 'pf6ury' }
invalid:  Validation failed for property "age" with string "seven" because the string is not of type number.
props:    [ { path: 'age', what: 'type', type: 'number', value: 'seven' } ]
defaults: { product: 'kiwi', quantity: 1, id: 'hxc8m3' }
valid$(): false
errors:   [ 'price type' ]
shape:    {"product":"String","quantity":"1","note":"\"\""}
callback mode: { path: 'name', what: 'type', type: 'string', value: 1 }
```
