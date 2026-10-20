import { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

import type { ContentKind } from '../types';
import { humanizeType } from '../utils';

export interface TypeLabels {
	/** Names one item: type hints and badges. */
	singular: string;
	/** Names a set of items: the type filter and group headings. */
	plural: string;
}

interface TypeRecord {
	labels?: { name?: string; singular_name?: string };
}

/**
 * Names of post types or taxonomies as they were registered, which WordPress
 * translates to the user's locale. Falls back to `humanizeType` while a
 * record loads, and for users or types the REST API doesn't show.
 */
export const useTypeLabels = (types: string[], kind: ContentKind): Record<string, TypeLabels> => {
	// Values are store references or `undefined`, see useResolvedItems.
	const records = useSelect(
		(select) => {
			const out: Record<string, TypeRecord | null | undefined> = {};
			if (kind === 'user') return out;
			const core = select(coreStore);
			const entityName = kind === 'term' ? 'taxonomy' : 'postType';
			for (const type of types) {
				out[type] = core.getEntityRecord('root', entityName, type) as
					| TypeRecord
					| null
					| undefined;
			}
			return out;
		},
		[types, kind],
	);

	return useMemo(() => {
		const out: Record<string, TypeLabels> = {};
		for (const type of types) {
			const labels = records[type]?.labels;
			const fallback = humanizeType(type, kind);
			out[type] = {
				singular: labels?.singular_name || fallback,
				plural: labels?.name || fallback,
			};
		}
		return out;
	}, [types, kind, records]);
};

/** `useTypeLabels` for a single type. */
export const useTypeLabel = (type: string, kind: ContentKind): TypeLabels => {
	const types = useMemo(() => [type], [type]);
	return useTypeLabels(types, kind)[type];
};
