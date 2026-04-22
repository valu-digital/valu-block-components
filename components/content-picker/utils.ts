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

const postTypeLabels: Record<string, string> = {
	post: 'Post',
	page: 'Page',
	attachment: 'Media',
};

export const humanizeType = (type: string, kind: ContentKind): string => {
	if (kind === 'user') return __('User', 'valu-block-components');
	if (postTypeLabels[type]) return postTypeLabels[type];
	return type
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusLabels: Partial<Record<ContentStatus, string>> = {
	draft: 'Draft',
	pending: 'Pending',
	private: 'Private',
	future: 'Scheduled',
	trash: 'Trash',
};

export const humanizeStatus = (status: ContentStatus | undefined): string | null => {
	if (!status || status === 'publish') return null;
	return statusLabels[status] ?? status;
};

/** Stable id for ARIA references: `${rootId}-option-${index}` etc. */
export const aria = (rootId: string, suffix: string): string => `${rootId}-${suffix}`;

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
