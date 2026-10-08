# Store protocol

How a store plugin connects to the entity plugin. A store is an
ordinary Seneca plugin that implements the entity commands as plain
functions and registers them with the initializer exported by the
entity plugin. [seneca-mem-store](https://github.com/senecajs/seneca-mem-store)
is the reference implementation; the tutorial
[Writing a store plugin](../tutorials/writing-a-store-plugin.md) builds
one from scratch.

## The initializer

```js
const init = seneca.export('entity/init')
const meta = init(seneca, options, store)      // { tag, desc }
init(seneca, options, store, function (err, tag, desc) { ... })   // legacy callback form
```

| Argument | Meaning |
| -------- | ------- |
| `seneca` | The plugin's Seneca instance (`this` in the plugin definition). The actions are added to it, so they belong to the store plugin. |
| `options` | The store plugin's options. Only `options.map` is read (below). |
| `store` | An object with a `name` and one function per command (below). |

The return value (or the callback arguments) gives the store `tag`, a
number counting the stores of the same name (or the plugin tag when the
store was loaded with one, `seneca.use({ name: 'mem-store', tag: 'main' })`),
and `desc`, a description string `name~tag~canon[~canon...]` for logs.
Returning the tag from the plugin definition (`return { name, tag }`)
registers the store under `name$tag` as well.

The same initializer is also available as `seneca.export('entity/store').init`;
`seneca.export('entity/store').cmds` lists the command names.

## Commands

The `store` object must provide every command it is registered for:
all six, unless the `map` option lists fewer for every canon. A missing
command is a fatal `store_cmd_missing` error.

| Command | Message | Reply |
| ------- | ------- | ----- |
| `save` | `msg.ent` is the entity to save; `msg.q` carries directives (`merge$`, `upsert$`, ...). A new entity has no `id`; `msg.ent.id$` is a chosen id for a new entity. | The saved entity, created with `msg.ent.make$(data)` so that it has the right canon. |
| `load` | `msg.qent` is a template entity of the kind queried; `msg.q` is the query object. | The first matching entity (`msg.qent.make$(data)`) or `null`. |
| `list` | As `load`. | An array of entities, possibly empty. |
| `remove` | As `load`. `msg.q.all$` asks for every match to be removed, `msg.q.load$` for the removed entity to be returned. | `null`, or the removed entity for a single remove with `load$`. |
| `native` | `msg.ent` is the calling entity. | Whatever gives access to the underlying driver (connection, client, raw data). |
| `close` | Called once when the Seneca instance closes. | `reply()` when resources are released. |

Each function is called as a Seneca action: `function (msg, reply, meta)`
with `this` the action delegate. Reply errors with `reply(err)`; they
reach the caller of the entity method.

The query object `msg.q` holds field conditions (keys without `$`) and
directives (keys ending in `$`). Which conditions and directives a
store supports is up to the store; the
[Query directives reference](query-directives.md) lists the common set.
Stores should ignore directives they do not implement rather than
treating them as field conditions.

## Registered patterns

For each canon in `options.map` and each command, the initializer adds
an action with the pattern `sys:entity,cmd:<command>` plus `zone`,
`base` and `name` for the parts of the canon that are set:

```js
seneca.use('mem-store')                                  // all canons: sys:entity,cmd:save etc.
seneca.use('mem-store', { map: { '-/-/log': '*' } })     // sys:entity,cmd:save,name:log etc.
seneca.use(MyStore, { map: { 'shop/-/-': ['save', 'load', 'list', 'remove'] } })  // zone:shop, four commands
```

The `map` keys are canon strings `zone/base/name`, with `-` for a part
that is not set (`base/name` and `name` are accepted too). Do not leave
a part empty: `//log` registers the patterns with `zone:''` and
`base:''`, which no entity message matches. The value is
`'*'` for every command or an array of command names. Without a map
(or with an empty one) the store is registered for `-/-/-`, that is for
every entity: it becomes the default store. A store mapped to a canon
has a more specific pattern and wins over the default store for that
canon. The `close` command is not registered under `sys:entity`; it is
attached to `sys:seneca,cmd:close` so that it runs when the instance
closes, once per store.

The `sys` part comes from the entity plugin's `pattern_fix` option.

## What the wrapper does

Each command function is wrapped before it is added:

* For every command except `save`, `msg.q` is set to `{}` when absent,
  or to `{ id: msg.id }` when the message has an `id` property instead
  of a query, and `msg.qent` is created from the message's `zone`,
  `base` and `name` when absent. This is what lets a plain message such
  as `sys:entity,cmd:load,name:person,id:p1` work.
* If `msg.ent` is a plain object, as in the plain message
  `sys:entity,cmd:save,name:person` with `ent: { name: 'Alice' }`, it is
  converted into an entity of the message's canon.
* The action function is named `entity_<command><zone_><base_><name>`,
  which is the name that appears in `meta.action` and in logs.

## Ids

The entity plugin exports `entity/generate_id`, the function given as
the `generate_id` option (a random 6 character id by default). A store
that has no natural id of its own should use it for new entities, and
should honour `msg.ent.id$` when it is set:

```js
const generate_id = seneca.export('entity/generate_id')
const id = null != ent.id$ ? ent.id$ : generate_id()
```

## Entities crossing the boundary

The store receives real entity objects, not plain data. Use
`ent.data$(false)` to get the fields to persist (no `$` properties, no
`entity$`), `ent.canon$({ object: true })` for the zone, base and name,
and `ent.make$(data)` or `qent.make$(data)` to build the reply. Fields
whose value is an entity are replaced by that entity's `id` in `data$`.

## Testing a store

[seneca-store-test](https://github.com/senecajs/seneca-store-test)
provides the standard suites used by the official stores. See
[Test a store plugin with seneca-store-test](../how-to/test-a-store-plugin-with-store-test.md).
