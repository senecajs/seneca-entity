# Changes

## 29.0.0 2026-10-21

The first version published as `@seneca/entity`; versions up to 28.1.0
were published as `seneca-entity`. 28.2.0 was prepared but not
published; its changes are part of this version.

* Seneca 4 support. Seneca 4.0.0 validates with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so seneca-entity 28
  stops the process at startup there (`plugin_gubu_shape`). `defaults`
  is now a function of `{ valid }`, the builders Seneca passes to it:
  shape on Seneca 4, Gubu on Seneca 3. The options are unchanged.
* Entity validation (`ent.<canon>.valid` and `valid_json`) is built with
  the validator of the Seneca instance, `seneca.valid`: shape on
  Seneca 4, Gubu on Seneca 3. Write specs with the `seneca.valid` (or
  `Seneca.valid`) builders; on Seneca 4 `Seneca.util.Gubu` is a
  deprecated alias of shape. A failed validation throws a `ShapeError`
  (`shape: true`) on Seneca 4 and a `GubuError` (`gubu: true`) on
  Seneca 3, with the same message and `props`.
* Prepared shapes are used as they are, whether built by shape or Gubu,
  by any copy or version. Before, a Gubu shape built by another copy of
  Gubu was wrapped again with the plugin's own Gubu, and every save
  failed with "the object is not of type function". A factory function
  (`valid: () => spec`) may also return a shape.
* A `valid` spec that holds builder nodes of the other library, such as
  builders imported from the gubu package on Seneca 4, is refused when
  the plugin loads, with an error that names the canon and the path
  (fatal, as `plugin_define_failed`). It made every save fail with "not
  of type object".
* Breaking: Seneca 3 support starts at 3.38. The peer range is
  `>=3.38||>=4.0.0-rc5` (was `>=3||>=4.0.0-rc2`). Tested with Seneca
  4.0.0, 4.0.0-rc5 and 3.38.0.
* Breaking: the default store is `@seneca/mem-store` ^10.0.0, which
  loads on Seneca 4, instead of seneca-mem-store ^9.4.0. `defaults` is
  a function rather than an object.
* Upgrading: plugins that declare a peer dependency on `seneca-entity`
  (seneca-transport 8.3, @seneca/user 6.4, @seneca/owner 6.4 and
  seneca-msg-test 4.1, for example) make npm install seneca-entity 28
  next to @seneca/entity, and `seneca.use('entity')` finds
  `seneca-entity` first. Until they are republished, load the plugin as
  `seneca.use('@seneca/entity')`.
* Dependencies: the gubu dependency is removed; patrun is declared (it
  was required but not declared); seneca, seneca-promisify and
  seneca-transport are development dependencies for the tests and the
  documentation examples. `.npmrc` sets `legacy-peer-deps` while
  published dependencies exclude the Seneca 4 prerelease from their peer
  range.
* Node.js: `engines.node` is `>=18` (was `>=16`). The CI workflow patch
  in `.patches/` runs the build on Node.js 24 and 22 for the `master`
  and `main` branches.
* Tests: the runner (jest 29) is unchanged. The README test mirrors the
  new Quick Example and asserts its results. `npm run maintain` runs the
  `@seneca/maintain` repository checks (not part of `npm test`).
* The coverage output (`coverage/`) is no longer tracked in git.
* Documentation reorganized: README landing page and a `docs/` tree
  with tutorials, how-to guides, reference and explanation pages, with
  runnable programs in `docs/examples/`. The `docs/` folder is included
  in the published package.
