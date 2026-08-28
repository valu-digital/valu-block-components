import { v4 as uuidv4 } from 'uuid';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import type { DocumentItem } from './types';

export const generateKey = (): string => uuidv4();

/** Stable ARIA id helper: `${rootId}-${suffix}`. */
export const aria = (rootId: string, suffix: string): string => `${rootId}-${suffix}`;

export const isMaxedOut = (value: DocumentItem[], maxItems: number): boolean =>
	Number.isFinite(maxItems) && value.length >= maxItems;

/**
 * Default MIME types treated as "documents": PDF, Word, Excel, PowerPoint
 * (both legacy and Office Open XML variants).
 */
export const DEFAULT_DOCUMENT_MIME_TYPES: readonly string[] = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

const decodeRendered = (raw: unknown): string => {
	if (typeof raw === 'string') return decodeEntities(raw);
	if (raw && typeof raw === 'object' && 'rendered' in raw) {
		const rendered = (raw as { rendered?: unknown }).rendered;
		if (typeof rendered === 'string') return decodeEntities(rendered);
	}
	return '';
};

/** Extract the basename from a URL/path. Strips query and hash. */
export const basenameFromUrl = (url: string | undefined | null): string => {
	if (!url) return '';
	const cleaned = url.split('#')[0]!.split('?')[0]!;
	const segments = cleaned.split('/');
	return segments[segments.length - 1] ?? '';
};

/** Uppercase extension from a URL or filename. `''` if none. */
export const extensionFromUrl = (url: string | undefined | null): string => {
	const base = basenameFromUrl(url);
	const dot = base.lastIndexOf('.');
	if (dot <= 0 || dot === base.length - 1) return '';
	return base.slice(dot + 1).toUpperCase();
};

/**
 * Human-readable file size. Mirrors the `wp_format_bytes()` style used in
 * WP admin (1 KB = 1024 B). Returns an empty string when the input is
 * undefined or non-positive.
 */
export const formatFileSize = (bytes: number | undefined): string => {
	if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return '';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	const fixed = value >= 100 || unit === 0 ? value.toFixed(0) : value.toFixed(1);
	return `${fixed} ${units[unit]}`;
};

/** Format an ISO date string as a locale date (no time). */
export const formatModified = (iso: string | undefined): string => {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	try {
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
	} catch {
		return date.toISOString().slice(0, 10);
	}
};

interface MediaRecordShape {
	id: number;
	title?: { rendered?: string } | string;
	source_url?: string;
	url?: string; // some endpoints/plugins expose `url` instead of `source_url`
	mime_type?: string;
	mime?: string; // legacy field on attachment objects from wp.media
	media_details?: {
		filesize?: number;
		original_image?: string;
	};
	modified?: string;
	modified_gmt?: string;
	date?: string;
	filename?: string;
	link?: string;
}

/**
 * Normalize a record from `/wp/v2/media` (or from `MediaUpload.onSelect`)
 * into a `DocumentItem`. Tolerant of both shapes — `source_url`/`url`,
 * `mime_type`/`mime`, etc.
 */
export const mapMediaToDocumentItem = (raw: MediaRecordShape): DocumentItem => {
	const url = raw.source_url ?? raw.url ?? raw.link ?? '';
	const filename = raw.filename || basenameFromUrl(url);
	const title = decodeRendered(raw.title) || filename;
	const mimeType = raw.mime_type ?? raw.mime ?? '';
	const extension = extensionFromUrl(url) || extensionFromUrl(filename);
	const fileSize = raw.media_details?.filesize;
	const modified = raw.modified ?? raw.modified_gmt ?? raw.date;

	return {
		key: generateKey(),
		id: raw.id,
		title,
		filename,
		url,
		mimeType,
		extension,
		fileSize,
		modified,
		raw,
	};
};

/** Effective display name for an item: user-authored label, else title. */
export const displayTitle = (item: Pick<DocumentItem, 'label' | 'title'>): string =>
	item.label?.trim() || item.title;

/** Filter out items already present in `value` by attachment id. */
export const dedupeAgainst = (
	items: DocumentItem[],
	value: DocumentItem[],
	enabled: boolean,
): DocumentItem[] => {
	if (!enabled || value.length === 0) return items;
	const ids = new Set(value.map((v) => v.id));
	return items.filter((i) => !ids.has(i.id));
};

/**
 * Filter items so that either the MIME type matches one of `allowedMimeTypes`
 * OR the extension matches one of `allowedExtensions` (case-insensitive).
 * If both lists are empty, every item passes.
 */
export const matchesAllowed = (
	item: { mimeType: string; extension: string },
	allowedMimeTypes: string[] | undefined,
	allowedExtensions: string[] | undefined,
): boolean => {
	const hasMime = allowedMimeTypes && allowedMimeTypes.length > 0;
	const hasExt = allowedExtensions && allowedExtensions.length > 0;
	if (!hasMime && !hasExt) return true;
	if (hasMime && allowedMimeTypes!.includes(item.mimeType)) return true;
	if (hasExt) {
		const upper = item.extension.toUpperCase();
		if (allowedExtensions!.some((e) => e.replace(/^\./, '').toUpperCase() === upper)) {
			return true;
		}
	}
	return false;
};

/** Label used by the SR-only "extension badge" prefix. */
export const extensionA11yLabel = (extension: string): string =>
	extension
		? __('File type', 'valu-block-components') + ': ' + extension
		: __('Unknown file type', 'valu-block-components');
