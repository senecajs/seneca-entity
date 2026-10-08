# Options

Every option of the entity plugin, with its type, default and effect.
Options are given to `seneca.use` or under `plugin.entity` in the
instance options:

```js
seneca.use('@seneca/entity', { mem_store: false, strict: true })
Seneca({ plugin: { entity: { mem_store: false } } }).use('@seneca/entity')
```

The options are validated against the plugin's `defaults` shape when
the plugin loads. An option that is not listed here, or a value of the
wrong type, is a plugin load error, which is fatal by default (the
instance does not start). Plugin options are read from `use` and from
the `plugin.entity` instance option, on Seneca 3 and 4.

## Options

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `mem_store` | boolean | `true` | Load [seneca-mem-store](https://github.com/senecajs/seneca-mem-store) on the root instance when the plugin loads, so that entities work without configuring a store. Its options come from the `plugin['mem-store']` instance option. Set to `false` when another store is the default. See [Configure the default store](../how-to/configure-the-default-store.md). |
| `generate_id` | function | builtin | Id generator for new entities, exported as `entity/generate_id` and used by seneca-mem-store (and other stores that read the export). Called as `generate_id(spec)` returning an id, or `generate_id(spec, callback)` calling back with the id. The builtin generator reads `spec` as a length (a number, or an object with a `length` property) and produces a random alphanumeric id of that length, 6 by default. seneca-mem-store calls it with the new entity as `spec`. |
| `pattern_fix` | object | `{ sys: 'entity' }` | Properties added to every entity message and to the patterns registered by stores. The default makes the patterns `sys:entity,cmd:save`, `sys:entity,cmd:load` and so on. The `role:entity` translations always target `sys:entity`. |
| `strict` | boolean | `false` | When `true`, creating an entity whose canon matches no key of `ent` throws `Entity: unknown entity: <canon>`. |
| `ent` | object | `{}` | Per entity settings, keyed by canon string (`zone/base/name`, `-` for an unset part, for example `-/-/person` or `-/shop/product`). Each value is an object with the optional keys `valid` and `valid_json` described below. Other keys are rejected. |
| `ent.<canon>.valid` | Gubu shape, object or function | none | Validation shape for entities of this canon: a shape built with Gubu (`Seneca.util.Gubu` or the `gubu` module), a plain specification object (wrapped with the plugin's Gubu), or a function returning the specification object. See [Validate entity data](../how-to/validate-entity-data.md). |
| `ent.<canon>.valid_json` | object | none | Validation shape in Gubu's JSON form, built with `Gubu.build`. Suitable for configuration files. Takes precedence over `valid` when both are set. |
| `meta.provide` | boolean | `true` | Pass the action meta data as the third argument of entity method callbacks (`function (err, result, meta)`). `false` drops the third argument. The setting is stored on the shared `Entity` class: once an instance with `false` has made an entity, callbacks of every entity in the process receive `(err, result)` only. |
| `log.active` | boolean | `false` | Add a `log$` method to entities (`ent.log$(...)` logs through the Seneca instance that created the entity) and log a `make` entry, at debug level, for every `make$` call. The method is added to the shared `Entity` class, so it applies to the entities of every instance in the process. |
| `jsonic.depth` | number | `7` | Reserved. Accepted and validated, but the string form of an entity (`String(ent)`) uses fixed limits: 11 items per object or array, two levels of nesting below the entity, 111 characters for the field part. |
| `jsonic.maxitems` | number | `11` | Reserved, as `jsonic.depth`. |
| `jsonic.maxchars` | number | `111` | Reserved, as `jsonic.depth`. |
| `map` | object | `{}` | Reserved. Not read by the entity plugin. Store plugins have their own `map` option that maps canons to stores (see [Store protocol](store-protocol.md)). |

## Notes

* `ent` keys are canon strings. A key without slashes (`person`) means
  `-/-/person`. A `-` leaves that part unset, and a key with unset parts
  acts as a pattern, for validation and for `strict` mode alike:
  `sys/-/-` applies to every entity in zone `sys`, `-/shop/-` to every
  entity in base `shop`, and `-/-/person` (or `person`) to every entity
  named `person`, whatever its zone and base. Keys are matched like
  Seneca patterns: when several keys match an entity, the most specific
  one applies (`z/b/person` before `z/-/-`).
* Validation runs in `save$` (before the message is sent) and in
  `valid$`. It is not applied by the actions themselves, so a plain
  `sys:entity,cmd:save` message is not validated.
* A `hide` option existed in earlier versions. It is not part of the
  current option shape and is rejected.
* The default store, seneca-mem-store, has its own options (`map`,
  `merge`, `generate_id` and others), documented in its repository.
  They are given to the store, not to the entity plugin:
  `Seneca({ plugin: { 'mem-store': { merge: false } } })` for the store
  the plugin loads, or
  `seneca.use('entity', { mem_store: false }).use('mem-store', { merge: false })`.
