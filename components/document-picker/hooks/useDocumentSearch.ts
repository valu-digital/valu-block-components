import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';

import { fetchDocuments } from '../api/fetchDocuments';
import type { RequestContext } from '../types';

export interface UseDocumentSearchArgs {
	query: string;
	mimeTypes: string[];
	allowedExtensions?: string[];
	perPage: number;
	enabled?: boolean;
	request?: (path: string, ctx: RequestContext) => string;
}

export const documentSearchKey = (args: UseDocumentSearchArgs) =>
	[
		'valu/document-search',
		[...args.mimeTypes].sort().join(','),
		[...(args.allowedExtensions ?? [])].sort().join(','),
		args.query,
		args.perPage,
	] as const;

export const useDocumentSearch = (args: UseDocumentSearchArgs) =>
	useInfiniteQuery({
		queryKey: documentSearchKey(args),
		queryFn: ({ pageParam, signal }) =>
			fetchDocuments({
				query: args.query,
				page: pageParam,
				perPage: args.perPage,
				mimeTypes: args.mimeTypes,
				...(args.allowedExtensions !== undefined
					? { allowedExtensions: args.allowedExtensions }
					: {}),
				...(args.request !== undefined ? { request: args.request } : {}),
				signal,
			}),
		initialPageParam: 1,
		getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
		enabled: args.enabled ?? true,
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
