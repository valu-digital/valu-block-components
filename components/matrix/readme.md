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
				{ id: 'edit', label: 'Edit' },
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

## Cell state, locks and badges

`getCellState(rowId, colId)` returns per-cell state. Disabled cells render
with `aria-disabled="true"` (they stay focusable), cannot be toggled, and
use `reason` as their accessible description and tooltip.

```tsx
<Matrix
	rows={users}
	groups={groups}
	value={value}
	onChange={onChange}
	getCellState={(rowId, colId) => {
		if (!canUse(rowId, colId)) return { disabled: true, reason: 'Role does not allow this' };
		if (missingDependency(rowId, colId))
			return { tone: 'warning', reason: 'Requires “Create post”' };
		return undefined;
	}}
/>
```

| Field      | Type                                 | Effect                                                 |
| ---------- | ------------------------------------ | ------------------------------------------------------ |
| `disabled` | `boolean`                            | `aria-disabled`, no toggling, grey control.            |
| `reason`   | `string`                             | Accessible description (`aria-describedby`) + tooltip. |
| `badge`    | `ReactNode`                          | Rendered next to the control.                          |
| `tone`     | `'default' \| 'warning' \| 'danger'` | Tints the cell; `warning` adds a warning icon.         |

`getCellState` runs for every visible leaf cell on every render — keep it a
lookup, not a computation.

### Column and group locks

`disabled`, `badge` and `description` on a column or group lock all of its
cells with `description` as the reason. String badges render as a pill with
a lock icon; pass a node for anything else.

```tsx
const groups = [
	{
		id: 'seo',
		label: 'Valu AI SEO',
		disabled: true,
		badge: 'Ultimate',
		description: 'Not included in your plan',
		columns: seoColumns,
	},
	{
		id: 'templates',
		label: 'Templates',
		columns: [
			{ id: 'get', label: 'Get templates' },
			{
				id: 'fill',
				label: 'Fill template',
				disabled: true,
				badge: 'Pro',
				description: 'Requires Pro',
			},
		],
	},
];
```

A locked group's collapsed summary shows its `description` instead of the
count. Groups start collapsed unless listed in `defaultExpanded` /
`expanded`, so a locked group stays out of the way by default.

## Baseline diff

Pass `baseline` (same Set shape as `value`) to compare each cell against a
reference — e.g. what a user's profile grants.

| `diff`      | In `value` | In `baseline` | Visual                                   |
| ----------- | ---------- | ------------- | ---------------------------------------- |
| `inherited` | yes        | yes           | Pale checkbox.                           |
| `added`     | yes        | no            | Green tint, bottom rule, `+` marker.     |
| `removed`   | no         | yes           | Red tint, bottom rule, slashed box, `−`. |
| `none`      | no         | no            | Default.                                 |

State is never colour-only: each override has a marker glyph and an
accessible description (`labels.diffInherited` / `diffAdded` /
`diffRemoved`). Override cells get a reset button (shown on hover / focus)
that restores the baseline and reports
`onChange(next, { rowId, colId, checked, reset: true })`.

`diffState(value, baseline, rowId, colId)` is exported for consumers that
need the same classification (e.g. an "overrides" count column).

### Row reset

Pass `onResetRow(rowId, next)` (or `showRowReset`) to show a "Reset to
baseline" action under the label of rows that differ from the baseline.
With `onResetRow` the computed Set is handed to you; with only
`showRowReset` it goes through `onChange` with
`{ colId: ALL_COLUMNS, reset: true }`. Locked cells and the master column
are not touched by a row reset.

## Single-select groups

`selection: 'single'` renders the group as radios: selecting one column
deselects the others in that group for the row. The change reports the
deselected columns.

```tsx
{
	id: 'mcp',
	label: 'MCP profile',
	selection: 'single',
	allowNone: true,            // adds a leading "None" radio
	noneLabel: 'No MCP',        // optional; defaults to labels.noneOption
	columns: profiles,
}
// onChange(next, { rowId, colId: 'writer', checked: true, deselected: ['translator'] })
```

The "none" column's id is `noneColumnId(group.id)`; it is never stored in
`value` — "none" simply means no column of the group is selected.
`selectSingle(value, rowId, groupColIds, colId | null)` is exported for
bulk actions that need the same rule.

## Row status

`getRowStatus(rowId)` returns `{ status: 'idle' | 'saving' | 'saved' |
'error', message?, onRetry? }`. It renders under the row label inside a
polite `aria-live` region (always present, so updates are announced), with
the row label prefixed for screen readers. Errors with `onRetry` show a
retry button.

