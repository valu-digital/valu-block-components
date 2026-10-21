import { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

import type { ContentItem, ContentKind, ContentStatus, ResolvedContentItem } from '../types';
import { decodeTitle } from '../utils';
import { selectRecord, type UnavailableReason } from './selectRecord';

interface EntityRecord {
	id: number;
	status?: ContentStatus;
	title?: { rendered?: string } | string;
	name?: string;
	link?: string;
}

// The fields a row shows: posts have a title, terms and users a name.
const RECORD_QUERY = { context: 'view', _fields: 'id,status,title,name,link' };

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

	// Values are store references, strings or `undefined`, never objects
	// built here: useSelect compares the result shallowly, so a fresh wrapper
	// per item would count as a change on every call.
	const records = useSelect(
		(select) => {
			const core = select(coreStore);
			const out: Record<string, EntityRecord | UnavailableReason | undefined> = {};
			for (const item of value) {
				out[`${item.kind}:${item.type}:${item.id}`] = selectRecord<EntityRecord>(
					core,
					entityKindFor(item.kind),
					entityNameFor(item.kind, item.type),
					item.id,
					RECORD_QUERY,
				);
			}
			return out;
		},
		[value, distinctTypes],
	);

	return useMemo(
		() =>
			value.map((item): ResolvedContentItem => {
				const record = records[`${item.kind}:${item.type}:${item.id}`];

				if (record === undefined) {
					return item;
				}
				if (record === 'deleted' || record === 'restricted') {
					return { ...item, missing: record };
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
