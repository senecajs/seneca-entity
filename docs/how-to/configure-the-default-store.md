# Configure the default store

How to configure the in-memory store the plugin loads by default,
replace it with another store, and send different kinds of entity to
different stores. The complete program is
[docs/examples/how-to/default-store.js](../examples/how-to/default-store.js).

## What the default is

With the default option `mem_store: true`, the entity plugin loads
[seneca-mem-store](https://github.com/senecajs/seneca-mem-store) on the
root instance while it loads itself. The store registers
`sys:entity,cmd:save` (and `load`, `list`, `remove`, `native`) without
any canon properties, so it handles every entity. The data lives in
memory and is lost when the process exits: good for tests and
prototypes, not for production.

## 1. Configure the default in-memory store

Give seneca-mem-store options through the instance options, under its
plugin name:

```js
Seneca({ plugin: { 'mem-store': { merge: false } } }).use('@seneca/entity')
```

With `merge: false`, saving an entity that has an `id` replaces the
stored data instead of merging into it. The store's options (`map`,
`merge`, `generate_id`, `web.dump`, `prefix`) are documented in its
repository.

## 2. Load the store yourself

Turn off the automatic store and load one explicitly. This gives the
store a tag and options of your choosing:

```js
const seneca = Seneca()
  .use('@seneca/entity', { mem_store: false })
  .use({ name: 'mem-store', tag: 'main' })
```

## 3. Use another store as the default

The same pattern applies to any store plugin: turn off the automatic
store, then load the one you want with its own options.

```js
Seneca()
  .use('@seneca/entity', { mem_store: false })
  .use(require('./my-store'), { /* connection options */ })
```

If you leave `mem_store` on, the store you load later still wins: it
registers the same patterns, and the most recently added action for a
pattern handles it. But the unused in-memory store is loaded as well,
and its close hook still runs, so turn it off.

Writing a store is covered by the tutorial
[Writing a store plugin](../tutorials/writing-a-store-plugin.md).

## 4. Send some kinds to another store

Every store plugin built on the entity plugin's initializer accepts a
`map` option: canon strings mapped to `'*'` (every command) or a list
of commands. A mapped store registers patterns with the canon's parts,
which are more specific than the default store's:

```js
const seneca = Seneca()
  .use('@seneca/entity', { mem_store: false })
  .use({ name: 'mem-store', tag: 'main' })
  .use({ name: 'mem-store', tag: 'logs' }, { map: { '-/-/log': '*' } })
```

`log` entities now go to the second store and everything else to the
first. A canon with unset parts maps a whole base or zone:
`{ 'shop/-/-': '*' }` maps every entity in zone `shop`,
`{ '-/archive/-': ['load', 'list'] }` sends only reads of base
`archive`.

## 5. Check the routing

```js
seneca.list('sys:entity,cmd:save')
// [ { cmd: 'save', name: 'log', sys: 'entity' }, { cmd: 'save', sys: 'entity' } ]
await seneca.entity('log').native$() // the store that handles log entities
```

`native$` is answered by the store that handles the entity's kind, so
it is a quick way to see which store is in charge. With
seneca-mem-store it returns that store's data object,
`{ [base]: { [name]: { [id]: data } } }`. The zone is not part of
seneca-mem-store's key; see
[The canon model](../explanation/canon-model.md#zone-and-storage).

## The program's output

```
plugins: [ 'mem-store$main', 'mem-store$logs' ]
person store holds: [ 'person' ]
log store holds:    [ 'log' ]
save patterns: [ 'log', '(any)' ]
```
