# Entity API

Every method the plugin adds to a Seneca instance and every method and
property of an entity object. Options are in [Options](options.md),
the `$` directives in [Query directives](query-directives.md), the
messages behind the methods in [Messages](messages.md).

## Instance methods

| Method | Returns | Notes |
| ------ | ------- | ----- |
| `seneca.entity([zone], [base], [name], [props])` | Entity in promise mode | Store methods without a callback return promises. |
| `seneca.make$([zone], [base], [name], [props])` | Entity in callback mode | Store methods take callbacks; without one they run in the background. |
| `seneca.make(...)` | Entity in callback mode | Alias of `make$`. |
| `seneca.util.parsecanon(spec)` | `{ zone, base, name }` | Parses a canon string (`'shop/product'`), array (`[zone, base, name]`) or object. Throws on an invalid string. |

The canon arguments are strings: one argument is the `name`, two are
`base, name`, three are `zone, base, name`. A canon string with slashes
is accepted in the name position (`seneca.entity('shop/product')`).
The last argument may be a props object:

| Props key | Effect |
| --------- | ------ |
| fields (no `$`) | Set as fields of the new entity. |
| `entity$` | Canon as a string (`'-/shop/product'`) or object (`{ zone, base, name }`). Use it instead of positional canon arguments, not together with them (`make$('foo', { entity$: 'z/b/n' })` gives `z/foo/n`). |
| `zone$`, `base$`, `name$` | Canon parts. Positional arguments override them. |
| `id$` | Chosen id for the first save. |
| `<key>_$` | Sets the property `<key>` (the `_$` suffix is removed): `{ y_$: 2 }` sets `y`. |
| other `$` keys | Ignored. |

Passing an existing entity as the only argument returns that entity
unchanged. `seneca.entity()` with no arguments gives an entity with no
canon (`-/-/-`), useful only as a template for `make$`.

Inside an action, use `this.entity(...)` rather than a captured outer
instance: the entity then sends its messages through the action's
delegate, so they appear as children of the action in logs and traces.

## Modes and return values

An entity is in promise mode (created by `seneca.entity`) or callback
mode (created by `seneca.make$` or `seneca.make`). Entities made with
`ent.make$` inherit the mode. The store methods `save$`, `load$`,
`list$`, `remove$` and `native$` behave as follows:

| Mode | Callback given | Return value |
| ---- | -------------- | ------------ |
| promise | no | A promise of the result. |
| promise | yes | The entity (chainable; `native$` returns `null`); the callback receives the result. |
| callback | yes | The entity (chainable); the callback receives the result. |
| callback | no | The entity; the operation runs in the background and an error goes to the instance error handler. |

Exceptions: `load$` and `remove$` with an empty query (no query and no
`id` on the entity, `''` or `{}`) send no message. Without a callback
in promise mode they return `null` (not a promise); with a callback they
call it synchronously with `(null, null)` and return the entity.

