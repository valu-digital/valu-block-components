# @valu/block-components

[![npm version](https://img.shields.io/npm/v/@valu/block-components.svg)](https://www.npmjs.com/package/@valu/block-components)
[![license](https://img.shields.io/npm/l/@valu/block-components.svg)](./LICENSE)

Valu Digital's React component library for the WordPress block editor.

Components are designed to feel native to the WordPress admin — built on
`@wordpress/components` primitives, styled with the admin CSS custom
properties (`--wp-admin-theme-color`, `--wp-components-color-*`), and
accessible by default.

## Install

```bash
npm ci
```

### Requirements

- **WordPress 7.0 or newer.** The components use the `@wordpress/*` packages
  that WordPress ships at runtime.
- **A build that externalizes WordPress packages**, such as `@wordpress/scripts`
  or `@wordpress/dependency-extraction-webpack-plugin`. The `@wordpress/*`
  imports are left bare in `dist/` and must resolve to the `wp.*` globals, so
  every plugin on the page shares the editor's copy.
- **Peer dependencies:** `react ^18.3` and `react-dom ^18.3`.

The `@wordpress/*` packages are intentionally not declared as peer
dependencies: npm would check them against your `node_modules`, while the
version that actually runs is the one WordPress provides. `@wordpress/icons`
is a regular dependency because WordPress doesn't provide it at runtime.

If you use TypeScript or run unit tests that import this package, install the
`@wordpress/*` packages you use as your own `devDependencies`.

## Quickstart

```tsx
import { ContentPicker } from '@valu/block-components/components/content-picker';

function Edit({ attributes, setAttributes }) {
	return (
		<ContentPicker
			label="Related posts"
			variant="popover"
			kind="post"
			types={['post', 'page']}
			maxItems={5}
			orderable
			value={attributes.related}
			onChange={(items) => setAttributes({ related: items })}
		/>
	);
}
```

## Components

- [`ContentPicker`](components/content-picker/readme.md) — search and
  select posts, pages, users, or taxonomy terms with drag-to-reorder,
  thumbnails, status/type badges, and grouped results.
- [`DocumentPicker`](components/document-picker/readme.md) — attach
  document attachments (PDF, Word, Excel, PowerPoint by default) via
  REST search-as-you-type combined with the native Media Library modal,
  with optional in-place editable display names per item.
- [`Matrix`](components/matrix/readme.md) — abstract row × column grid of
  selectable cells with optional collapsible column groups and a sticky
  master gate column. For permission matrices, feature-flag grids,
  notification preferences, etc.

## Scripts

```bash
npm run build       # build ESM + CJS + .d.ts via tsup
npm run dev         # watch-mode build
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run lint        # eslint
npm run format      # prettier --write
```

## License

GPL-2.0-or-later — same as WordPress core.
