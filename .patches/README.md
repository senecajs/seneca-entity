# Workflow patches

GitHub requires the `workflow` OAuth scope to add or change files under
`.github/workflows/`. The session that prepared this branch did not have
it, so the workflow change is provided here as a git patch instead.

Apply it from a checkout with normal credentials:

```sh
git am .patches/*.patch
git rm -r .patches
git commit -m "ci: remove applied workflow patches"
git push
```

| Patch | Changes |
| ----- | ------- |
| `0001-ci-build-on-master-and-main-with-Node-24-and-22.patch` | `.github/workflows/build.yml`: build on pushes and pull requests to `master` (the default branch) and `main`, instead of `main` only, with a Node.js 24.x and 22.x matrix on `ubuntu-latest`. |

`git apply --check .patches/*.patch` verifies that the patch applies.
