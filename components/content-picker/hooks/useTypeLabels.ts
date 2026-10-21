import { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

import type { ContentKind } from '../types';
import { humanizeType } from '../utils';

interface TypeRecord {
	name?: string;
}

// The view context has the plural `name` but not `labels`: the singular
// name needs the edit context, which answers 403 for types the user can't
// edit. Constant, see selectRecord.
const TYPE_QUERY = { context: 'view', _fields: 'name' };

/**
 * Names of post types or taxonomies as they were registered, which WordPress
 * translates to the user's locale. The plural name, also where it names one
 * item, so that every type is named the same way. Falls back to
 * `humanizeType` while a record loads, and for users or types the REST API
 * doesn't show.
 */
export const useTypeLabels = (types: string[], kind: ContentKind): Record<string, string> => {
	// Values are store references or `undefined`, see useResolvedItems.
	const records = useSelect(
		(select) => {
			const out: Record<string, TypeRecord | null | undefined> = {};
			if (kind === 'user') return out;
			const core = select(coreStore);
			const entityName = kind === 'term' ? 'taxonomy' : 'postType';
			for (const type of types) {
				out[type] = core.getEntityRecord('root', entityName, type, TYPE_QUERY) as
					| TypeRecord
					| null
					| undefined;
			}
			return out;
		},
		[types, kind],
	);

	return useMemo(() => {
		const out: Record<string, string> = {};
		for (const type of types) {
			out[type] = records[type]?.name || humanizeType(type, kind);
		}
		return out;
	}, [types, kind, records]);
};

/** `useTypeLabels` for a single type. */
export const useTypeLabel = (type: string, kind: ContentKind): string => {
	const types = useMemo(() => [type], [type]);
	return useTypeLabels(types, kind)[type];
};
