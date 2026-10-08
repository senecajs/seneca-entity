# Writing a store plugin

In this tutorial you will write a complete store plugin: a store that
keeps entities in JavaScript `Map` objects, supports the common query
directives, and passes the standard store tests. Along the way you will
see exactly what the entity plugin expects from a store. The finished
files are in [docs/examples/store-plugin](../examples/store-plugin/).

You should have completed [Getting started with entities](getting-started.md).
The protocol itself is specified in the [Store protocol](../reference/store-protocol.md)
reference.

## 1. The shape of a store

A store is an ordinary Seneca plugin. Instead of adding actions one by
one, it describes its commands in an object and passes it to the
initializer that the entity plugin exports. Create `map-store.js`:

```js
function map_store(options) {
  const seneca = this

  // The entity plugin exports the store initializer and the id generator.
  const init = seneca.export('entity/init')
  const generate_id = seneca.export('entity/generate_id')

  const store = {
    name: 'map-store',
    save(msg, reply) {},
    load(msg, reply) {},
    list(msg, reply) {},
    remove(msg, reply) {},
    native(msg, reply) {},
    close(msg, reply) {},
  }

  const meta = init(seneca, options, store)

  return { name: store.name, tag: meta.tag }
}

map_store.defaults = {
  map: {},
}

Object.defineProperty(map_store, 'name', { value: 'map-store' })

module.exports = map_store
```

`init` adds one action per command: `sys:entity,cmd:save`,
`sys:entity,cmd:load` and so on (and attaches `close` to the instance's
close). Every one of the six commands must exist, or `init` fails with
`store_cmd_missing`. The `map` option, passed straight to `init`, lets
users map the store to some kinds of entity only; empty means "every
entity". Returning `tag` also registers each loaded copy under its own
name: `map-store$1` for the first copy loaded without a tag,
`map-store$archive` for a copy loaded with the tag `archive`.

The definition function's `name` property is fixed with
`Object.defineProperty` so that bundlers that rename functions do not
change the plugin name.

## 2. Tables

Entities of one kind share a canon (`zone/base/name`). Keep one `Map`
of id to data per canon:

```js
  // One Map of id to plain data per entity kind (zone/base/name).
  const tables = new Map()

  function table(ent) {
    const key = ent.canon$({ string: true })
    if (!tables.has(key)) {
      tables.set(key, new Map())
    }
    return tables.get(key)
  }
```

Commands receive real entity objects, so `ent.canon$()` is always
available. A database store would map the canon to a table or a
collection here.

## 3. Save

```js
    // msg.ent is the entity to save; msg.q carries the directives.
    save(msg, reply) {
      const ent = msg.ent
      const q = msg.q || {}
      const rows = table(ent)
      // Plain fields only (no $ properties), copied so that the stored
      // data and the caller's entity do not share objects.
      const data = seneca.util.deep(ent.data$(false))

      if (null == ent.id) {
        // New entity: use the chosen id (id$) or generate one.
        data.id = null != ent.id$ ? ent.id$ : generate_id()
      } else if (rows.has(data.id) && false !== q.merge$ && false !== ent.merge$) {
        // Update: merge into the stored data unless merge$ is false.
        Object.assign(data, { ...rows.get(data.id), ...data })
      }

      rows.set(data.id, data)
      reply(null, ent.make$(seneca.util.deep(data)))
    },
```

Four rules every store follows:

* `ent.data$(false)` is what to persist: the fields, without `entity$`
  or any `$` property.
* No `id` means a new entity. The caller may have chosen the id with
  `id$`; otherwise the store makes one. `entity/generate_id` produces
  the same random ids as the default store.
* An entity with an `id` is an update. Merging into the stored data is
  the convention; the `merge$: false` directive (in `q`, or on the
  entity) asks for replacement.
* Reply with `ent.make$(data)`: a new entity of the same kind with the
  stored data. Copy the data in both directions, so that later changes
  to the caller's objects do not change the stored data and the other
  way round.

## 4. Queries

`load`, `list` and `remove` share one helper. The query `msg.q` is
normally an object of field conditions and directives; `list$` can also
send an id or an array of ids as they are:

```js
  // Select rows matching the query. The query is an id, an array of ids,
  // or an object: field equality, then the directives.
  function select(rows, q) {
    if ('string' === typeof q || 'number' === typeof q) {
      q = { id: q }
    } else if (Array.isArray(q)) {
      q = { id: q }
    }

    let out = []
    for (const row of rows.values()) {
      let match = true
      for (const key of Object.keys(q)) {
        if (key.endsWith('$')) continue
        // An array of values matches any of them (used for lists of ids).
        const ok = Array.isArray(q[key]) ? q[key].includes(row[key]) : row[key] === q[key]
        if (!ok) {
          match = false
          break
        }
      }
      if (match) {
        out.push(seneca.util.deep(row)) // copies: callers must not share stored data
      }
    }

    if (q.sort$) {
      const [field, direction] = Object.entries(q.sort$)[0]
      const sign = direction < 0 ? -1 : 1
      out.sort((a, b) => sign * (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
    }
    if (q.skip$ > 0) {
      out = out.slice(q.skip$)
    }
    if (q.limit$ >= 0) {
      out = out.slice(0, q.limit$)
    }
    if (Array.isArray(q.fields$)) {
      out = out.map((row) => {
        const picked = { id: row.id }
        for (const field of q.fields$) {
          if (field in row) picked[field] = row[field]
        }
        return picked
      })
    }
    return out
  }
```

Properties ending in `$` are directives, never field conditions. The
order matters: filter, sort, skip, limit, then pick fields. Invalid
`skip$` and `limit$` values (negative, or not numbers) are ignored.

