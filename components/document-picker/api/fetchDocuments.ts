import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

import type { DocumentItem, RequestContext } from '../types';
import { DOCUMENT_FIELDS, mapMediaToDocumentItem, matchesAllowed } from '../utils';

export interface FetchDocumentsArgs {
	query: string;
	page: number;
	perPage: number;
	mimeTypes: string[];
	allowedExtensions?: string[];
	request?: (path: string, ctx: RequestContext) => string;
	signal?: AbortSignal;
}

export interface FetchDocumentsPage {
	items: DocumentItem[];
	page: number;
	hasMore: boolean;
	total: number;
}

const buildPath = (args: FetchDocumentsArgs): string => {
	const params: Record<string, string | number> = {
		per_page: args.perPage,
		page: args.page,
		_fields: DOCUMENT_FIELDS,
		order: 'desc',
	};
	// `search` and `orderby=relevance` only make sense together — WP rejects
	// `orderby=relevance` when `search` is empty.
	const trimmed = args.query.trim();
	if (trimmed.length > 0) {
		params.search = trimmed;
		params.orderby = 'relevance';
	} else {
		params.orderby = 'date';
	}
	// `/wp/v2/media` types `mime_type` as a string (CSV), not an array. Joining
	// avoids `rest_invalid_param` 400s from passing `mime_type[]=…`.
	if (args.mimeTypes.length > 0) {
		params.mime_type = args.mimeTypes.join(',');
	}
	return addQueryArgs('/wp/v2/media', params);
};

const parseHeader = (response: Response, key: string): number => {
	const raw = response.headers.get(key);
	if (!raw) return 0;
	const parsed = parseInt(raw, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
};

export const fetchDocuments = async (args: FetchDocumentsArgs): Promise<FetchDocumentsPage> => {
	const rawPath = buildPath(args);
	const path = args.request
		? args.request(rawPath, { query: args.query, page: args.page })
		: rawPath;

	const response = (await apiFetch({
		path,
		parse: false,
		signal: args.signal,
	} as Parameters<typeof apiFetch>[0])) as Response;

	const data = (await response.json()) as unknown[];
	const totalPages = parseHeader(response, 'x-wp-totalpages') || 1;
	const total = parseHeader(response, 'x-wp-total');

	const items = (data as Parameters<typeof mapMediaToDocumentItem>[0][])
		.map(mapMediaToDocumentItem)
		.filter((item) => matchesAllowed(item, args.mimeTypes, args.allowedExtensions));

	return {
		items,
		page: args.page,
		hasMore: args.page < totalPages,
		total,
	};
};
