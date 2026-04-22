# @valu/block-components

Valu Digital's React component library for the WordPress block editor.

Components are designed to feel native to the WordPress admin — built on
`@wordpress/components` primitives, styled with the admin CSS custom
properties (`--wp-admin-theme-color`, `--wp-components-color-*`), and
accessible by default.

## Install

```bash
npm ci
```

Peer dependencies: `react ^18.3`, `react-dom ^18.3`, and the
`@wordpress/*` packages listed in `package.json` (available in any
modern Gutenberg/WP 6.4+ environment).

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
