# Changes

## 29.0.0 2026-11-20

The first version published as `@seneca/entity`; versions up to 28.1.0
were published as `seneca-entity`. 28.2.0 was prepared but not
published; its changes are part of this version.

* Breaking: Seneca 4 only. The peer dependency is `seneca` `^4.0.0`
  (28.1.0 had `>=3||>=4.0.0-rc2`). Seneca 3 users stay on
  `seneca-entity@28`.
* Breaking: Node.js 24 or later (`engines.node` `>=24`, was `>=16`).
* Renamed from `seneca-entity` to `@seneca/entity`. Load it by its full
  name, `seneca.use('@seneca/entity')`, or by package,
  `seneca.use(require('@seneca/entity'))`.
* Seneca 4 validates with [shape](https://github.com/rjrodger/shape),
  the renamed successor of Gubu, and rejects option defaults built with
  Gubu, so seneca-entity 28 stops the process at startup there
  (`plugin_gubu_shape`). `defaults` is now a function of `{ valid }`,
  the builders Seneca passes to it. The options are unchanged.
* Entity validation (`ent.<canon>.valid` and `valid_json`) is built with
  the validator of the Seneca instance, `seneca.valid`. Write specs with
  the `seneca.valid` (or `Seneca.valid`) builders; `Seneca.util.Gubu` is
  a deprecated alias of shape. A failed validation throws a `ShapeError`
  (`shape: true`, `code` `'shape'`).
* Prepared shapes are used as they are, whether built by shape or Gubu,
  by any copy or version. Before, a Gubu shape built by another copy of
  Gubu was wrapped again with the plugin's own Gubu, and every save
  failed with "the object is not of type function". A factory function
  (`valid: () => spec`) may also return a shape.
* A `valid` spec that holds builder nodes of another library, such as
  builders imported from the gubu package, is refused when the plugin
  loads, with an error that names the canon and the path (fatal, as
  `plugin_define_failed`). It made every save fail with "not of type
  object".
* Breaking: the default store is `@seneca/mem-store` ^10.0.0, which
  loads on Seneca 4, instead of seneca-mem-store ^9.4.0. `defaults` is
  a function rather than an object.
* The store initializer (`entity/init`) reads the store plugin's tag
  from `fixedmsg`, the Seneca 4 name of the fixed message properties,
  and reads the deprecated `fixedargs` only when `fixedmsg` is absent.
  Stores built on it therefore cause no `SENECA_DEP_FIXEDARGS` warning
  (D6).
* TypeScript: the main declarations (`dist/entity.d.ts`) add `make$`,
  `make` and `entity` to Seneca's `Instance` interface with a
  `declare module 'seneca'` augmentation. The Seneca 4 `Instance` type
  is closed, so `seneca.entity(...)` compiles only with it. It applies
  in every project that imports `@seneca/entity`, including
  `import type {} from '@seneca/entity'`. The members return `any`.
* Upgrading: plugins that declare a peer dependency on `seneca-entity`
  (seneca-transport 8.3, @seneca/user 6.4, @seneca/owner 6.4 and
  seneca-msg-test 4.1, for example) make npm install seneca-entity 28
  next to @seneca/entity, and a short name such as
  `seneca.use('entity')` can load the old package. Load the plugin by
  its full name.
* Dependencies: the gubu dependency is removed; patrun is declared (it
  was required but not declared). The peer dependency on
  seneca-promisify is removed: Seneca 4 has `post`, `message` and
  promise forms of `ready` and `close` built in. Development
  dependencies: seneca-promisify and the unused seneca-msg-test are
  removed, seneca-transport is replaced by `@seneca/transport` ^9.0.0,
  and typescript is pinned to `~5.9.3` so that a rebuild matches the
  committed `dist/`. The committed `.npmrc` that set
  `legacy-peer-deps` is removed, so an install reports peer conflicts.
* Package: `publishConfig.access` is `public`, `repository.url` is
  `git+https://github.com/senecajs/seneca-entity.git`, and the scripts
  that published from a developer machine (`repo-tag`, `repo-publish`,
  `repo-publish-quick`) are removed.
* Tests: the runner (jest 29) is unchanged. The suite no longer loads
  seneca-promisify and uses `list_plugins` and `has_plugin` instead of
  the deprecated `plugins` and `hasplugin`, so it runs without
  `SENECA_DEP_*` warnings. New tests cover the store tag lookup with
  `fixedmsg` and with `fixedargs`. The README test mirrors the Quick
  Example and asserts its results. `npm run maintain` runs the
  `@seneca/maintain` repository checks (not part of `npm test`).
* The coverage output (`coverage/`) is no longer tracked in git.
* Documentation reorganized: README landing page and a `docs/` tree
  with tutorials, how-to guides, reference and explanation pages, with
  runnable programs in `docs/examples/`, for Seneca 4. The `docs/`
  folder is included in the published package.
