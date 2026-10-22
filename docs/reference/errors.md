# Errors

Errors raised by the entity plugin, by the default store and by Seneca
on behalf of entity operations. The plugin defines no error code
templates of its own (no `errors` property); it throws plain errors and
the validation errors of Seneca's validator (shape on Seneca 4.0.0,
Gubu on Seneca 3.38 and 4.0.0-rc5).

## Thrown by the entity API

These are thrown synchronously by the method that detects the problem,
not passed to callbacks or promises. With `await ent.save$()` inside an
`async` function the throw becomes a rejection of that function.

| Message | Thrown by | Cause |
| ------- | --------- | ----- |
| `Entity: invalid entity canon: <value>; expected format: zone/base/name.` | `seneca.entity`, `make$`, `seneca.util.parsecanon`, `canon$({ parse })`, `canon$({ isa })`, `is$` | A canon string in which no part (letters, digits and `_`, or `-`) can be found, such as `''` or `'?'`. Other characters are not rejected: the canon is cut at the first one (`my-thing` becomes `-/-/my`); see [The canon model](../explanation/canon-model.md#three-parts-two-of-them-optional). |
| `Entity: unknown entity: <canon>` | `seneca.entity`, `make$` with option `strict: true` | The canon is not listed in the `ent` option and matches no canon pattern there. |
| `Entity: <canon>: Validation failed for ...` (a `ShapeError` on Seneca 4.0.0, a `GubuError` on Seneca 3.38 and 4.0.0-rc5) | `save$`, `valid$({ throws: true })` | The entity data does not match the `ent.<canon>.valid` or `valid_json` shape. When `valid` is a prepared shape, the message has no `Entity: <canon>:` prefix (the shape's own name is used, if it has one), and the error is that of the library that built the shape. |

A validation error has these properties:

| Property | Content |
| -------- | ------- |
| `message` | Human readable description of the first failures. The same on Seneca 3 and 4. |
| `name` | `'ShapeError'` on Seneca 4.0.0, `'GubuError'` on Seneca 3.38 and 4.0.0-rc5. |
| `code` | `'shape'`, on both. |
| `shape`, `gubu` | `shape: true` on a `ShapeError`, `gubu: true` on a `GubuError`. |
| `gname` | The shape name, `Entity: <canon>: ` for shapes the plugin builds. |
| `props` | Array of `{ path, what, type, value }`: the field path (`'a'`, `'b.x'`), the failed check (`'type'`, `'required'`, `'closed'`, ...), the expected type and the offending value. |
| `desc` | Function returning the full error descriptions, the same objects `valid$({ errors: true })` returns: `key`, `type`, `node`, `value`, `path`, `why`, `check`, `args`, `mark`, `text` and `use`, plus `pathArr` on Seneca 4.0.0. |

## Raised when a plugin loads

These are fatal by default: the instance does not start.

| Code | Raised when |
| ---- | ----------- |
| `invalid_plugin_option` | An entity plugin option is not in the option shape (for example the old `hide` option) or has the wrong type. Raised by Seneca's option validation. |
| `plugin_define_failed` | The plugin definition threw. The entity plugin throws `Entity: <canon>: the valid option is built with Gubu builders (at <path>), but this Seneca validates with shape, which does not read them. Build the spec with seneca.valid.` when an `ent.<canon>.valid` specification holds builders of the other library: Gubu builders (for example imported from the gubu package) on Seneca 4.0.0, or shape builders on Seneca 3.38 and 4.0.0-rc5 (the message then names the libraries the other way round). Seneca's notice reads `seneca: The definition action for the plugin entity has failed: Entity: <canon>: ...`. |
| `plugin_gubu_shape` | Seneca 4.0.0 loaded a plugin whose option defaults are built with Gubu, such as seneca-entity 28.1.0 or seneca-mem-store 9.4.0 (`seneca: Plugin entity: its option defaults were built with gubu (at ent). ...`). This happens with `seneca.use('entity')` or `seneca.use('mem-store')` when those packages are installed next to `@seneca/entity` and `@seneca/mem-store`; load the plugins by package or full name (see [Seneca 3 and Seneca 4: package names](../explanation/seneca-3-and-4.md#package-names)). |
| `store_cmd_missing` | A store object passed to `entity/init` lacks a command it is registered for (`save`, `load`, `list`, `remove`, `native` or `close`). The instance dies. |

## Replied by actions

These reach the callback as `err` or reject the promise.

| Code | Raised when |
| ---- | ----------- |
| `act_not_found` | No store is registered for the entity's canon: the entity plugin was loaded with `mem_store: false` and no store (or no store mapped to that canon) was added; or `close$` was called (no store registers `sys:entity,cmd:close`). |
| `entity-id-exists` | @seneca/mem-store: a new entity with a chosen id (`id$`) has the id of a stored entity. |
| `generate-invalid-entity-id` | @seneca/mem-store: the id generator returned `null` or `undefined`. |
| `act_execute` | An action in the chain (a store or a prior) threw. On Seneca 4 the caller receives the original error; the Seneca wrapper with this code is available as `err.meta$.err`. On Seneca 3 (`legacy.error` on) the caller receives the wrapper, whose message is `seneca: Action cmd:save,sys:entity failed: <message>.` |
| `act_invalid_msg` | A validation rule on a custom `sys:entity` pattern rejected the message (rules in `seneca.add` patterns, checked by Seneca's validator). |
| `action_timeout` | The store did not reply within the action timeout. |

In callback mode without a callback (`seneca.make$('foo').save$()`), the
operation runs in the background and an error goes to the instance's
error handler (`seneca.error(fn)`, or the test callback of
`seneca.test(fin)`) and the log.

Over a transport, the client receives an `Error` for a remote failure,
but seneca-transport 8.3.0 with the `web` type does not pass on the
original message: the client sees `Response Error: 500 Internal Server Error`.
See [Share entities over a transport](../how-to/share-entities-over-a-transport.md#7-expect-generic-errors).

## Logged

With option `log.active`, `make$` logs an entry per created entity
through the Seneca logger at debug level, and `ent.log$(...)` forwards
to `seneca.log(...)`.
