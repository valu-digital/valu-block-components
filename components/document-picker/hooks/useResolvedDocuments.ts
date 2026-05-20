import { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

import type { DocumentItem, ResolvedDocumentItem } from '../types';
import { mapMediaToDocumentItem } from '../utils';

/**
 * Hydrate picked documents from core-data. If a record is missing after
 * resolution finishes, flag it with `missing: 'deleted'`. When the record
 * is found, refresh title/url/extension/size from the live record.
 */
export const useResolvedDocuments = (value: DocumentItem[]): ResolvedDocumentItem[] => {
	const records = useSelect(
		(select) => {
			const core = select(coreStore);
			const out: Record<number, { record: unknown; resolved: boolean }> = {};
			for (const item of value) {
				const record = core.getEntityRecord('postType', 'attachment', item.id);
				const resolved = core.hasFinishedResolution('getEntityRecord', [
					'postType',
					'attachment',
					item.id,
				]);
				out[item.id] = { record: record ?? null, resolved };
			}
			return out;
		},
		[value],
	);

	return useMemo(
		() =>
			value.map((item): ResolvedDocumentItem => {
				const entry = records[item.id];
				if (!entry) return item;
				const { record, resolved } = entry;
				if (!resolved) return item;
				if (!record) return { ...item, missing: 'deleted' };
				const fresh = mapMediaToDocumentItem(
					record as Parameters<typeof mapMediaToDocumentItem>[0],
				);
				return {
					...item,
					title: fresh.title || item.title,
					filename: fresh.filename || item.filename,
					url: fresh.url || item.url,
					mimeType: fresh.mimeType || item.mimeType,
					extension: fresh.extension || item.extension,
					fileSize: fresh.fileSize ?? item.fileSize,
					modified: fresh.modified ?? item.modified,
				};
			}),
		[value, records],
	);
};
