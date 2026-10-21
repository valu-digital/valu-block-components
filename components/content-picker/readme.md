# `<ContentPicker />`

A WordPress block-editor content picker for attaching posts, pages, custom
post types, taxonomy terms, or users to a block. Feels native to the WP
admin — built on `@wordpress/components` primitives, styled with admin
CSS custom properties, and accessible by default.

## Usage

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

## Variants

The component has a single `variant` prop that changes the search
interaction:

- `variant="popover"` (default) — a combobox input with a floating
  dropdown of suggestions. Best for sidebars and `InspectorControls`.
  Matches Gutenberg's native `LinkControl` feel.
- `variant="inline"` — input with suggestions always visible below.
  Best when the picker is the main focus of a block.

## Highlights

- **Thumbnails** for users (avatars) and for any item you give a
  `thumbnailUrl`, for example in `filter`.
- **Status badges** (Draft, Pending, Private, Scheduled, Trash) and
  **post-type badges**, each with semantic colors using the admin theme
  tokens.
- **Grouped results** by post type when searching across multiple types.
- **Always-visible row actions** — drag handle, move up / move down,
  remove. No hidden-until-hover chrome.
- **Accessible** — ARIA 1.2 combobox in the popover variant, `<ul>` +
  `aria-setsize` / `aria-posinset` for the selected list, keyboard
  drag-reorder via `@dnd-kit`, live-region announcements via
  `@wordpress/a11y`.
- **Deletion / trash detection** — picked items are hydrated from
  `@wordpress/core-data` in the REST API's view context, so a user sees
  the items they can read, also ones they can't edit. Deleted or trashed
  items, and items the user may not read (e.g. a draft by another user),
  render in a muted state with a clear remove affordance.
- **Registered type names** — the type filter, group headings, type
  hints and badges use the plural name a post type or taxonomy was
  registered with, which WordPress translates to the user's locale. The
  singular name is only in the edit context, which hides it from users
  who can't edit the type.
- **Controlled or uncontrolled** — pass `value` + `onChange`, or use
  `defaultValue`.

## Props

