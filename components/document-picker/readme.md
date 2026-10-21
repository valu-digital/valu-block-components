# `<DocumentPicker />`

A WordPress block-editor picker for attaching **document attachments**
(PDF, Word, Excel, PowerPoint by default) to a block. Combines a fast
REST search-as-you-type with WordPress's native Media Library modal so
editors can either lookup what they already uploaded or browse and
upload in the familiar modal.

Built on `@wordpress/components` primitives, styled with admin CSS
custom properties, and accessible by default. API and behavior mirror
`<ContentPicker />`.

## Usage

```tsx
import {
	DocumentPicker,
	DEFAULT_DOCUMENT_MIME_TYPES,
} from '@valu/block-components/components/document-picker';

function Edit({ attributes, setAttributes }) {
	return (
		<DocumentPicker
			label="Downloadable documents"
			value={attributes.documents}
			onChange={(documents) => setAttributes({ documents })}
			maxItems={5}
			allowedMimeTypes={[...DEFAULT_DOCUMENT_MIME_TYPES, 'application/zip']}
		/>
	);
}
```

## Variants

- `variant="popover"` (default) — combobox input with a floating dropdown
  of suggestions. Best for sidebars and `InspectorControls`.
- `variant="inline"` — input with suggestions always visible below. Best
  when the picker is the main focus of a block.

## Highlights

- **Hybrid pick UX**: search-as-you-type _and_ native Media Library
  modal — one mental model, no compromise.
- **Color-coded extension badges** (PDF red, Word blue, Excel green,
  PowerPoint orange) so a list of mixed file types is scannable.
- **File size + optional modified date** under each row.
- **Multi-select with drag-reorder + move-up/move-down** (keyboard
  accessible via `@dnd-kit`; the move buttons hide in narrow containers
  like the inspector sidebar, where the drag handle — which also supports
  keyboard reordering — covers the same need).
- **Editable display names** (`enableItemLabels`): each row's title
  becomes an input prefilled with the effective name. Edits are stored
  on the item as `label` without touching the attachment; commits are
  debounced (300 ms, flushed on blur) so consumers persisting to block
  attributes don't re-render per keystroke. Clearing the field — or
  typing the original title back — removes the override.
- **Single-select mode** (`maxItems={1}`) hides the search input once a
  document is attached and exposes a Replace button.
- **MIME + extension filter**: REST queries are scoped server-side via
  `mime_type[]`. The `allowedExtensions` prop is an escape hatch for
  documents with non-standard MIME types (e.g. `.dwg`).
- **Missing-attachment detection**: trashed/deleted attachments, and
  attachments the user may not read, render muted with a caution icon —
  picked items are hydrated from `@wordpress/core-data` in the REST API's
  view context.
- **Accessible**: ARIA 1.2 combobox in the popover variant, `<ul>` +
  `aria-setsize`/`aria-posinset` for the selected list, live-region
  announcements via `@wordpress/a11y`.
- **Controlled or uncontrolled**: pass `value` + `onChange`, or use
  `defaultValue`.

## Props

