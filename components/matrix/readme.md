# `<Matrix />`

An abstract row × column grid of selectable cells. Designed for permission
matrices, feature-flag grids, notification preferences, capability
assignments, or anything else that fits a "for each row, toggle these
columns" shape.

The component is **controlled** — the consumer owns the selection. Built on
`@wordpress/components` primitives (`CheckboxControl`, `ToggleControl`),
styled with admin CSS custom properties, accessible by default.

## Usage

```tsx
import { Matrix, selectionByRow } from '@valu/block-components/components/matrix';
import { useState } from 'react';

function NotificationPreferences({ users }) {
    const [selection, setSelection] = useState(() => new Set<string>());

    return (
        <Matrix
            caption="Notification preferences"
            rows={users.map((u) => ({
                id: String(u.id),
                label: u.name,
                sublabel: u.email,
            }))}
            columns={[
                { id: 'email', label: 'Email' },
                { id: 'push', label: 'Push' },
                { id: 'sms', label: 'SMS' },
            ]}
            value={selection}
            onChange={(next) => setSelection(next)}
        />
    );
}
```

## Three patterns

### Flat — `columns`

A single header row, no expand/collapse. Best for small, fixed sets of
columns.

```tsx
<Matrix
    rows={users}
    columns={[
        { id: 'email', label: 'Email' },
        { id: 'push', label: 'Push' },
    ]}
    value={value}
    onChange={onChange}
/>
```

### Grouped — `groups`

Two header rows. Each group is collapsible by default — collapsed groups
render a single "n / m" summary cell per row.

```tsx
<Matrix
    rows={users}
    groups={[
        {
            id: 'posts',
            label: 'Posts',
            columns: [
                { id: 'create', label: 'Create' },
                { id: 'edit',   label: 'Edit'   },
                { id: 'delete', label: 'Delete' },
            ],
        },
        {
            id: 'media',
            label: 'Media',
            columns: [
                { id: 'upload', label: 'Upload' },
                { id: 'delete', label: 'Delete' },
            ],
            defaultExpanded: true,
        },
    ]}
    value={value}
    onChange={onChange}
/>
```

Mark a group as `collapsible: false` to pin it open.

### With master column

A sticky leftmost gate. When the master cell is unchecked, leaf cells in
that row render disabled (set `disablesRow: false` to opt out).

```tsx
<Matrix
    rows={users}
    master={{ id: 'enabled', label: 'Enabled' }}
    groups={categories}
    value={value}
    onChange={onChange}
/>
```

The master cell's value lives in the same Set at `${rowId}::${master.id}`.

## Rows are not users

Nothing in the component is coupled to users — rows are whatever the
consumer wants them to be. `MatrixRow` only requires `id` and `label`;
`avatar`, `sublabel`, and `meta` are all optional.

```tsx
const features = [
    { id: 'posts', label: 'Posts',          sublabel: 'Blog content' },
    { id: 'pages', label: 'Pages' },
    { id: 'media', label: 'Media library' },
    { id: 'users', label: 'User management' },
];

<Matrix
    caption="API permissions"
    rows={features}
    columns={[
        { id: 'read',  label: 'Read'  },
        { id: 'write', label: 'Write' },
    ]}
    value={selection}
    onChange={setSelection}
/>
```

Other shapes that fit with no API change: environments × feature flags,
channels × notification events, repos × CI checks, plans × feature gates.

## Row header content

The default row-header layout is `[avatar] [label / sublabel] [meta]`. Each
slot accepts any `ReactNode`, so you can drop in a `<img>`, the WP `<Avatar>`
component, an SVG, an initials circle, or omit the slot entirely.

```tsx
<Matrix
    rows={users.map((u) => ({
        id: String(u.id),
        label: u.name,
        sublabel: u.email,
        avatar: (
            <img
                src={u.avatarUrl}
                alt=""
                width={32}
                height={32}
                style={{ borderRadius: '50%' }}
            />
        ),
        meta: u.roles.map((r) => <RoleChip key={r}>{r}</RoleChip>),
    }))}
    columns={[/* … */]}
    value={value}
    onChange={onChange}
/>
```

For a wholly different shape (avatar on top, larger thumbnail, badge
overlay, …), use `renderRowHeader={(row) => …}` to replace the row-header
content entirely.

## Selection shape

