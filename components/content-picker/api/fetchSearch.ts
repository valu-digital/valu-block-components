import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

import type { ContentItem, ContentKind, ContentStatus, RequestContext } from '../types';
import { decodeTitle, generateKey } from '../utils';

export interface FetchSearchArgs {
	query: string;
	kind: ContentKind;
	types?: string[];
	page: number;
	perPage: number;
	request?: (path: string, ctx: RequestContext) => string;
	signal?: AbortSignal;
}

export interface FetchSearchPage {
	items: ContentItem[];
	page: number;
	hasMore: boolean;
	total: number;
}

interface WPRestSearchResult {
	id: number;
	title: string;
	url?: string;
	type: string;
	subtype: string;
	_embedded?: {
		self?: Array<{
			status?: ContentStatus;
			featured_media?: number;
			['wp:featuredmedia']?: unknown;
		}>;
		'wp:featuredmedia'?: Array<{
			source_url?: string;
			media_details?: {
				sizes?: Record<string, { source_url?: string }>;
			};
		}>;
	};
}

interface WPUser {
	id: number;
	name: string;
	link?: string;
	avatar_urls?: Record<string, string>;
}

const pickThumbnail = (result: WPRestSearchResult): string | undefined => {
	const media = result._embedded?.['wp:featuredmedia']?.[0];
	if (!media) return undefined;
	const sizes = media.media_details?.sizes;
	return (
		sizes?.thumbnail?.source_url ??
		sizes?.medium?.source_url ??
		media.source_url ??
		undefined
	);
};

const pickStatus = (result: WPRestSearchResult): ContentStatus | undefined =>
	result._embedded?.self?.[0]?.status;

const buildPath = (args: FetchSearchArgs): string => {
	const { kind, types, query, page, perPage } = args;
	if (kind === 'user') {
		return addQueryArgs('/wp/v2/users', {
			search: query,
			per_page: perPage,
			page,
			context: 'view',
		});
	}
	const params: Record<string, string | number> = {
		search: query,
		type: kind,
		per_page: perPage,
		page,
		_embed: 'wp:featuredmedia,self',
	};
	if (types && types.length > 0) {
		params.subtype = types.join(',');
	}
	return addQueryArgs('/wp/v2/search', params);
};

const parseTotalPages = (response: Response): number => {
	const raw = response.headers.get('x-wp-totalpages');
	if (!raw) return 1;
	const parsed = parseInt(raw, 10);
	return Number.isNaN(parsed) ? 1 : parsed;
};

const parseTotal = (response: Response): number => {
	const raw = response.headers.get('x-wp-total');
	if (!raw) return 0;
	const parsed = parseInt(raw, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
};

export const fetchSearch = async (args: FetchSearchArgs): Promise<FetchSearchPage> => {
	const rawPath = buildPath(args);
	const path = args.request
		? args.request(rawPath, { query: args.query, page: args.page, kind: args.kind })
		: rawPath;

	const response = (await apiFetch({
		path,
		parse: false,
		signal: args.signal,
	} as Parameters<typeof apiFetch>[0])) as Response;

	const data = (await response.json()) as unknown;
	const totalPages = parseTotalPages(response);
	const total = parseTotal(response);

	let items: ContentItem[];
	if (args.kind === 'user') {
		items = (data as WPUser[]).map((u) => ({
			key: generateKey(),
			id: u.id,
			type: 'user',
			kind: 'user',
			title: decodeTitle(u.name),
			url: u.link,
			thumbnailUrl: u.avatar_urls?.['48'] ?? u.avatar_urls?.['96'],
			raw: u,
		}));
	} else {
		items = (data as WPRestSearchResult[]).map((r) => ({
			key: generateKey(),
			id: r.id,
			type: r.subtype || r.type,
			kind: args.kind,
			title: decodeTitle(r.title),
			url: r.url,
			status: pickStatus(r),
			thumbnailUrl: pickThumbnail(r),
			raw: r,
		}));
	}

	return { items, page: args.page, hasMore: args.page < totalPages, total };
};