## Row selection

```tsx
<Matrix
	selectableRows
	selectedRows={selected}
	onSelectedRowsChange={setSelected}
	/* … */
/>
```

Adds a sticky checkbox column with a tri-state select-all header.
Select-all acts on the current `rows` only and preserves selected ids that
are not in the list (e.g. filtered out). Space toggles the focused row;
Shift+click or Shift+Space selects the range from the last toggled row.
Bulk-action bars are left to the consumer.

## Performance

Measured with the opt-in test
(`MATRIX_PERF=1 npx vitest run components/matrix/__tests__/Matrix.perf.test.tsx`)
for 150 columns × 200 rows (30,000 cells), in happy-dom on an Apple
Silicon laptop:

PERF_RESULTS

Collapsed groups render one summary cell per row and group, so the
default view stays small. No virtualization is built in; for grids that
are expanded wholesale, filter `rows` (search, paging) before passing them
in.

## Rows are not users

Nothing in the component is coupled to users — rows are whatever the
consumer wants them to be. `MatrixRow` only requires `id` and `label`;
`avatar`, `sublabel`, and `meta` are all optional.

```tsx
const features = [
	{ id: 'posts', label: 'Posts', sublabel: 'Blog content' },
	{ id: 'pages', label: 'Pages' },
	{ id: 'media', label: 'Media library' },
	{ id: 'users', label: 'User management' },
];

<Matrix
	caption="API permissions"
	rows={features}
	columns={[
		{ id: 'read', label: 'Read' },
		{ id: 'write', label: 'Write' },
	]}
	value={selection}
	onChange={setSelection}
/>;
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
			<img src={u.avatarUrl} alt="" width={32} height={32} style={{ borderRadius: '50%' }} />
		),
		meta: u.roles.map((r) => <RoleChip key={r}>{r}</RoleChip>),
	}))}
	columns={
		[
			/* … */
		]
	}
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
cellKey('user-42', 'edit'); // → 'user-42::edit'
```

The flat-Set shape is small, easy to diff, and avoids needing an entry per
row when most rows are empty. Convert to whatever your persistence layer
expects in your `onChange`.

## Props

| Prop                   | Type                                | Default                 | Description                                                       |
| ---------------------- | ----------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `rows`                 | `MatrixRow[]`                       | _required_              | Rows top-to-bottom.                                               |
| `columns`              | `MatrixColumn[]`                    | —                       | Flat column list (mutually exclusive with `groups`).              |
| `groups`               | `MatrixColumnGroup[]`               | —                       | Grouped column list (mutually exclusive with `columns`).          |
| `master`               | `MatrixMasterColumn`                | —                       | Optional sticky gate column.                                      |
| `value`                | `ReadonlySet<string>`               | _required_              | Controlled selection. Each entry is `${rowId}::${colId}`.         |
| `onChange`             | `(next, change) => void`            | _required_              | Fires on every cell toggle.                                       |
| `expanded`             | `ReadonlySet<string>`               | —                       | Controlled expanded-group ids.                                    |
| `defaultExpanded`      | `ReadonlySet<string>`               | empty                   | Uncontrolled initial expanded set.                                |
| `onExpandedChange`     | `(next) => void`                    | —                       | Fires when a group is expanded/collapsed.                         |
| `variant`              | `'checkbox' \| 'toggle'`            | `'checkbox'`            | Default cell control.                                             |
| `renderCell`           | `(ctx) => ReactNode`                | —                       | Override the default cell control.                                |
| `renderRowHeader`      | `(row) => ReactNode`                | —                       | Override the row-header layout.                                   |
| `renderGroupSummary`   | `(ctx) => ReactNode`                | —                       | Override the collapsed-group summary cell.                        |
| `renderHeader`         | `(column) => ReactNode`             | —                       | Override leaf-column header content.                              |
| `stickyHeader`         | `boolean`                           | `true`                  | Stick column headers to the top of the viewport.                  |
| `stickyFirstColumn`    | `boolean`                           | `true`                  | Stick the row-header column (and master, if present) to the left. |
| `rowHeaderWidth`       | `number \| string`                  | `220`                   | Pinned width of the row-header column.                            |
| `maxHeight`            | `number \| string`                  | `'calc(100vh - 260px)'` | Caps the scroll viewport.                                         |
| `caption`              | `string`                            | —                       | Visually-hidden `<caption>` for screen readers.                   |
| `labels`               | `MatrixLabels`                      | —                       | i18n overrides; see `MatrixLabels` below.                         |
| `getCellState`         | `(rowId, colId) => MatrixCellState` | —                       | Per-cell lock / reason / badge / tone.                            |
| `baseline`             | `ReadonlySet<string>`               | —                       | Reference selection; enables diff states and reset.               |
| `onResetRow`           | `(rowId, next) => void`             | —                       | Row reset handler; shows the row reset action.                    |
| `showRowReset`         | `boolean`                           | `!!onResetRow`          | Show row reset; without `onResetRow` it goes through `onChange`.  |
| `getRowStatus`         | `(rowId) => MatrixRowStatus`        | —                       | Save status under the row label (aria-live).                      |
| `selectableRows`       | `boolean`                           | `false`                 | Leading select column with tri-state select-all.                  |
| `selectedRows`         | `ReadonlySet<RowId>`                | —                       | Controlled row selection.                                         |
| `onSelectedRowsChange` | `(next) => void`                    | —                       | Fires with the next selected-row Set.                             |
| `className`            | `string`                            | —                       | Extra class on the root element.                                  |
| `id`                   | `string`                            | —                       | Explicit root id; used as ARIA prefix.                            |

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
interface MatrixColumn {
	id: string;
	label: ReactNode;
	description?: string; // tooltip; lock reason when disabled
	disabled?: boolean; // lock every cell in the column
	badge?: ReactNode; // header chip, e.g. 'Pro'
}

