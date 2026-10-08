# Getting started with entities

In this tutorial you will store, query, update and remove data with
Seneca entities, first with promises and then with callbacks, and see
the messages behind the methods. It takes about fifteen minutes. The
finished programs are in
[docs/examples/getting-started](../examples/getting-started/).

You should know the basics of Seneca (messages, patterns, plugins); the
[Seneca getting started tutorial](https://github.com/senecajs/seneca/blob/master/docs/tutorials/getting-started.md)
covers them.

## 1. Install

Node.js 18 or later (22 or 24 recommended), and Seneca 3.x or Seneca 4
(4.0.0-rc5 or later). In a new directory:

```sh
npm init -y
npm install seneca @seneca/entity
```

The plugin brings seneca-mem-store, an in-memory store, so nothing
else is needed to begin. (Versions up to 28.1.0 of the plugin were
published as `seneca-entity`; the package is `@seneca/entity` from the
next version.) The programs below load the plugin with
`require('@seneca/entity')`; the files in `docs/examples` of this
repository use `require('../../..')` instead, to load the repository's
own build.

## 2. Save and load

Create `save-and-load.js`:

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity') // or: seneca.use('entity')

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
```

Run it with `node save-and-load.js`. The ids are random, so yours will
differ:

```
before save: undefined $-/-/person;id=;{name:Alice,location:Wonderland}
after save:  nbr18n $-/-/person;id=nbr18n;{name:Alice,location:Wonderland}
loaded:      Entity {
  'entity$': '-/-/person',
  name: 'Alice',
  location: 'Wonderland',
  id: 'nbr18n'
}
updated:     {
  'entity$': { zone: undefined, base: undefined, name: 'person' },
  name: 'Alice',
  location: 'Looking Glass',
  id: 'nbr18n'
}
missing:     null
```

What happened:

* `seneca.use(Entity)` loaded the plugin, which added `seneca.entity`
  (and `seneca.make$`) to the instance and loaded the in-memory store.
* `seneca.entity('person')` created an entity of kind `person`. Its
  *canon* is `-/-/person`: no zone, no base, name `person` (see
  [The canon model](../explanation/canon-model.md)). Plain properties
  such as `name` are the entity's fields. Properties ending in `$` are
  the API (`save$`, `entity$`); never use that suffix for fields.
* `save$` sent a `sys:entity,cmd:save` message. The store created a
  record, gave it an `id`, and replied with a new entity object. Always
  use that result: seneca-mem-store also sets `id` on the object you
  called `save$` on, but other stores do not, and over a network
  transport the caller's object is never changed.
* A second `save$` on an entity that has an `id` updates the record.
* `String(ent)` gives a compact one line form; `console.log(ent)` shows
  the fields; `data$()` returns a plain object (with `entity$`), and
  `data$(false)` the fields only.

## 3. Query

Create `query.js`. A `list$` query is an object whose fields must equal
the stored values; properties ending in `$` are *directives* that
control the result instead of filtering it:

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity')

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
```

`Person` is an entity like any other, used here as a factory:
`Person.make$(props)` creates a new `person` entity with the given
fields. `make$` with no arguments creates an empty one.

## 4. Remove

Continue `query.js`:

```js
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
```

Output:

```
all:     [ 'Alice', 'Lily', 'Humpty' ]
chess:   [ 'Alice', 'Lily' ]
top two: [ 'Lily:7', 'Humpty:5' ]
humpty:  { name: 'Humpty', game: 'riddles', score: 5, id: '13d89q' }
fields:  [ 'name', 'game', 'score', 'id' ] -/-/person true
after remove: 2
after remove all$: 0
```

Without `all$`, `remove$` with a query removes only the first match.
This is a safety measure: a typo in a query removes one record, not
the table. Every query form and directive is listed in
[Query directives](../reference/query-directives.md).

## 5. Callbacks

`seneca.entity` creates entities whose store methods return promises.
`seneca.make$` creates entities in callback mode, which is how Seneca
2 and 3 code used them. Create `callbacks.js`:

```js
const Seneca = require('seneca')
const Entity = require('@seneca/entity')

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
```

```
saved: 5gdlxq $-/-/book;id=5gdlxq;{title:Alice in Wonderland,year:1865}
meta:  cmd:save,sys:entity
loaded: { title: 'Alice in Wonderland', year: 1865, id: '5gdlxq' }
list: 1
```

The callback receives `(err, result, meta)`; `meta` is the action meta
data of the underlying message. In callback mode a store method called
without a callback runs in the background, and an error goes to the
instance's error handler. The modes and return values are specified in
[Entity API: modes and return values](../reference/entity-api.md#modes-and-return-values).

## 6. What happens underneath

Each method sends one message, and the store answers it. You can send
the same messages yourself:

```js
seneca.act('sys:entity,cmd:load,name:person', { id: saved.id }, Seneca.util.print)
seneca.act('sys:entity,cmd:list,name:person', { q: { game: 'chess' } }, Seneca.util.print)
```

The patterns are listed in [Messages](../reference/messages.md), and
[How entity methods map to actions and stores](../explanation/entities-actions-and-stores.md)
explains the design: because operations are messages, you can
intercept them with priors, route some kinds of entity to other stores,
or send them to another service.

## Next steps

* [Query, sort and page](../how-to/query-sort-and-page.md) for the
  query directives in daily use.
* [Validate entity data](../how-to/validate-entity-data.md) to reject
  bad data before it is stored.
* [Configure the default store](../how-to/configure-the-default-store.md)
  to replace the in-memory store with a real one.
* [Writing a store plugin](writing-a-store-plugin.md) to connect a
  store of your own.
