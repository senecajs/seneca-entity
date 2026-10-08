# Changes

## 28.2.0 2026-10-08

* Seneca 4 prerelease support. The test suite passes against
  seneca 4.0.0-rc5 (now a development dependency), the unreleased
  4.0.0 and Seneca 3.38, on Node.js 24 and 22. The peer dependency
  range (`>=3||>=4.0.0-rc2`) is unchanged.
* Fix: an `ent.<canon>.valid` option given a Gubu shape built by another
  copy or version of Gubu (such as `Seneca.util.Gubu`, which is Gubu 9
  on Seneca 4) is now used as it is. It was wrapped again with the
  plugin's own Gubu, and every save then failed with "the object is not
  of type function". A factory function (`valid: () => spec`) may now
  also return a shape. New regression test in `test/valid.test.js`.
* Dependencies: gubu ^9.0.0 (was ^8.2.1); patrun is declared (it was
  required but not declared); seneca, seneca-promisify and
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
  in the published package. The package is published as
  `@seneca/entity` from this version; versions up to 28.1.0 were
  published as `seneca-entity`.