| Prop                  | Type                         | Default                        | Description                                                                                                                                                            |
| --------------------- | ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`               | `string`                     | _required_                     | Accessible name.                                                                                                                                                       |
| `hideLabelFromVision` | `boolean`                    | `false`                        | Visually hide the label.                                                                                                                                               |
| `help`                | `string`                     | —                              | Help text under the input.                                                                                                                                             |
| `variant`             | `'popover' \| 'inline'`      | `'popover'`                    | Interaction variant.                                                                                                                                                   |
| `value`               | `DocumentItem[]`             | —                              | Controlled value.                                                                                                                                                      |
| `defaultValue`        | `DocumentItem[]`             | `[]`                           | Uncontrolled initial value.                                                                                                                                            |
| `onChange`            | `(items) => void`            | —                              | Called with the next array.                                                                                                                                            |
| `maxItems`            | `number`                     | `Infinity`                     | `1` = single-select.                                                                                                                                                   |
| `orderable`           | `boolean`                    | `maxItems > 1`                 | Enable drag-reorder.                                                                                                                                                   |
| `placeholder`         | `string`                     | —                              | Input placeholder.                                                                                                                                                     |
| `allowedMimeTypes`    | `string[]`                   | `DEFAULT_DOCUMENT_MIME_TYPES`  | MIME types for search and Media Library filter.                                                                                                                        |
| `allowedExtensions`   | `string[]`                   | —                              | Extra extensions accepted alongside MIME.                                                                                                                              |
| `perPage`             | `number`                     | `10` (popover) / `20` (inline) | Items per REST page.                                                                                                                                                   |
| `inputDelayMs`        | `number`                     | `250`                          | Debounce between keystrokes and fetch.                                                                                                                                 |
| `fetchOnOpen`         | `boolean`                    | `false`                        | Fetch with empty query when the popover opens.                                                                                                                         |
| `uniqueItems`         | `boolean`                    | `true`                         | Prevent duplicates in the selection.                                                                                                                                   |
| `enableMediaLibrary`  | `boolean`                    | `true`                         | Show the "Browse Media Library" button.                                                                                                                                |
| `enableItemLabels` | `boolean` | `false` | Each selected row's display name becomes editable in place (input prefilled with the effective name). Stored on the item as `label`; clearing the field falls back to the attachment title. |
| `showExtensionBadge`  | `boolean`                    | `true`                         | Uppercase ext pill on each row.                                                                                                                                        |
| `showFileSize`        | `boolean`                    | `true`                         | Human-readable file size on each row.                                                                                                                                  |
| `showModifiedDate`    | `boolean`                    | `false`                        | Last-modified date on each row.                                                                                                                                        |
| `filter`              | `(items, ctx) => items`      | —                              | Final filter over normalized suggestions.                                                                                                                              |
| `request`             | `(path, ctx) => path`        | —                              | Rewrite the REST path before fetching.                                                                                                                                 |
| `renderSuggestion`    | `(item, state) => ReactNode` | —                              | Custom suggestion renderer.                                                                                                                                            |
| `renderSelected`      | `(item) => ReactNode`        | —                              | Custom selected-row renderer.                                                                                                                                          |
| `labels`              | `DocumentPickerLabels`       | —                              | i18n overrides bag.                                                                                                                                                    |
| `className`           | `string`                     | —                              | Extra class on the root.                                                                                                                                               |
| `id`                  | `string`                     | —                              | Explicit id; used as prefix for ARIA ids.                                                                                                                              |

## `DocumentItem`

```ts
interface DocumentItem {
	key: string; // stable client uuid
	id: number; // attachment id
	title: string;
	filename: string;
	url: string;
	mimeType: string;
	extension: string; // uppercase, e.g. 'PDF'
	fileSize?: number; // bytes
	modified?: string; // ISO date
	raw?: unknown; // raw REST record
	label?: string; // editor-authored display name (see enableItemLabels)
}
```

## Use cases

- **Manual document selection in a Query Loop variation**
  (e.g. `valu-query-loop-file-variation`): persist the picked IDs to a
  block attribute, then pass them to the server via
  `query_loop_block_query_vars`.
- **"Download this PDF" CTA block**: `maxItems={1}` for a single-doc
  attachment with replace flow.
- **Resource library block**: multi-select, ordered, with
  `enableItemLabels` for per-file display names (or a custom
  `renderSelected` for fully bespoke row content).

## Keyboard

| Key                    | Action                                                      |
| ---------------------- | ----------------------------------------------------------- |
| Arrow Down / Up        | Move highlight in suggestions.                              |
| Home / End             | Jump to first / last suggestion.                            |
| Enter                  | Select the highlighted suggestion.                          |
| Escape                 | Close the popover (popover variant); return focus to input. |
| Space (on drag handle) | Begin keyboard drag. Arrow keys move; Space drops.          |

## Non-goals

- **Drag-and-drop upload into the picker**. Upload happens in the
  Media Library modal, which WP already owns and styles consistently.
- **Image picking with previews**. Use `<MediaUpload>` directly or a
  dedicated image-picker component — this one is tuned for documents.
- **External URL attachments**. Picked items are WP attachments.
