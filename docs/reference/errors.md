# Errors

Errors raised by the entity plugin, by the default store and by Seneca
on behalf of entity operations. The plugin defines no error code
templates of its own (no `errors` property); it throws plain errors and
Gubu validation errors.

## Thrown by the entity API

These are thrown synchronously by the method that detects the problem,
not passed to callbacks or promises. With `await ent.save$()` inside an
`async` function the throw becomes a rejection of that function.

| Message | Thrown by | Cause |
| ------- | --------- | ----- |
| `Entity: invalid entity canon: <value>; expected format: zone/base/name.` | `seneca.entity`, `make$`, `seneca.util.parsecanon`, `canon$({ parse })`, `canon$({ isa })`, `is$` | A canon string in which no part (letters, digits and `_`, or `-`) can be found, such as `''` or `'?'`. Other characters are not rejected: the canon is cut at the first one (`my-thing` becomes `-/-/my`); see [The canon model](../explanation/canon-model.md#three-parts-two-of-them-optional). |
| `Entity: unknown entity: <canon>` | `seneca.entity`, `make$` with option `strict: true` | The canon is not listed in the `ent` option and matches no canon pattern there. |
| `Entity: <canon>: Validation failed for ...` (a `GubuError`) | `save$`, `valid$({ throws: true })` | The entity data does not match the `ent.<canon>.valid` or `valid_json` shape. When `valid` is a prepared Gubu shape, the message has no `Entity: <canon>:` prefix (the shape's own name is used). |

A `GubuError` has these properties:

| Property | Content |
| -------- | ------- |
| `message` | Human readable description of the first failures. |
| `code` | `'shape'`. |
| `gubu` | `true`. |
| `gname` | The shape name, `Entity: <canon>: ` for shapes the plugin builds. |
| `props` | Array of `{ path, what, type, value }`: the field path (`'a'`, `'b.x'`), the failed check (`'type'`, `'required'`, `'closed'`, ...), the expected type and the offending value. |
| `desc` | Function returning the full error descriptions (the same objects `valid$({ errors: true })` returns). |

## Raised when a plugin loads

These are fatal by default: the instance does not start.

| Code | Raised when |
| ---- | ----------- |
| `invalid_plugin_option` | An entity plugin option is not in the option shape (for example the old `hide` option) or has the wrong type. Raised by Seneca's option validation. |
| `store_cmd_missing` | A store object passed to `entity/init` lacks a command it is registered for (`save`, `load`, `list`, `remove`, `native` or `close`). The instance dies. |

## Replied by actions

These reach the callback as `err` or reject the promise.

| Code | Raised when |
| ---- | ----------- |
| `act_not_found` | No store is registered for the entity's canon: the entity plugin was loaded with `mem_store: false` and no store (or no store mapped to that canon) was added; or `close$` was called (no store registers `sys:entity,cmd:close`). |
| `entity-id-exists` | seneca-mem-store: a new entity with a chosen id (`id$`) has the id of a stored entity. |
| `generate-invalid-entity-id` | seneca-mem-store: the id generator returned `null` or `undefined`. |
| `act_execute` | An action in the chain (a store or a prior) threw. On Seneca 4 the caller receives the original error; the Seneca wrapper with this code is available as `err.meta$.err`. On Seneca 3 (`legacy.error` on) the caller receives the wrapper, whose message is `seneca: Action cmd:save,sys:entity failed: <message>.` |
| `act_invalid_msg` | A validation rule on a custom `sys:entity` pattern rejected the message (Gubu rules in `seneca.add` patterns). |
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
