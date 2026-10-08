# Messages

Every action pattern the entity plugin and its default store add, and
the messages the entity methods send. Patterns use the `sys:entity`
prefix, which comes from the `pattern_fix` option.

## Entity actions

The entity plugin itself adds no actions. The store plugins add them,
through the initializer described in the
[Store protocol](store-protocol.md): one action per command and
mapped canon. With the default store (seneca-mem-store, loaded by the
`mem_store` option) the patterns are:

| Pattern | Sent by | Message properties | Reply |
| ------- | ------- | ------------------ | ----- |
| `sys:entity,cmd:save` | `save$` | `ent` (the entity), `q` (directives), `name`, `base`, `zone` | The saved entity. |
| `sys:entity,cmd:load` | `load$` | `qent` (template entity), `q` (query), `name`, `base`, `zone` | The first matching entity or `null`. |
| `sys:entity,cmd:list` | `list$` | `qent`, `q`, `name`, `base`, `zone` | Array of entities. |
| `sys:entity,cmd:remove` | `remove$` | `qent`, `q`, `name`, `base`, `zone` | `null`, or the removed entity with `load$: true`. |
| `sys:entity,cmd:native` | `native$` | `ent`, `name`, `base`, `zone` | The store's native handle (seneca-mem-store: its data object). |

A store mapped to a canon adds the canon parts to the pattern:
`seneca.use('mem-store', { map: { '-/-/log': '*' } })` adds
`sys:entity,cmd:save,name:log` and so on, which are more specific than
the default store's patterns and therefore win for that kind.

The parts of the canon that are not set are `undefined` in the message
(a `-/-/person` entity sends `name: 'person'` with `base` and `zone`
undefined), so they do not match patterns that require them and are
dropped when the message is serialized. The `cmd:close` command is not
exposed as a `sys:entity` action; see below.

## Plain messages

The actions accept plain messages too, which is how other services and
scripts use a store without entity objects:

```js
seneca.act('sys:entity,cmd:save,name:person', { ent: { id$: 'p1', name: 'Alice' } }, reply)
seneca.act('sys:entity,cmd:load,name:person', { id: 'p1' }, reply)
seneca.act('sys:entity,cmd:load,name:person', { q: { name: 'Alice' } }, reply)
seneca.act('sys:entity,cmd:list,name:person', { q: { name: 'Alice' } }, reply)
seneca.act('sys:entity,cmd:remove,name:person', { id: 'p1' }, reply)
```

The store wrapper fills in what is missing: a plain `ent` object becomes
an entity of the message's canon, `qent` is created from `name`, `base`
and `zone`, and `id` is turned into `q: { id }` when `q` is absent
(`q` wins when both are given). Replies carry entities: Seneca converts
a result that has an `entity$` property into an entity object
(`outward_res_entity`), so `seneca.post('sys:entity,cmd:load,...')`
resolves to an entity with its methods. These entities are in callback
mode (see [Entity API: modes](entity-api.md#modes-and-return-values)).

## Directives in messages

Properties of the entity's `directive$` map are copied to the top level
of the message (`msg.audit$`), and `msg.ent.custom$` carries the
entity's custom data. The query `q` carries the query directives
(`sort$`, `limit$`, `fields$`, ...). See
[Query directives](query-directives.md).

## Translations

For compatibility with Seneca 2 and 3 code, the plugin translates the
old patterns to the new ones when it loads:

| From | To |
| ---- | -- |
| `role:entity,cmd:load` | `sys:entity,cmd:load` |
| `role:entity,cmd:save` | `sys:entity,cmd:save` |
| `role:entity,cmd:list` | `sys:entity,cmd:list` |
| `role:entity,cmd:remove` | `sys:entity,cmd:remove` |

The `role` property is dropped from the forwarded message. The
translation also applies to patterns added later: an action added with
`seneca.add('role:entity,cmd:save', ...)` handles `sys:entity,cmd:save`
messages, in the same chain as actions added for `sys:entity,cmd:save`,
so priors written for either form work together.

## Close

A store's `close` command is attached to `sys:seneca,cmd:close` as a
prior, so it runs when `seneca.close()` is called, once per store
instance (a `closed$` flag prevents a second call). On Seneca 3 the
pattern is translated to `role:seneca,cmd:close` by the core. The entity
method `close$` sends `sys:entity,cmd:close`, which no store registers;
it is deprecated.

## Default store actions

seneca-mem-store, when loaded, adds these actions for its own purposes:

| Pattern | Message | Reply |
| ------- | ------- | ----- |
| `role:mem-store,cmd:dump` | none | The whole data object: `{ [base]: { [name]: { [id]: data } } }`. The zone is not part of the storage key. |
| `role:mem-store,cmd:export` | none | `{ json }`: the data as a JSON string. |
| `role:mem-store,cmd:import` | `json` (string), `merge` (boolean) | Replaces the data, or merges into it with `merge: true`. |

## Exports

Not messages, but values available through `seneca.export`:

| Export | Value |
| ------ | ----- |
| `entity/init` | The store initializer `init(seneca, options, store)`. |
| `entity/store` | `{ cmds, init }`: the command names and the initializer. |
| `entity/generate_id` | The id generator (the `generate_id` option bound to the instance). |
| `Entity` | The `Entity` class, for `instanceof` checks and prototype extension. |

The plugin decorates the instance with `seneca.entity`, `seneca.make$`
and `seneca.make`, and adds `seneca.util.parsecanon`. See the
[Entity API](entity-api.md).