| Prop                  | Type                         | Default                                                      | Description                                                                                                                                                                                                                                            |
| --------------------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`               | `string`                     | _required_                                                   | Accessible name.                                                                                                                                                                                                                                       |
| `hideLabelFromVision` | `boolean`                    | `false`                                                      | Visually hide the label.                                                                                                                                                                                                                               |
| `help`                | `string`                     | —                                                            | Help text under the input.                                                                                                                                                                                                                             |
| `kind`                | `'post' \| 'term' \| 'user'` | `'post'`                                                     | Entity kind to search.                                                                                                                                                                                                                                 |
| `types`               | `string[]`                   | `['post','page']` (posts), `['category','post_tag']` (terms) | Sub-types to search.                                                                                                                                                                                                                                   |
| `variant`             | `'popover' \| 'inline'`      | `'popover'`                                                  | Interaction variant.                                                                                                                                                                                                                                   |
| `value`               | `ContentItem[]`              | —                                                            | Controlled value.                                                                                                                                                                                                                                      |
| `defaultValue`        | `ContentItem[]`              | `[]`                                                         | Uncontrolled initial value.                                                                                                                                                                                                                            |
| `onChange`            | `(items) => void`            | —                                                            | Called with full next array.                                                                                                                                                                                                                           |
| `maxItems`            | `number`                     | `Infinity`                                                   | `1` = single-select. A numeric string such as `"20"` from `wp_localize_script()` counts as its number.                                                                                                                                                 |
| `orderable`           | `boolean`                    | `maxItems > 1`                                               | Enable drag-reorder.                                                                                                                                                                                                                                   |
| `placeholder`         | `string`                     | —                                                            | Input placeholder.                                                                                                                                                                                                                                     |
| `perPage`             | `number`                     | `10` (popover) / `20` (inline)                               | Items per page.                                                                                                                                                                                                                                        |
| `inputDelayMs`        | `number`                     | `250`                                                        | Debounce between keystrokes and fetch.                                                                                                                                                                                                                 |
| `fetchOnOpen`         | `boolean`                    | `false`                                                      | Fetch with empty query when the popover opens.                                                                                                                                                                                                         |
| `excludeCurrentPost`  | `boolean`                    | `true`                                                       | Exclude the post being edited from results.                                                                                                                                                                                                            |
| `uniqueItems`         | `boolean`                    | `true`                                                       | Prevent duplicates in the selection.                                                                                                                                                                                                                   |
| `groupByType`         | `boolean`                    | `types.length > 1`                                           | Group results by type heading.                                                                                                                                                                                                                         |
| `disableTypeFilter`   | `boolean`                    | `false`                                                      | Hide the `All / Post / Page / …` chip row shown under the search when `types.length > 1`.                                                                                                                                                              |
| `showUrl`             | `boolean`                    | `true`                                                       | Show each suggestion's slug URL beneath its title in the suggestion list.                                                                                                                                                                              |
| `showTypeBadge`       | `boolean`                    | `types.length > 1`                                           | Show a `POSTS` / `PAGES` / `CATEGORIES` pill on each selected row.                                                                                                                                                                                     |
| `icons`               | `Record<string, IconType>`   | `{ user: people }`                                           | Icon overrides keyed by post-type / taxonomy / `'user'` slug. Accepts anything `<Icon>` accepts (WP icons, JSX, custom components). By default only users show an icon; everything else is icon-less unless it has a thumbnail or a consumer override. |
| `filter`              | `(items, ctx) => items`      | —                                                            | Final filter over normalized suggestions.                                                                                                                                                                                                              |
| `request`             | `(path, ctx) => path`        | —                                                            | Rewrite the REST path before fetching. Post searches send `_fields=id,title,url,type,subtype`; widen it here if you need more fields in `raw`.                                                                                                         |
| `renderSuggestion`    | `(item, state) => ReactNode` | —                                                            | Custom suggestion renderer.                                                                                                                                                                                                                            |
| `renderSelected`      | `(item) => ReactNode`        | —                                                            | Custom selected-row renderer.                                                                                                                                                                                                                          |
| `renderGroupHeading`  | `(type, items) => ReactNode` | —                                                            | Custom group heading.                                                                                                                                                                                                                                  |
| `labels`              | `ContentPickerLabels`        | —                                                            | i18n overrides bag.                                                                                                                                                                                                                                    |

## Keyboard

| Key                    | Action                                                      |
| ---------------------- | ----------------------------------------------------------- |
| Arrow Down / Up        | Move highlight in suggestions.                              |
| Home / End             | Jump to first / last suggestion.                            |
| Enter                  | Select the highlighted suggestion.                          |
| Escape                 | Close the popover (popover variant); return focus to input. |
| Tab                    | Commit focus change; does not select.                       |
| Space (on drag handle) | Begin keyboard drag. Arrow keys move; Space drops.          |

## Non-goals

The following are intentionally **not** covered and will live in separate
components or be handled by the consumer:

- Taxonomy parent/tree picker (future `<TermPicker />`).
- List virtualization — not needed at expected list sizes.
- Recent-items / MRU cache — persistence strategy is out of scope.
- Drag between multiple pickers.
- Bulk URL/ID paste import — set `value` programmatically.
- Client-side fuzzy filter — use `filter` prop as escape hatch.
- SSR — WP editor is client-only.

## Migration from `@10up/block-components`

The API is clean-sheet. Rough mapping:

| Old prop                                                       | New prop                                            |
| -------------------------------------------------------------- | --------------------------------------------------- |
| `mode`                                                         | `kind`                                              |
| `contentTypes`                                                 | `types`                                             |
| `maxContentItems`                                              | `maxItems`                                          |
| `isOrderable`                                                  | `orderable`                                         |
| `onPickChange`                                                 | `onChange`                                          |
| `content`                                                      | `value` / `defaultValue`                            |
| `uniqueContentItems`                                           | `uniqueItems`                                       |
| `perPage`                                                      | `perPage` (same)                                    |
| `fetchInitialResults`                                          | `fetchOnOpen`                                       |
| `options.inputDelay`                                           | `inputDelayMs`                                      |
| `singlePickedLabel` / `multiPickedLabel`                       | `labels.selectedSingular` / `labels.selectedPlural` |
| `queryFilter` + `queryFieldsFilter`                            | `request`                                           |
| `searchResultFilter` + `pickedItemFilter`                      | `filter`                                            |
| `renderItem` / `renderItemType` / `PickedItemPreviewComponent` | `renderSuggestion` / `renderSelected`               |

Picked items carry a `key` (uuid) separate from `id`, so persisted values
from the old API need each item normalized with a generated `key` field
on first load.
