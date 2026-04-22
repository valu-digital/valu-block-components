# Valu ContentPicker — Playground demo

A self-contained WordPress plugin that registers a single `valu/cp-demo`
block using `<ContentPicker />` from the parent package, plus a
Playground blueprint that seeds posts, pages, users, and categories so
the search actually has something to match.

## One-time setup

From the repository root:

```bash
# 1. Build the component library (the example imports from file:..)
npm run build

# 2. Install the example plugin's own deps
cd example
npm install
```

> Note: this is a greenfield repo, so the first `npm install` in both
> the root and `example/` has to run once to create lockfiles. After
> that, stick to `npm ci` per the Valu standard.

## Run the Playground

```bash
# From example/
npm run playground
```

…or from the repository root:

```bash
npm run playground
```

That script does two things:

1. **`wp-scripts build`** — compiles `src/index.tsx` + `block.json`
   into `example/build/`. `@wordpress/*` imports are externalized to
   `window.wp.*`; everything else (Emotion, TanStack Query, dnd-kit,
   and the `@valu/block-components` ContentPicker itself) is bundled.
2. **`npx @wp-playground/cli start`** — boots an in-memory WordPress
   with PHP 8.3, auto-mounts `example/` as the plugin, applies the
   blueprint (seeds + activation), and opens the browser at
   `http://127.0.0.1:9400` landing directly on **Add new post**.

Use `npm run playground:quiet` if you want to skip the browser launch
(useful for server-side smoke tests).

## What the blueprint does

- Creates 3 categories (Engineering, Design, Playground).
- Creates 2 seeded users (Lauri Saarni, Anna Kumpu), both authors.
- Creates 10 posts spread across the 3 categories and 2 authors.
- Creates 5 sample pages (About, Services, Case studies, Careers,
  Contact).
- Activates the `valu-cp-demo` plugin.
- Creates a draft post titled _"Try the ContentPicker"_ that already
  contains a `<!-- wp:valu/cp-demo /-->` block. Open it from the
  dashboard to jump straight into the demo.

## Playing in the editor

The demo block has a **Variant** control in the sidebar —
`popover` (the LinkControl-style floating combobox) or `inline`
(always-visible suggestion panel). Switching it re-renders all three
pickers in the demo so you can compare on the fly.

Pickers shown:

| Picker | Kind | Types | Max | Orderable |
|---|---|---|---|---|
| Related content | `post` | post + page | 5 | yes |
| Featured category | `term` | category | 1 | no |
| Primary author | `user` | — | 1 | no |

## Troubleshooting

- **"run `npm run build` inside the example/ directory"** admin notice
  — you started Playground without compiling; run `npm run build` in
  `example/` first. The `playground` script does this automatically.
- **Port 9400 is taken** — pass `--port=<free>` through to the CLI,
  e.g. `npx @wp-playground/cli start --port=9500 --blueprint=./blueprint.json`.
- **Stale component changes** — rebuild the parent (`cd .. && npm run build`)
  then the example (`npm run build`) before restarting Playground.
  (Or simpler: run `npm run playground` from the repo root, which
  chains both builds.)
- **Weird cached state** — `rm -rf ~/.wordpress-playground/sites` and
  rerun; Playground persists sites across runs and picks them back up.
