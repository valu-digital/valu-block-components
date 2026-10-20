import { v4 as uuidv4 } from 'uuid';
import { decodeEntities } from '@wordpress/html-entities';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';

import type {
	ContentItem,
	ContentKind,
	ContentPickerIcon,
	ContentPickerIconMap,
	ContentStatus,
	ResolvedContentItem,
} from './types';

export const generateKey = (): string => uuidv4();

export const decodeTitle = (raw: unknown): string => {
	if (typeof raw === 'string') return decodeEntities(raw);
	if (raw && typeof raw === 'object' && 'rendered' in raw) {
		const rendered = (raw as { rendered?: unknown }).rendered;
		if (typeof rendered === 'string') return decodeEntities(rendered);
	}
	return '';
};

export const toDisplayUrl = (url: string | undefined | null): string => {
	if (!url) return '';
	try {
		return filterURLForDisplay(safeDecodeURI(url)) ?? '';
	} catch {
		return url;
	}
};

export const groupByType = (items: ContentItem[]): Array<[string, ContentItem[]]> => {
	const map = new Map<string, ContentItem[]>();
	for (const item of items) {
		const bucket = map.get(item.type);
		if (bucket) bucket.push(item);
		else map.set(item.type, [item]);
	}
	return Array.from(map.entries());
};

/**
 * A name for a type without its registered labels. Use `useTypeLabels`,
 * which only falls back to this while the labels load.
 */
export const humanizeType = (type: string, kind: ContentKind): string => {
	if (kind === 'user') return __('User', 'valu-block-components');
	// Built at call time, so `__()` sees the locale data loaded by then.
	const postTypeLabels: Record<string, string> = {
		post: __('Post', 'valu-block-components'),
		page: __('Page', 'valu-block-components'),
		attachment: __('Media', 'valu-block-components'),
	};
	if (postTypeLabels[type]) return postTypeLabels[type];
	return type
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
};

export const humanizeStatus = (status: ContentStatus | undefined): string | null => {
	if (!status || status === 'publish') return null;
	const statusLabels: Partial<Record<ContentStatus, string>> = {
		draft: __('Draft', 'valu-block-components'),
		pending: __('Pending', 'valu-block-components'),
		private: __('Private', 'valu-block-components'),
		future: __('Scheduled', 'valu-block-components'),
		trash: __('Trash', 'valu-block-components'),
	};
	return statusLabels[status] ?? status;
};

/** Stable id for ARIA references: `${rootId}-option-${index}` etc. */
export const aria = (rootId: string, suffix: string): string => `${rootId}-${suffix}`;

/** Id of a selected row's remove button, where focus goes after row changes. */
export const removeButtonId = (rootId: string, key: string): string =>
	aria(rootId, `remove-${key}`);

/**
 * Focus an element by id once React has committed the current change. For
 * changes that remove the focused element, which would drop focus to the
 * document body.
 */
export const focusAfterRender = (doc: Document, id: string): void => {
	requestAnimationFrame(() => doc.getElementById(id)?.focus());
};

/**
 * Name of an item for button labels and announcements. Falls back to the
 * row's state when there's no title, e.g. for a post deleted permanently.
 */
export const itemName = (item: ResolvedContentItem): string => {
	if (item.title) return item.title;
	if (item.missing === 'deleted') {
		/* translators: names an item whose post no longer exists, in "Remove %s" etc. */
		return __('unavailable item', 'valu-block-components');
	}
	if (item.missing === 'trash') {
		/* translators: names a trashed item, in "Remove %s" etc. */
		return __('item in trash', 'valu-block-components');
	}
	/* translators: names an item without a title, in "Remove %s" etc. */
	return __('untitled item', 'valu-block-components');
};

export const isMaxedOut = (value: ContentItem[], maxItems: number): boolean =>
	Number.isFinite(maxItems) && value.length >= maxItems;

/** Filter out items already present in `value` by entity id. */
export const dedupeAgainst = <T extends { id: number }>(
	items: T[],
	value: ContentItem[],
	enabled: boolean,
): T[] => {
	if (!enabled || value.length === 0) return items;
	const ids = new Set(value.map((v) => v.id));
	return items.filter((i) => !ids.has(i.id));
};

/**
 * Keep the first occurrence of each entity. `/wp/v2/search` has no unique
 * tie-breaker in its order, so result pages can overlap
 * (https://core.trac.wordpress.org/ticket/44349).
 */
export const dedupeById = <T extends { id: number; kind: string }>(items: T[]): T[] => {
	const seen = new Set<string>();
	return items.filter((i) => {
		const id = `${i.kind}:${i.id}`;
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
};

/**
 * Default icons used when a consumer hasn't provided an override.
 * Only users get one by default — everything else renders without a
 * leading glyph unless the consumer supplies an `icons` map.
 */
export const DEFAULT_ITEM_ICONS: ContentPickerIconMap = {
	user: people,
};

/** Pick the icon for an item: consumer override → built-in default → null. */
export const resolveItemIcon = (
	item: ContentItem,
	userIcons: ContentPickerIconMap | undefined,
): ContentPickerIcon | undefined => {
	if (userIcons && item.type in userIcons) return userIcons[item.type];
	if (item.type in DEFAULT_ITEM_ICONS) return DEFAULT_ITEM_ICONS[item.type];
	return undefined;
};
