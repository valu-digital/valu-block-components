import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';

import { fetchSearch } from '../api/fetchSearch';
import type { ContentKind, RequestContext } from '../types';

export interface UseContentSearchArgs {
	query: string;
	kind: ContentKind;
	types?: string[];
	perPage: number;
	enabled?: boolean;
	request?: (path: string, ctx: RequestContext) => string;
}

export const contentSearchKey = (args: UseContentSearchArgs) =>
	[
		'valu/content-search',
		args.kind,
		[...(args.types ?? [])].sort().join(','),
		args.query,
		args.perPage,
	] as const;

export const useContentSearch = (args: UseContentSearchArgs) =>
	useInfiniteQuery({
		queryKey: contentSearchKey(args),
		queryFn: ({ pageParam, signal }) =>
			fetchSearch({
				query: args.query,
				kind: args.kind,
				types: args.types,
				page: pageParam,
				perPage: args.perPage,
				request: args.request,
				signal,
			}),
		initialPageParam: 1,
		getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
		enabled: args.enabled ?? true,
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