The value is a flat `Set<string>` whose entries are `${rowId}::${colId}`.
Two helpers are exported:

```ts
import { selectionByRow, cellKey } from '@valu/block-components/components/matrix';

selectionByRow(value, 'user-42'); // → ['edit', 'create']  (column ids)
cellKey('user-42', 'edit');       // → 'user-42::edit'
```

The flat-Set shape is small, easy to diff, and avoids needing an entry per
row when most rows are empty. Convert to whatever your persistence layer
expects in your `onChange`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` | `MatrixRow[]` | _required_ | Rows top-to-bottom. |
| `columns` | `MatrixColumn[]` | — | Flat column list (mutually exclusive with `groups`). |
| `groups` | `MatrixColumnGroup[]` | — | Grouped column list (mutually exclusive with `columns`). |
| `master` | `MatrixMasterColumn` | — | Optional sticky gate column. |
| `value` | `ReadonlySet<string>` | _required_ | Controlled selection. Each entry is `${rowId}::${colId}`. |
| `onChange` | `(next, change) => void` | _required_ | Fires on every cell toggle. |
| `expanded` | `ReadonlySet<string>` | — | Controlled expanded-group ids. |
| `defaultExpanded` | `ReadonlySet<string>` | empty | Uncontrolled initial expanded set. |
| `onExpandedChange` | `(next) => void` | — | Fires when a group is expanded/collapsed. |
| `variant` | `'checkbox' \| 'toggle'` | `'checkbox'` | Default cell control. |
| `renderCell` | `(ctx) => ReactNode` | — | Override the default cell control. |
| `renderRowHeader` | `(row) => ReactNode` | — | Override the row-header layout. |
| `renderGroupSummary` | `(ctx) => ReactNode` | — | Override the collapsed-group summary cell. |
| `renderHeader` | `(column) => ReactNode` | — | Override leaf-column header content. |
| `stickyHeader` | `boolean` | `true` | Stick column headers to the top of the viewport. |
| `stickyFirstColumn` | `boolean` | `true` | Stick the row-header column (and master, if present) to the left. |
| `maxHeight` | `number \| string` | `'calc(100vh - 260px)'` | Caps the scroll viewport. |
| `caption` | `string` | — | Visually-hidden `<caption>` for screen readers. |
| `labels` | `MatrixLabels` | — | i18n overrides (`expandGroup`, `collapseGroup`, `groupSummary`, `cellToggled`). |
| `className` | `string` | — | Extra class on the root element. |
| `id` | `string` | — | Explicit root id; used as ARIA prefix. |

### `MatrixRow`

```ts
{
    id: string;
    label: ReactNode;       // primary line
    sublabel?: ReactNode;   // secondary line (e.g. an email)
    avatar?: ReactNode;     // visual to the left of the labels
    meta?: ReactNode;       // trailing chips/tags
}
```

### `MatrixColumn` / `MatrixColumnGroup`

```ts
interface MatrixColumn { id: string; label: ReactNode; description?: string; }

interface MatrixColumnGroup {
    id: string;
    label: ReactNode;
    columns: MatrixColumn[];
    collapsible?: boolean;       // default true
    defaultExpanded?: boolean;   // default false
}
```

### `MatrixMasterColumn`

```ts
interface MatrixMasterColumn {
    id: string;
    label: ReactNode;
    disablesRow?: boolean;   // default true
}
```

### `MatrixChange`

```ts
interface MatrixChange { rowId: string; colId: string; checked: boolean; }
```

## Accessibility

- Renders a real `<table>` with `<caption>`, `scope="row"` / `scope="col"` /
  `scope="colgroup"`, and `aria-expanded` on group toggles.
- Each leaf and master cell has an `aria-label` of `"<row label> — <column
  label>"` so screen readers announce the cell context without relying on
  table navigation.
- Cells disabled by the master gate use the underlying control's `disabled`
  state (not just visual opacity).

## Non-goals

These are **not** covered and won't be added without a clear use case:

- Row filtering / search — pre-filter `rows[]` before passing in.
- Cell editing beyond toggling (text inputs, date pickers, …) — use
  `renderCell` for one-off cases or build a separate component.
- Server-side data fetching — the consumer owns state, including loading.
- Tri-state / indeterminate cells — use `renderCell` if needed.
- Multi-master columns.