## 5. Load, list and remove

```js
    // msg.qent is a template entity of the kind queried; msg.q the query.
    load(msg, reply) {
      const list = select(table(msg.qent), msg.q)
      reply(null, 0 < list.length ? msg.qent.make$(list[0]) : null)
    },

    list(msg, reply) {
      const list = select(table(msg.qent), msg.q)
      reply(null, list.map((row) => msg.qent.make$(row)))
    },

    remove(msg, reply) {
      const q = msg.q
      const rows = table(msg.qent)
      let list = select(rows, q)
      if (!q.all$) {
        list = list.slice(0, 1)
      }
      for (const row of list) {
        rows.delete(row.id)
      }
      // load$:true asks for the removed entity (single removes only).
      const removed = !q.all$ && q.load$ && list[0] ? msg.qent.make$(list[0]) : null
      reply(null, removed)
    },
```

These commands get `msg.qent` (an entity of the queried kind, built by
the entity plugin when the message did not carry one) instead of
`msg.ent`. Build results with `msg.qent.make$(data)`. A missing entity
is `null`, an empty list is `[]`. `remove` removes one match unless the
query says `all$: true`.

## 6. Native access and closing

```js
    // native$ exposes the underlying driver, here the Maps themselves.
    native(msg, reply) {
      reply(null, tables)
    },

    // Called once when the Seneca instance closes.
    close(msg, reply) {
      tables.clear()
      reply()
    },
```

`native` returns whatever lets callers bypass the entity API: a
database connection or client. `close` releases resources; the entity
plugin calls it once, when `seneca.close()` runs, on Seneca 3 and 4.

## 7. Use the store

Create `use-map-store.js`:

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity')
const MapStore = require('./map-store')

async function main() {
  const seneca = Seneca({ log: 'warn' })
    .use(Entity, { mem_store: false }) // no default store
    .use(MapStore)

  await new Promise((resolve) => seneca.ready(resolve))

  console.log('store actions:', seneca.list('sys:entity').map((p) => p.cmd).join(','))

  const Fruit = seneca.entity('fruit')
  const apple = await Fruit.make$({ name: 'apple', price: 2 }).save$()
  const pear = await Fruit.make$({ name: 'pear', price: 3 }).save$()
  await Fruit.make$({ id$: 'kiwi0', name: 'kiwi', price: 1 }).save$()
  console.log('saved:', String(apple), String(pear))

  console.log('load by id:  ', (await Fruit.load$('kiwi0')).data$(false))
  console.log('sorted names:', (await Fruit.list$({ sort$: { price: 1 } })).map((f) => f.name))
  console.log('fields$:     ', (await Fruit.list$({ name: 'pear', fields$: ['price'] })).map((f) => f.data$(false)))

  apple.price = 4
  console.log('updated:     ', (await apple.save$()).data$(false))
  console.log('merge$ false:', (await Fruit.make$({ id: pear.id, price: 5 }).save$({ merge$: false })).data$(false))

  console.log('removed:     ', String(await Fruit.remove$({ name: 'kiwi', load$: true })))
  console.log('remaining:   ', (await Fruit.list$()).length)
  const tables = await Fruit.native$()
  console.log('native$:     ', [...tables.keys()], tables.get('-/-/fruit').size)

  await seneca.close()
  console.log('closed, tables cleared:', tables.size)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

`mem_store: false` stops the entity plugin from loading its in-memory
store, so this store is the only one. Run it:

```
store actions: load,save,list,remove,native
saved: $-/-/fruit;id=97x24m;{name:apple,price:2} $-/-/fruit;id=5ifz7z;{name:pear,price:3}
load by id:   { name: 'kiwi', price: 1, id: 'kiwi0' }
sorted names: [ 'kiwi', 'apple', 'pear' ]
fields$:      [ { id: '5ifz7z', price: 3 } ]
updated:      { name: 'apple', price: 4, id: '97x24m' }
merge$ false: { id: '5ifz7z', price: 5 }
removed:      $-/-/fruit;id=kiwi0;{name:kiwi,price:1}
remaining:    2
native$:      [ '-/-/fruit' ] 2
closed, tables cleared: 0
```

There is no `close` among the store actions: `close` is attached to the
instance's close instead of being a `sys:entity` action.

## 8. Test it

A first test, with the Node.js test runner
([map-store.test.js](../examples/store-plugin/map-store.test.js)):

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const Seneca = require('seneca')
const Entity = require('@seneca/entity')
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
```

```
✔ save, load, list, remove (284.449366ms)
✔ directives (260.001675ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

(The file also has a `directives` test for `sort$`, `skip$`, `limit$`,
`id$` and `all$`.) Then run the standard suites of seneca-store-test,
as the official stores do; this store passes the `init`, `keyvalue`,
`basic`, `sort` and `limits` suites (76 tests). See
[Test a store plugin with seneca-store-test](../how-to/test-a-store-plugin-with-store-test.md).

## What you built

* A plugin that registers its commands through `entity/init`, so the
  entity API, plain `sys:entity` messages, priors and transports all
  work with it.
* Save semantics shared by every store: ids, `id$`, merge on update,
  copies in and out.
* The common query directives.

## Next steps

* Support `upsert$` (save an entity without `id` by updating the one
  that matches the listed fields) and the `merge` plugin option, then
  add `upserttest` and `mergetest`.
* Replace the `Map` objects with a database client, opened in
  `seneca.prepare` (or `seneca.init`) and closed in `close`.
* Read [How entity methods map to actions and stores](../explanation/entities-actions-and-stores.md).
