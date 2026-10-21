import { useMemo } from 'react';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

import type { DocumentItem, ResolvedDocumentItem } from '../types';
import { DOCUMENT_FIELDS, mapMediaToDocumentItem } from '../utils';
import { selectRecord, type UnavailableReason } from '../../content-picker/hooks/selectRecord';

type MediaRecord = Parameters<typeof mapMediaToDocumentItem>[0];

const RECORD_QUERY = { context: 'view', _fields: DOCUMENT_FIELDS };

/**
 * Hydrate picked documents from core-data. If a record can't be shown once
 * resolution finishes, flag why in `missing`. When the record is found,
 * refresh title/url/extension/size from the live record.
 */
export const useResolvedDocuments = (value: DocumentItem[]): ResolvedDocumentItem[] => {
	// Values are store references, strings or `undefined`, never objects
	// built here: useSelect compares the result shallowly, so a fresh wrapper
	// per item would count as a change on every call.
	const records = useSelect(
		(select) => {
			const core = select(coreStore);
			const out: Record<number, MediaRecord | UnavailableReason | undefined> = {};
			for (const item of value) {
				out[item.id] = selectRecord<MediaRecord>(
					core,
					'postType',
					'attachment',
					item.id,
					RECORD_QUERY,
				);
			}
			return out;
		},
		[value],
	);

	return useMemo(
		() =>
			value.map((item): ResolvedDocumentItem => {
				const record = records[item.id];
				if (record === undefined) return item;
				if (record === 'deleted' || record === 'restricted') {
					return { ...item, missing: record };
				}
				const fresh = mapMediaToDocumentItem(record);
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
