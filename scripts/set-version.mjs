// Sets one version for every published package and keeps the internal @xex/* ranges in step.
// Usage: node scripts/set-version.mjs 0.1.1
// Then commit, and push a matching tag (v0.1.1): the Release workflow publishes it.
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const version = process.argv[2]
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? '')) {
  console.error('Usage: node scripts/set-version.mjs <x.y.z>')
  process.exit(1)
}

const files = ['package.json', 'packages/tokens/package.json', 'packages/tailwind-preset/package.json', 'packages/ui/package.json']
for (const file of files) {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
  pkg.version = version
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (name.startsWith('@xex/')) pkg[field][name] = `^${version}`
    }
  }
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`${file} -> ${version}`)
}

execSync('npm install --package-lock-only --ignore-scripts --no-audit --no-fund', { stdio: 'inherit' })
console.log(`\nDone. Review with git diff, commit, then: git tag v${version} && git push origin v${version}`)
