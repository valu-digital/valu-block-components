import type { ComponentProps, ReactNode } from 'react';
import type { Icon } from '@wordpress/components';

/**
 * Anything `<Icon icon={…}>` from @wordpress/components accepts:
 * a JSX element, a React component, a Dashicon string, an SVG, etc.
 */
export type ContentPickerIcon = ComponentProps<typeof Icon>['icon'];

/**
 * Map of post-type / taxonomy / `user` slug to an icon renderer.
 *
 * @example
 * icons={{
 *   product: myProductIcon,      // custom component
 *   category: category,           // from @wordpress/icons
 *   post_tag: tag,
 * }}
 */
export type ContentPickerIconMap = Record<string, ContentPickerIcon>;

/**
 * What kind of WordPress entity this picker searches.
 * - `post`  — posts, pages, or any custom post type
 * - `term`  — taxonomy terms
 * - `user`  — users
 */
export type ContentKind = 'post' | 'term' | 'user';

export type ContentStatus =
	| 'publish'
	| 'future'
	| 'draft'
	| 'pending'
	| 'private'
	| 'trash'
	| 'auto-draft'
	| 'inherit';

export type ContentPickerVariant = 'popover' | 'inline';

/** Reason a picked item can't be displayed normally. */
export type MissingReason = 'deleted' | 'trash';

/**
 * The shape of a picked / suggested content item.
 *
 * `key` is a stable client-side uuid — use it for React keys so duplicates
 * and reorders don't collide. `id` is the WordPress entity id.
 */
export interface ContentItem {
	key: string;
	id: number;
	type: string;
	kind: ContentKind;
	title: string;
	url?: string;
	status?: ContentStatus;
	thumbnailUrl?: string;
	excerpt?: string;
	/** Raw REST record — lets consumer filters reach beyond the normalized shape. */
	raw?: unknown;
}

/** A picked item that has been resolved against the current entity store. */
export interface ResolvedContentItem extends ContentItem {
	missing?: MissingReason;
}

/** i18n bag for user-visible strings. All optional — sensible defaults are used. */
export interface ContentPickerLabels {
	input?: string;
	help?: string;
	empty?: string;
	loading?: string;
	selectedSingular?: string;
	selectedPlural?: string;
	limitReached?: string;
	remove?: string;
	moveUp?: string;
	moveDown?: string;
	dragHandle?: string;
	statusDraft?: string;
	statusPending?: string;
	statusPrivate?: string;
	statusFuture?: string;
	statusTrash?: string;
	missing?: string;
	change?: string;
	openSuggestions?: string;
	closeSuggestions?: string;
	resultsCount?: (n: number) => string;
}

export interface RequestContext {
	query: string;
	page: number;
	kind: ContentKind;
}

export interface FilterContext {
	query: string;
	kind: ContentKind;
}

export interface SuggestionRenderState {
	highlighted: boolean;
	selected: boolean;
}

export interface ContentPickerProps {
	/** Accessible name for the picker. Required. */
	label: string;

	/** Hide the label visually but keep it for screen readers. */
	hideLabelFromVision?: boolean;

	/** Help text shown under the input. */
	help?: string;

	/** Which entity kind to search. @default 'post' */
	kind?: ContentKind;

	/**
	 * Which sub-types to search within the kind.
	 * For posts: post type slugs, defaults to `['post', 'page']`.
	 * For terms: taxonomy slugs, defaults to `['category', 'post_tag']`.
	 * Ignored for users.
	 */
	types?: string[];

	/** Visual variant. @default 'popover' */
	variant?: ContentPickerVariant;

	/** Controlled value. Omit for uncontrolled. */
	value?: ContentItem[];

	/** Uncontrolled initial value. */
	defaultValue?: ContentItem[];

	/** Called with the full new array whenever the selection changes. */
	onChange?: (items: ContentItem[]) => void;

	/** Maximum items the user can pick. `1` = single-select. @default Infinity */
	maxItems?: number;

	/** Allow drag-to-reorder. @default true when maxItems > 1 */
	orderable?: boolean;

	/** Input placeholder text. */
	placeholder?: string;

	/** Items per page from the REST search endpoint. @default 10 */
	perPage?: number;

	/** Debounce between keystrokes and the search request, in ms. @default 250 */
	inputDelayMs?: number;

	/** In `popover` variant, fetch suggestions immediately when the popover opens. */
	fetchOnOpen?: boolean;

	/** Exclude the current post being edited from the results. @default true */
	excludeCurrentPost?: boolean;

	/** Prevent duplicate items in the selection. @default true */
	uniqueItems?: boolean;

	/** Group suggestions by type heading. @default true when types.length > 1 */
	groupByType?: boolean;

	/**
	 * Hide the `All / Post / Page / …` chip row that normally appears under the
	 * search input when the picker is configured with more than one `types` entry.
	 * @default false
	 */
	disableTypeFilter?: boolean;

	/**
	 * Show each item's URL (slug) beneath the title in the suggestion list.
	 * @default true
	 */
	showUrl?: boolean;

	/**
	 * Show a small "POST" / "PAGE" / "CATEGORY" pill on each selected row.
	 * @default true when the picker is configured with more than one `types` entry
	 */
	showTypeBadge?: boolean;

	/**
	 * Icon overrides keyed by post-type or taxonomy slug (or `'user'`).
	 * By default only users render an icon; all other items render without
	 * a leading icon unless they have a featured image thumbnail.
	 */
	icons?: ContentPickerIconMap;

	/**
	 * Final filter over the normalized suggestion list, after exclusion and
	 * dedupe. Replaces the old `searchResultFilter` / `pickedItemFilter`.
	 */
	filter?: (items: ContentItem[], ctx: FilterContext) => ContentItem[];

	/**
	 * Rewrite the REST path before it is fetched. Use to add custom query
	 * params (e.g. `_fields`, meta filters). Replaces the old
	 * `queryFilter` / `queryFieldsFilter`.
	 */
	request?: (path: string, ctx: RequestContext) => string;

	/** Custom renderer for a suggestion row. */
	renderSuggestion?: (item: ContentItem, state: SuggestionRenderState) => ReactNode;

	/** Custom renderer for a selected-item row. */
	renderSelected?: (item: ResolvedContentItem) => ReactNode;

	/** Custom renderer for a group heading. */
	renderGroupHeading?: (type: string, items: ContentItem[]) => ReactNode;

	/** i18n overrides. */
	labels?: ContentPickerLabels;

	/** Extra class on the root element. */
	className?: string;

	/** Explicit id for the root element; used as prefix for ARIA ids. */
	id?: string;
}