Entities that Seneca builds for you are in callback mode: the results
of plain `sys:entity` messages (`seneca.act`, `seneca.post`), and
entities rebuilt from transport messages and replies. Calling
`await ent.save$()` on such an
entity resolves at once with the entity itself while the save runs in
the background. Use a callback, or make a promise mode entity first:
`seneca.entity(ent.data$())` (keeps the canon, `id` and fields; not
`custom$` or `directive$`). See
[Use entities with promises](../how-to/use-promises-and-async-actions.md#4-convert-callback-mode-entities-before-awaiting).

Callbacks have the signature `function (err, result, meta)`. `this` is
the Seneca delegate that handled the operation, so `this.entity(...)`
and `this.act(...)` are available inside. The `meta` argument is the
action meta data (`meta.pattern`, `meta.action`, timing); it is omitted
when the option `meta.provide` is `false`. In promise mode, the meta
data is attached to the result as `result.meta$` when the query or
save data contains `meta$: true`.

## Store methods

| Method | Arguments | Result |
| ------ | --------- | ------ |
| `save$([data], [callback])` | `data`: fields to set before saving plus directives (`id$`, `merge$`, `upsert$`, `skip$`, `meta$`). | The saved entity, a new object with the `id` set. A new entity (no `id`) is created; an entity with an `id` is updated (merged into the stored data by default). Runs the `ent.<canon>.valid` validation first and throws a `GubuError` on failure. |
| `load$([query], [callback])` | id, query object, or nothing to reload by the entity's own `id`. | The first matching entity, or `null`. |
| `list$([query], [callback])` | Query object, array of ids, or nothing for every entity of the kind. | Array of entities (possibly empty). |
| `remove$([query], [callback])` | As `load$`. `all$: true` removes every match; `load$: true` returns the removed entity. | `null`, or the removed entity with `load$`. |
| `delete$(...)` | As `remove$`. | Deprecated alias. |
| `native$([callback])` | none | The store's native handle (connection, client or raw data). |
| `close$([callback])` | none | Deprecated. Sends `sys:entity,cmd:close`, which stores do not register; store resources are released by `seneca.close()`. |

The query forms and directives are specified in
[Query directives](query-directives.md). Which directives and query
features work depends on the store.

## Data methods

| Method | Result |
| ------ | ------ |
| `data$()` or `data$(true)` | Plain object: `entity$` as `{ zone, base, name }`, `custom$` when not empty, and every field. |
| `data$(true, 'string')` | As above with `entity$` as a string. |
| `data$(false)` | The fields only. This is what a store should persist. |
| `data$(object)` | Sets fields from the object (keys without `$`), plus `id$`, `merge$`, `custom$` and `directive$` when present. Existing fields are kept; a field whose value is an entity is replaced by that entity's `id`. Returns the entity. |
| `fields$()` | Array of field names: own properties that are not functions and do not end in `$`. Includes `id` once set. |
| `clone$()` | A deep copy of the entity (fields, `custom$`, `directive$`), in the same mode. |
| `is$(spec)` | `true` when the entity's canon equals `spec`: a canon string, another entity, or an object with all three keys `zone`, `base` and `name` (unset parts `undefined`). For partial objects and arrays use `canon$({ isa })`. |
| `canon$()` | The canon string `zone/base/name`. |
| `canon$({ string$: true })` | `$zone/base/name`. |
| `canon$({ array: true })` | `[zone, base, name]`. |
| `canon$({ object: true })` | `{ zone, base, name }`. |
| `canon$({ object$: true })` | `{ zone$, base$, name$ }`. |
| `canon$({ isa: spec })` | `true` when the canon matches `spec`: a string, an array `[zone, base, name]` or an object; missing, `null` and `undefined` parts all mean unset. |
| `canon$({ parse: spec })` | The parsed canon object of `spec`. |
| `canon$({ change: {...} })` | Deprecated: changes the canon parts in place. |
| `valid$()` | `true` when the entity data matches its `ent.<canon>.valid` shape, or when there is no shape; `false` otherwise. Defaults defined by the shape are written into the entity when valid. |
| `valid$({ errors: true })` | Array of Gubu error descriptions (`{ path, why, type, value, text, ... }`); empty when valid or when there is no shape. |
| `valid$({ throws: true })` | Throws a `GubuError` when invalid. |
| `valid$({ shape: true })` | The Gubu shape for the canon, or `undefined`. |
| `custom$(props)` | Deep copies `props` into `ent.custom$`; returns the entity. `ent.custom$` is also readable as an object (`ent.custom$.key`). |
| `directive$(map)` | Deep copies `map` into `ent.directive$`; returns the entity. Keys must end in `$`. |
| `log$(...args)` | Present once any instance has loaded the plugin with option `log.active` (the method is added to the shared `Entity` class): logs through the instance that created the entity, at debug level. |
| `toString()`, `String(ent)` | `$zone/base/name;id=<id>;{field:value,...}`. The field part shows at most 11 items per object or array and objects nested up to two levels below the entity (deeper ones print as `{}`), and is cut at 111 characters. `$` properties are omitted. |
| `util.inspect(ent)`, `console.log(ent)` | `Entity { 'entity$': '-/-/person', name: 'Alice', id: 'p1' }`. |
| `JSON.stringify(ent)` | `{"entity$":"-/-/person","name":"Alice","id":"p1"}`: `entity$` as a string plus the own properties. |

Validation of an entity that has an `id` treats every top level field
as optional (so partial updates pass); an entity without an `id` must
satisfy the shape except for `id`. Present values are always checked.
A closed shape (the default for `Gubu({ ... })`) must list `id` if
entities carrying an id are to be saved; see
[Validate entity data](../how-to/validate-entity-data.md).

## Properties

| Property | Content |
| -------- | ------- |
| `entity$` | The canon string, for example `-/shop/product`. Read only in practice; it also marks plain objects as entities when they travel through messages. |
| `id` | The identifier, set by the store on the first save. Absent on a new entity. |
| `id$` | Chosen identifier for the first save, when set. |
| `custom$` | Object of custom data (also callable, see above). Not stored. |
| `directive$` | Object of message directives (also callable). Not stored. |
| `merge$` | When set to `false` (through `data$`), the next save replaces instead of merging. |
| fields | Every other own property. Avoid names ending in `$`. |

## The Entity class

`seneca.export('Entity')` returns the `Entity` class. It can be used
for `instanceof` checks, and its prototype can be extended with methods
(name them with a `$` suffix so they are not mistaken for fields):

```js
seneca.export('Entity').prototype.describe$ = function () {
  return this.entity$ + ' ' + this.id
}
```

The method is available on every entity of every instance in the
process, since the class is shared.

## The module

The package's main module exports the plugin definition function
(named `entity`), with its `defaults` (the option shape, see
[Options](options.md)) and `preload` properties:

```js
const Entity = require('@seneca/entity')
seneca.use(Entity, { mem_store: false })
```

TypeScript: the module's default export is the plugin function, and the
`Entity` type is exported too (`import type { Entity } from '@seneca/entity'`).
The files under `dist/lib` are internal and may change without notice.