interface MatrixColumnGroup {
	id: string;
	label: ReactNode;
	columns: MatrixColumn[];
	collapsible?: boolean; // default true
	defaultExpanded?: boolean; // default false
	disabled?: boolean; // lock every cell in the group
	badge?: ReactNode; // header chip, e.g. 'Ultimate'
	description?: string; // lock reason; collapsed summary text when locked
	selection?: 'multiple' | 'single'; // default 'multiple'
	allowNone?: boolean; // single only: leading "none" radio
	noneLabel?: ReactNode;
}
```

### `MatrixMasterColumn`

```ts
interface MatrixMasterColumn {
	id: string;
	label: ReactNode;
	disablesRow?: boolean; // default true
	width?: number | string; // default 96; widen for longer labels
}
```

The `width` field is pinned via `<colgroup>` so the column stays the same
width whether leaf columns are visible or collapsed. The default `96` fits
short labels like "Agent" or "Enabled". For longer ones — "Search Console
Access", "Käytössä koko sivustolla" — bump it: `master={{ id: 'enabled',
label: 'Search Console Access', width: 180 }}`.

### `MatrixChange`

```ts
interface MatrixChange {
	rowId: string;
	colId: string; // ALL_COLUMNS ('*') for a row reset
	checked: boolean;
	reset?: boolean; // restores the baseline
	deselected?: string[]; // single-select: columns cleared by this change
}
```

### `MatrixLabels`

Every key has an English default; pass translated strings from
`@wordpress/i18n`.

`expandGroup`, `collapseGroup`, `groupSummary(selected, total)`,
`cellToggled(row, col, checked)`, `diffInherited`, `diffAdded`,
`diffRemoved`, `resetCell(row, col)`, `resetRow`, `resetRowLabel(row)`,
`noneOption`, `statusSaving`, `statusSaved`, `statusError`, `retry`,
`selectRow(row)`, `selectAllRows`.

## Accessibility

- Renders a real `<table>` with `<caption>`, `scope="row"` / `scope="col"` /
  `scope="colgroup"`, and `aria-expanded` on group toggles.
- Each leaf and master cell has an `aria-label` of `"<row label> — <column
label>"` so screen readers announce the cell context without relying on
  table navigation.
- Cells disabled by the master gate use the underlying control's `disabled`
  state (not just visual opacity).
- Cells locked by `getCellState` or a column/group lock use
  `aria-disabled="true"` and stay focusable; the reason is linked with
  `aria-describedby` and repeated as the cell's tooltip.
- Diff states are never colour-only: a marker glyph plus an accessible
  description per cell.
- Single-select groups use native radios sharing one `name` per row and
  group, so arrow keys move within the group.
- Row status lives in a polite, atomic `aria-live` region per row.

## Non-goals

These are **not** covered and won't be added without a clear use case:

- Row filtering / search — pre-filter `rows[]` before passing in.
- Cell editing beyond toggling (text inputs, date pickers, …) — use
  `renderCell` for one-off cases or build a separate component.
- Server-side data fetching — the consumer owns state, including loading.
- Tri-state / indeterminate cells — use `renderCell` if needed.
- Multi-master columns.
