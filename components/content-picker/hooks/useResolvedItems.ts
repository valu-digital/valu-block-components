import { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

import type { ContentItem, ContentKind, ContentStatus, ResolvedContentItem } from '../types';
import { decodeTitle } from '../utils';

interface EntityRecord {
	id: number;
	status?: ContentStatus;
	title?: { rendered?: string } | string;
	name?: string;
	link?: string;
	featured_media?: number;
}

const entityKindFor = (kind: ContentKind): 'postType' | 'taxonomy' | 'root' => {
	if (kind === 'post') return 'postType';
	if (kind === 'term') return 'taxonomy';
	return 'root';
};

const entityNameFor = (kind: ContentKind, type: string): string => {
	if (kind === 'user') return 'user';
	return type;
};

/**
 * Hydrate picked items from the core-data store so we can detect trash /
 * deletion and show fresh titles. Batches one call per distinct `type`.
 */
export const useResolvedItems = (value: ContentItem[]): ResolvedContentItem[] => {
	const distinctTypes = useMemo(() => {
		const map = new Map<string, { kind: ContentKind; ids: number[] }>();
		for (const item of value) {
			const key = `${item.kind}:${item.type}`;
			const bucket = map.get(key);
			if (bucket) bucket.ids.push(item.id);
			else map.set(key, { kind: item.kind, ids: [item.id] });
		}
		return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
	}, [value]);

	const records = useSelect(
		(select) => {
			const core = select(coreStore);
			const out: Record<string, { record: EntityRecord | null; resolved: boolean }> = {};
			for (const item of value) {
				const kindKey = entityKindFor(item.kind);
				const nameKey = entityNameFor(item.kind, item.type);
				const record = core.getEntityRecord(kindKey, nameKey, item.id) as
					| EntityRecord
					| null
					| undefined;
				const resolved = core.hasFinishedResolution('getEntityRecord', [
					kindKey,
					nameKey,
					item.id,
				]);
				out[`${item.kind}:${item.type}:${item.id}`] = {
					record: record ?? null,
					resolved,
				};
			}
			return out;
		},
		[value, distinctTypes],
	);

	return useMemo(
		() =>
			value.map((item): ResolvedContentItem => {
				const resolvedEntry = records[`${item.kind}:${item.type}:${item.id}`];
				if (!resolvedEntry) return item;
				const { record, resolved } = resolvedEntry;

				if (!resolved) {
					return item;
				}
				if (!record) {
					return { ...item, missing: 'deleted' };
				}
				if (record.status === 'trash') {
					return { ...item, missing: 'trash', status: 'trash' };
				}
				const freshTitle =
					decodeTitle(record.title) || (record.name ? decodeTitle(record.name) : '');
				return {
					...item,
					title: freshTitle || item.title,
					status: record.status ?? item.status,
					url: record.link ?? item.url,
				};
			}),
		[value, records],
	);
};
