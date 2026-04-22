# Developers

Contributor-facing notes for `@valu/block-components`. End-user documentation
lives in [`README.md`](README.md) and [`components/content-picker/readme.md`](components/content-picker/readme.md);
this file covers the build, release, and local-testing workflows.

## Prerequisites

- Node **≥ 20** (the GitHub Actions runner uses Node 20, and local machines
  should match to avoid lockfile-resolution drift).
- `npm` (bundled with Node).
- For the Playground demo: nothing extra — the Playground CLI is fetched via
  `npx` on demand.

## Install

```bash
npm ci
cd example && npm ci && cd ..
```

> Valu standard: always `npm ci`, never `npm install` on an existing project.
> The only time `npm install` is appropriate is when adding or bumping a
> dependency deliberately — and that should be a reviewed commit.

## Daily loop

From the repo root:

```bash
npm run typecheck        # tsc --noEmit
npm test                 # vitest run (25 unit tests)
npm run test:watch       # vitest in watch mode while iterating
npm run build            # tsup → dist/ (ESM + CJS + .d.ts)
npm run dev              # tsup --watch during active development
npm run lint             # eslint
npm run format           # prettier --write
```

## Testing end-to-end in WordPress Playground

The `example/` folder is a self-contained WordPress plugin wired to the
component library via a `file:..` npm link, plus a blueprint that seeds
content so the pickers have something to match.

```bash
npm run build                      # rebuild the library first
cd example
npm run build                      # compile the block
npm run playground                 # boot Playground at http://127.0.0.1:9400
# or
npm run playground:quiet           # same, without auto-opening the browser
```

The blueprint (`example/blueprint.json`) is idempotent via wp_options
flags (`valu_cp_demo_seeded`, `valu_cp_demo_contacts_seeded`). To wipe
and re-seed from scratch:

```bash
rm -rf ~/.wordpress-playground/sites
```

See [`example/readme.md`](example/readme.md) for what the demo exercises.

## Releases

The canonical release flow is **tag-driven**: pushing a `v*.*.*` tag to
`origin` triggers `.github/workflows/publish.yml`, which publishes to
npm with provenance.

### Cutting a new version

From a clean `main` working tree:

```bash
npm version patch          # 0.1.0 → 0.1.1  (or: minor / major)
git push --follow-tags     # pushes the bump commit AND the new v0.1.1 tag
```

`npm version` edits `package.json`, creates a commit titled `0.1.1`, and
tags it `v0.1.1`. `--follow-tags` sends both the commit and the tag in one
push.

### What the workflow does

1. Checks out the tagged commit.
2. `npm ci` with Node 20 and the npm cache primed.
3. **Version check** — refuses to publish if the tag suffix doesn't match
   `package.json` (prevents rogue tags from shipping an unrelated version).
4. `npm run typecheck && npm test && npm run build`.
5. `npm publish --access public --provenance --ignore-scripts`.
   - `--access public` is required on scoped (`@valu/…`) packages to publish
     them to the free tier (also baked into `publishConfig` in package.json).
   - `--provenance` attests the build chain on npm; users can verify which
     GitHub Actions run produced the tarball.
   - `--ignore-scripts` skips rerunning the `prepublishOnly` lifecycle
     (the workflow already ran typecheck + tests + build).

### One-time setup per repo

- **`NPM_TOKEN` secret** — Generate a *Classic Automation* token on
  npmjs.com → Account → Access Tokens (granular tokens can't publish).
  Add it to GitHub → Settings → Secrets and variables → Actions →
  `NPM_TOKEN`.
- Ensure the `@valu` npm org exists and your account is a member with
  publish rights on `@valu/block-components`.

### Manual publish (fallback)

If CI is unavailable, publishing from a dev machine still works and is
belt-and-braces-safe thanks to the `prepublishOnly` hook
(`clean → typecheck → test → build`):

```bash
npm login
npm whoami            # sanity check
npm publish           # runs prepublishOnly first
```

### Rolling back

npm doesn't let you overwrite a published version. Options:

- **Deprecate** the broken version (preferred):
  `npm deprecate @valu/block-components@0.1.2 "broken — use 0.1.3 instead"`.
- **Unpublish within 72 hours** (last resort, disruptive):
  `npm unpublish @valu/block-components@0.1.2`.

Then cut a fixed `0.1.3` with the normal flow.

## What ships to npm

Controlled by the `files` field in `package.json` (a whitelist):

```json
"files": ["dist", "README.md"]
```

Anything else — including this file, `example/`, `components/` source,
tests, `tsconfig.json`, `blueprint.json`, `.github/` — is **not**
included in the tarball. Verify anytime with:

```bash
npm pack --dry-run
```

Expected: `README.md`, `package.json`, and `dist/**` (ESM + CJS + `.d.ts`
+ sourcemaps for the root barrel and each exported subpath). ~200 kB
packed, no source files.

## Commit conventions

No strict conventional-commits enforcement, but a light touch helps when
reading `git log`:

- `feat:` / `fix:` / `chore:` / `docs:` / `ci:` / `refactor:` / `test:`
  prefixes for the subject line.
- Subject in imperative mood, ≤ ~72 chars.
- Body wrapped at ~72, explains the *why* as well as the *what*.

## Troubleshooting

- **Playground shows a "run `npm run build` inside the example/ directory"
  admin notice** — you started Playground before compiling the block.
  Run `npm run build` in `example/` and restart.
- **npm publish fails with `E402 This package requires payment`** —
  the `--access public` flag is missing (or `publishConfig.access` was
  removed). Scoped packages default to private.
- **npm publish fails with `ENEEDAUTH` or 401 in CI** — `NPM_TOKEN`
  secret is missing, expired, or not an Automation token.
- **Workflow publishes but provenance link is broken** — the workflow
  must have `permissions: id-token: write` (it does) AND run on a
  GitHub-hosted runner (not a self-hosted one) for the OIDC token to
  be minted.
