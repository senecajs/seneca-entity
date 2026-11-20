# Seneca 3 and Seneca 4

Version 29.0.0 of the entity plugin, published as `@seneca/entity`,
requires Seneca 4 (`seneca` `^4.0.0`) and Node.js 24 or later. Seneca 3
applications keep seneca-entity 28, the last version under the old
name. This page explains what differs between the two generations for
entity code, and what the plugin does about it. The steps are in
[Migrate from Seneca 3](../how-to/migrate-from-seneca-3.md) and in the
Seneca 4 documentation.

## What is the same

The entity API itself: `seneca.entity`, `seneca.make$`, the entity
methods, the `sys:entity` patterns and their `role:entity`
translations, the store protocol, an in-memory store as the default
store, and the options.

## Promises

Seneca 4 has promises built in (`seneca.post`, `seneca.message`,
`await seneca.ready()`, `await seneca.close()`). On Seneca 3 these came
from the seneca-promisify plugin. Seneca 4 no longer needs it: loading
it prints the deprecation warning `SENECA_DEP_PROMISIFY`, so remove
`seneca.use('promisify')` and the dependency. The entity
plugin's promise mode (`seneca.entity`) never depended on
seneca-promisify: it wraps `seneca.act` itself.

## Validation: shape and Gubu

Seneca validates with a library it bundles and exposes as
`Seneca.valid` and `seneca.valid`. Seneca 4 bundles
[shape](https://github.com/rjrodger/shape) 11. Seneca 3.38 bundled
[Gubu](https://github.com/rjrodger/gubu) 9. shape is the renamed
successor of Gubu. The builders (`Open`, `Required`, `Skip`, ...), the
JSON form and the error messages are the same, but shape does not read
Gubu's builder nodes, and Seneca 4 rejects plugin option defaults built
with Gubu (fatal `plugin_gubu_shape`).

Since 29.0.0 the plugin has no validation library of its own; it uses
the one of the Seneca instance:

* Its option shape is built by its `defaults` function from the
  builders Seneca passes in (`defaults({ valid })`). seneca-entity
  28.1.0 built its defaults with its own copy of Gubu 8, which is why
  it does not load on Seneca 4.
* The entity shapes of the `ent` option are built with
  `seneca.valid(spec, { name })` (for `valid`) and
  `seneca.valid.build(json, { name })` (for `valid_json`). A
  specification written with plain types (`String`, `Number`) and the
  builders of `seneca.valid` therefore works, and so does a
  `valid_json` shape written for Gubu.
* A prepared shape, recognized by its `shape` or `gubu` marker
  property, is used as it is, whichever copy or version of either
  library built it: a shape cannot be wrapped again by another copy.
  Up to 28.1.0 the plugin wrapped shapes it did not recognize with its
  own Gubu, and every save then failed with "the object is not of type
  function".
* A specification that holds Gubu builder nodes (for example
  `Required` imported from the gubu package) is refused when the
  plugin loads. The validator would not read them, and every save
  would fail with "...is not of type object". Instead the plugin
  definition throws an error that names the canon and the path, and
  Seneca stops with `plugin_define_failed` (see
  [Errors](../reference/errors.md#raised-when-a-plugin-loads)).

`Seneca.util.Gubu` is a deprecated alias of shape on Seneca 4
(deprecation code `SENECA_DEP_UTIL_GUBU`; Seneca 5 removes it). Write
`Seneca.valid` or `seneca.valid`.

## Errors

On Seneca 3, an error thrown or replied by a store (or a prior) reached
the entity callback or promise wrapped: `err.message` was
`seneca: Action cmd:save,sys:entity failed: <original message>.` and
`err.orig` held the original error. On Seneca 4 the original error
arrives unchanged, and the wrapper is available as `err.meta$.err`.

Validation errors thrown by `save$` and `valid$` were never wrapped.
They come from the validator: a `ShapeError` (`shape: true`) on
Seneca 4, where Seneca 3 threw a `GubuError` (`gubu: true`). The
message, `code` (`'shape'`), `gname` and `props` are the same, so code
should test `err.code` or read `err.props` rather than the error name.
The descriptions returned by `valid$({ errors: true })` have an extra
`pathArr` property on Seneca 4. A prepared shape throws the error of
the library that built it.

## Closing stores

Stores release their resources through a prior on
`sys:seneca,cmd:close`, which the entity plugin registers for each
store's `close` command. Seneca 4 closes through that pattern. Seneca 3
closed through `role:seneca,cmd:close`. Seneca 4 still calls hooks
registered on that pattern, but they are deprecated
(`SENECA_DEP_LEGACY_CLOSE_HOOK`; Seneca 5 removes them): use
`this.destroy(fn)` or a prior on `sys:seneca,cmd:close`.

## Transports

Seneca 3 had an HTTP transport built in; Seneca 4 does not. To share
entities between processes on Seneca 4, load `@seneca/transport` on
both sides. The conversion of `entity$` data into entities on arrival
(`handle_entity` in the core transport utilities) exists in both
generations, and so do the details described in
[Share entities over a transport](../how-to/share-entities-over-a-transport.md):
pin `sys:entity` rather than `sys:entity,cmd:*`, turn off the client's
own store, and rebuild replies in promise mode before awaiting their
methods.

## Options

Seneca 4 reads plugin options only from `seneca.use(plugin, options)`
and from `plugin.entity` in the instance options, and validates them
strictly against the plugin's `defaults`. Seneca 3 could also merge a
top level `entity` key when `legacy.top_plugins` was on; it was off by
default in 3.38. The `default_plugins` instance option, which Seneca 3
used to control built in plugins, is accepted but not read by Seneca 4.

## Node.js

The plugin requires Node.js 24 or later, as Seneca 4 does.

## Package names

The plugin is published as `@seneca/entity` from 29.0.0 (up to 28.1.0
as `seneca-entity`), and its default store as `@seneca/mem-store` from
10.0.0 (up to 9.4.0 as `seneca-mem-store`). The last versions under the
old names, seneca-entity 28.1.0 and seneca-mem-store 9.4.0, do not load
on Seneca 4 (`plugin_gubu_shape`). Plugins that still declare a peer
dependency on `seneca-entity`, such as seneca-transport 8.3,
@seneca/user 6.4, @seneca/owner 6.4 and seneca-msg-test 4.1, make npm
install seneca-entity 28.1.0, and with it seneca-mem-store 9.4.0, next
to the new packages.

Where both generations are installed, the short names in
`seneca.use('entity')` and `seneca.use('mem-store')` can load the old
packages, and Seneca 4 then stops at startup. Load the plugins by
package (`require('@seneca/entity')`) or by full name
(`seneca.use('@seneca/entity')`, `seneca.use('@seneca/mem-store')`).
Either way the plugins register under their short names, `entity` and
`mem-store`, so options given under `plugin.entity` and
`plugin['mem-store']` still apply.

## Dependencies

Seneca 4 no longer depends on `optioner`, `joi`, `norma` or `lodash`;
the entity plugin uses none of them. Seneca 4 depends on shape
instead of Gubu, and the plugin uses the validator of the instance, so
since 29.0.0 it has no `gubu` dependency. Its dependencies are
`patrun` (declared since 29.0.0; earlier versions resolved it through
Seneca's dependency tree) and `@seneca/mem-store` ^10.0.0, the default
store. Its only peer dependency is `seneca` `^4.0.0`.
