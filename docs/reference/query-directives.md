# Query directives

The query argument of `load$`, `list$` and `remove$`, the data argument
of `save$`, and the properties with a `$` suffix that control an
operation. Properties without `$` are data (fields of the entity, or
field conditions in a query); properties ending in `$` are directives
and are never stored.

## Query forms

| Form | `load$` | `list$` | `remove$` |
| ---- | ------- | ------- | --------- |
| omitted or `null` | reload by the entity's own `id`; `null` without a message when the entity has no id | every entity of the kind | remove by the entity's own `id`; `null` without a message when the entity has no id |
| `''` (empty string) or `{}` | `null` without a message | every entity of the kind | `null` without a message |
| string or number | `{ id: value }` | passed to the store as it is: seneca-mem-store treats a string as an id, and finds nothing for a number (use `{ id: 7 }` or `[7]`) | `{ id: value }` |
| array | passed to the store as it is (seneca-mem-store: a list of ids; `load$` returns the first one found) | passed to the store as it is (seneca-mem-store: a list of ids) | passed to the store as it is (seneca-mem-store: removes the first one found; an array cannot carry `all$`) |
| object | field conditions and directives | field conditions and directives | field conditions and directives |

Query properties whose value is `undefined` are removed before the
message is sent. A field condition whose value is an array matches any
of the values with seneca-mem-store (`{ name: ['kiwi', 'fig'] }`).
Comparison operators (`{ price: { $gte: 30 } }` with `$ne`, `$gt`,
`$gte`, `$lt`, `$lte`, `$in`, `$nin`) are a seneca-mem-store feature,
not part of the entity API; other stores have their own query
extensions.

## Directives in queries

Which directives a store honours is up to the store. The table shows
the behaviour of seneca-mem-store, the reference implementation, which
is what the other official stores follow.

| Directive | Operations | Effect |
| --------- | ---------- | ------ |
| `sort$` | `list$`, `load$`, `remove$` | `{ field: 1 }` ascending, `{ field: -1 }` descending. seneca-mem-store sorts by the first field only. Applied before `skip$` and `limit$`. |
| `skip$` | `list$`, `load$`, `remove$` | Number of matching entities to skip (an offset for paging). Ignored when not a positive number. |
| `limit$` | `list$`, `load$`, `remove$` | Maximum number of entities to return. Ignored when `0`, negative or not a number. |
| `fields$` | `load$`, `list$` | Array of field names to return. `id` is always included. |
| `all$` | `remove$` | `true` removes every matching entity. Without it, `remove$` removes the first match only. |
| `load$` | `remove$` | `true` returns the removed entity instead of `null`. Only for single removes; with `all$` the result is always `null`. |
| `meta$` | `save$`, `load$`, `list$`, `remove$`, promise form | `true` attaches the action meta data to the result as `result.meta$` (for an array result, as a property of the array; for a `null` result, as `{ entity$: null, meta$ }`). The callback form always receives the meta data as its third argument (option `meta.provide`). |

The directives `skip$` and `limit$` are counted after sorting. In
`load$`, a query that consists of directives only is still a query
(`load$({ sort$: { price: 1 } })` returns the first entity in that
order).

## Directives in `save$`

The optional first argument of `save$` is a data object. Its fields
are copied into the entity (as with `data$`), and the whole object
becomes the query `q` of the save message, so directives can be given
there.

| Directive | Effect |
| --------- | ------ |
| `id$` | Chosen id for a new entity. The store saves the entity with this id instead of generating one. Also accepted as a property of the entity (`ent.id$ = 'x'`), in `make$` props and in `data$`. |
| `merge$` | `false` replaces the stored data with the entity's fields instead of merging into it (seneca-mem-store merges by default; its `merge` option changes the default). Also accepted as `ent.merge$`. |
| `upsert$` | Array of field names. When a stored entity has the same values for these fields, it is updated; otherwise a new one is created (seneca-mem-store). Only for entities without an `id`. |
| `skip$` | Array (or comma separated string) of field names that may be absent when the entity is validated against its `ent.<canon>.valid` shape. Present values are still checked. See [Validate entity data](../how-to/validate-entity-data.md). |
| `meta$` | As in queries: attach the meta data to the promise result. |

In `save$`, `skip$` is a validation directive. In `list$` it is a
paging directive. The two never meet: validation only runs for `save$`.

## Entity level directives

These are set on the entity object and apply to every operation it
performs. The entities a store returns are new objects without them.

| Directive | Set with | Effect |
| --------- | -------- | ------ |
| `custom$` | `ent.custom$(props)` or `data$({ custom$: props })`; also readable as `ent.custom$.key` | Arbitrary data attached to the entity object, not stored and not included in `data$(false)` or `JSON.stringify`. It is visible to actions in the same process as `msg.ent.custom$`, which is how priors on the `sys:entity` patterns receive per operation hints. Included in `data$()` as `custom$` when not empty. |
| `directive$` | `ent.directive$({ audit$: 'x' })` or `data$({ directive$: {...} })` | Each property (which must end in `$`) is copied to the top level of every message the entity sends (`msg.audit$`), where actions and priors can read it. The names `id$`, `custom$`, `merge$`, `skip$` and `directive$` are not copied. |
| `entity$` | read only (`ent.entity$`) | The canon string `zone/base/name`. In `make$` props, `entity$` (string or `{ zone, base, name }` object) selects the canon; `data$(object)` ignores it. |
| `zone$`, `base$`, `name$` | `make$` props | Alternative way to give the canon parts in the props object: `seneca.entity({ name$: 'person', base$: 'shop' })`. |
| `id$` | `make$` props, `data$`, `save$` data | Chosen id, see above. |

## Escaped field names

In `make$` props, a key ending in `_$` sets the property named without
that suffix: `seneca.make$('esc', { y_$: 2 })` sets the field `y`, and
`{ n$_$: 3 }` sets the own property `n$`. A property whose name ends in
`$` is not a field: it is left out of `fields$()` and `data$()`, so it
is not stored, although `JSON.stringify` includes it. `data$(object)`
does not remove `_$` suffixes; it ignores such keys.

## Serialized forms

`data$()` returns the fields plus `entity$` as an object
(`{ zone, base, name }`) and `custom$` when set; `data$(true, 'string')`
uses the string form of `entity$`; `data$(false)` returns the fields
only. In the `data$` forms, a field whose value is an entity is
replaced by that entity's `id`, which is what stores persist.
`JSON.stringify(ent)` includes `entity$` as a string and the own
properties of the entity (fields, plus `id$` or other `$` properties
set on it); an entity valued field is serialized in full there.
