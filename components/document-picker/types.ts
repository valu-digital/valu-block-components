import type { ReactNode } from 'react';

export type DocumentPickerVariant = 'popover' | 'inline';

/** Reason a picked document can't be displayed normally. */
export type MissingReason = 'deleted';

/**
 * A document item in the picker. `key` is a stable client-side uuid (use
 * for React keys); `id` is the WordPress attachment id.
 */
export interface DocumentItem {
	key: string;
	id: number;
	title: string;
	filename: string;
	url: string;
	mimeType: string;
	/** Uppercase extension, e.g. `PDF`, `DOCX`. Empty string if unknown. */
	extension: string;
	/** File size in bytes (from `media_details.filesize` when available). */
	fileSize?: number;
	/** ISO-8601 date string of the last modification, when available. */
	modified?: string;
	/** Raw REST record so consumer filters can reach beyond the normalized shape. */
	raw?: unknown;
	/**
	 * Editor-authored display name that overrides `title` in consumer UIs.
	 * Never derived from the REST record — set only by the user via the
	 * per-item label field (see `enableItemLabels`).
	 */
	label?: string;
}

/** A picked document resolved against the current entity store. */
export interface ResolvedDocumentItem extends DocumentItem {
	missing?: MissingReason;
}

/** i18n bag — all optional, sensible defaults are used. */
export interface DocumentPickerLabels {
	input?: string;
	help?: string;
	empty?: string;
	loading?: string;
	noDocumentsFound?: string;
	selectedSingular?: string;
	selectedPlural?: string;
	limitReached?: string;
	browseMediaLibrary?: string;
	replace?: string;
	remove?: string;
	moveUp?: string;
	moveDown?: string;
	dragHandle?: string;
	missing?: string;
	openLink?: string;
	extensionBadge?: string;
	itemLabel?: string;
}

export interface RequestContext {
	query: string;
	page: number;
}

export interface FilterContext {
	query: string;
}

export interface SuggestionRenderState {
	highlighted: boolean;
	selected: boolean;
}

export interface DocumentPickerProps {
	/** Accessible name. Required. */
	label: string;

	/** Hide the label visually but keep it for screen readers. */
	hideLabelFromVision?: boolean;

	/** Help text shown under the input. */
	help?: string;

	/** Visual variant. @default 'popover' */
	variant?: DocumentPickerVariant;

	/** Controlled value. Omit for uncontrolled. */
	value?: DocumentItem[];

	/** Uncontrolled initial value. */
	defaultValue?: DocumentItem[];

	/** Called with the next array whenever the selection changes. */
	onChange?: (items: DocumentItem[]) => void;

	/** Maximum items the user can pick. `1` = single-select. @default Infinity */
	maxItems?: number;

	/** Allow drag-to-reorder. @default true when maxItems > 1 */
	orderable?: boolean;

	/** Input placeholder text. */
	placeholder?: string;

	/**
	 * MIME types to filter REST search and forward to the Media Library modal.
	 * @default DEFAULT_DOCUMENT_MIME_TYPES (PDF, Word, Excel, PowerPoint)
	 */
	allowedMimeTypes?: string[];

	/**
	 * Additional file extensions to accept (matched case-insensitively
	 * against the basename). Useful for documents with non-standard MIME.
	 */
	allowedExtensions?: string[];

	/** Items per page from the REST search endpoint. @default 10 (popover) / 20 (inline) */
	perPage?: number;

	/** Debounce between keystrokes and the search request, in ms. @default 250 */
	inputDelayMs?: number;

	/** In `popover` variant, fetch suggestions immediately when the popover opens. */
	fetchOnOpen?: boolean;

	/** Prevent duplicate items in the selection. @default true */
	uniqueItems?: boolean;

	/** Show the "Browse Media Library" button. @default true */
	enableMediaLibrary?: boolean;

	/**
	 * Make each selected row's display name editable in place: the title is
	 * rendered as a text input prefilled with the effective name. Edits are
	 * stored on the item as `label` (the attachment itself is untouched);
	 * clearing the field — or typing the original title back — removes the
	 * override and falls back to the attachment title. @default false
	 */
	enableItemLabels?: boolean;

	/** Show the uppercase extension badge on each row. @default true */
	showExtensionBadge?: boolean;

	/** Show file size on each row. @default true */
	showFileSize?: boolean;

	/** Show the upload/modified date on each row. @default false */
	showModifiedDate?: boolean;

	/** Final filter over normalized suggestions. */
	filter?: (items: DocumentItem[], ctx: FilterContext) => DocumentItem[];

	/** Rewrite the REST path before it is fetched. */
	request?: (path: string, ctx: RequestContext) => string;

	/** Custom suggestion-row renderer. */
	renderSuggestion?: (item: DocumentItem, state: SuggestionRenderState) => ReactNode;

	/** Custom selected-row renderer. */
	renderSelected?: (item: ResolvedDocumentItem) => ReactNode;

	/** i18n overrides. */
	labels?: DocumentPickerLabels;

	/** Extra class on the root element. */
	className?: string;

	/** Explicit id for the root element; used as prefix for ARIA ids. */
	id?: string;
}
