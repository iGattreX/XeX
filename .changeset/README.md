# Changesets

A changeset is a small file that says *what changed* and *how big* (patch, minor, major) for the published packages.

```bash
npm run changeset      # answer the prompts; commit the generated file with your change
```

On every push to `main`, the **Version packages** workflow collects the pending changesets and opens (or updates) a
"Version packages" pull request that bumps the versions, updates the internal `@xex/*` ranges and the lockfile, and writes
each package's `CHANGELOG.md`. Merge that PR, then tag the new version (`git tag vX.Y.Z && git push origin vX.Y.Z`): the
**Release** workflow stages the packages on npm, and you approve them with 2FA.

The three packages are `fixed`: they always share one version. While we are on `0.x`, use **minor** for anything that
changes the public API or the CSS/Tailwind contract, and **patch** for fixes.

Docs-only or tooling-only changes need no changeset.
