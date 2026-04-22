import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';

import { useContentSearch } from './useContentSearch';
import { useDebouncedValue } from './useDebouncedValue';
import { useLiveRegion } from './useLiveRegion';
import { useKeyboardNav } from './useKeyboardNav';
import { dedupeAgainst, generateKey, groupByType, isMaxedOut } from '../utils';
import type { ContentItem, ContentPickerProps } from '../types';

export interface ContentPickerControllerArgs {
	kind: NonNullable<ContentPickerProps['kind']>;
	types?: string[];
	perPage: number;
	inputDelayMs: number;
	excludeCurrentPost: boolean;
	uniqueItems: boolean;
	maxItems: number;
	groupByType: boolean;
	filter?: ContentPickerProps['filter'];
	request?: ContentPickerProps['request'];
	value: ContentItem[];
	onChange: (items: ContentItem[]) => void;
	/** Whether the suggestion UI is currently open/visible (controls `enabled`). */
	active: boolean;
	/** When true, ignore empty query and fetch anyway (inline variant + fetchOnOpen). */
	fetchEmpty: boolean;
	onSelectSideEffect?: () => void;
	onEscape?: () => void;
}

export interface ContentPickerController {
	query: string;
	setQuery: (value: string) => void;
	debouncedQuery: string;
	suggestions: ContentItem[];
	groups: Array<[string, ContentItem[]]>;
	highlightedIndex: number;
	setHighlightedIndex: (i: number) => void;
	handleKeyDown: (event: React.KeyboardEvent) => void;
	loading: boolean;
	error: unknown;
	hasMore: boolean;
	loadMore: () => void;
	fetchingMore: boolean;
	select: (item: ContentItem) => void;
	remove: (key: string) => void;
	reorder: (from: number, to: number) => void;
	replace: (items: ContentItem[]) => void;
	maxedOut: boolean;
	total: number;
	activeTypeFilter: string | null;
	setActiveTypeFilter: (type: string | null) => void;
	effectiveSearchTypes: string[] | undefined;
}

export const useContentPickerController = (
	args: ContentPickerControllerArgs,
): ContentPickerController => {
	const {
		kind,
		types,
		perPage,
		inputDelayMs,
		excludeCurrentPost,
		uniqueItems,
		maxItems,
		groupByType: groupByTypeFlag,
		filter,
		request,
		value,
		onChange,
		active,
		fetchEmpty,
		onSelectSideEffect,
		onEscape,
	} = args;

	const [query, setQuery] = useState('');
	const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
	const debouncedQuery = useDebouncedValue(query, inputDelayMs);

	const effectiveSearchTypes = useMemo(() => {
		if (activeTypeFilter && types && types.includes(activeTypeFilter)) {
			return [activeTypeFilter];
		}
		return types;
	}, [activeTypeFilter, types]);

	const currentPostId = useSelect((select) => {
		if (!excludeCurrentPost || kind !== 'post') return 0;
		const editor = select('core/editor' as never) as
			| { getCurrentPostId?: () => number | null }
			| undefined;
		return editor?.getCurrentPostId?.() ?? 0;
	}, [excludeCurrentPost, kind]);

	const enabled = active && (fetchEmpty || debouncedQuery.trim().length > 0);

	const query_ = useContentSearch({
		query: debouncedQuery,
		kind,
		types: effectiveSearchTypes,
		perPage,
		enabled,
		request,
	});

	const suggestions = useMemo(() => {
		if (!query_.data) return [];
		const flat = query_.data.pages.flatMap((p) => p.items);
		let filtered = dedupeAgainst(flat, value, uniqueItems);
		if (currentPostId) {
			filtered = filtered.filter((item) => item.id !== currentPostId);
		}
		if (filter) {
			filtered = filter(filtered, { query: debouncedQuery, kind });
		}
		return filtered;
	}, [query_.data, value, uniqueItems, currentPostId, filter, debouncedQuery, kind]);

	const shouldGroup = groupByTypeFlag && (effectiveSearchTypes?.length ?? 0) > 1;
	const groups = useMemo<Array<[string, ContentItem[]]>>(
		() => (shouldGroup ? groupByType(suggestions) : [['__all__', suggestions]]),
		[shouldGroup, suggestions],
	);

	const { announce, announceImmediate } = useLiveRegion();

	useEffect(() => {
		if (!active) return;
		if (debouncedQuery.trim().length === 0 && !fetchEmpty) return;
		if (query_.isFetching) return;
		if (query_.isError) {
			announce(__('Search failed. Try again.', 'valu-block-components'));
			return;
		}
		const count = suggestions.length;
		announce(
			sprintf(
				/* translators: %d: number of search results */
				_n('%d result', '%d results', count, 'valu-block-components'),
				count,
			),
		);
	}, [suggestions.length, query_.isFetching, query_.isError, active, debouncedQuery, fetchEmpty, announce]);

	const maxedOut = isMaxedOut(value, maxItems);

	const replace = useCallback((items: ContentItem[]) => onChange(items), [onChange]);

	const select = useCallback(
		(item: ContentItem) => {
			if (maxedOut) return;
			const limited = maxItems === 1;
			const normalized: ContentItem = {
				...item,
				key: item.key && item.key.length > 0 ? item.key : generateKey(),
			};
			const next = limited ? [normalized] : [...value, normalized];
			onChange(next);
			announceImmediate(
				sprintf(
					/* translators: 1: title, 2: selected count */
					__('Added %1$s. %2$d selected.', 'valu-block-components'),
					normalized.title,
					next.length,
				),
			);
			onSelectSideEffect?.();
		},
		[maxedOut, maxItems, value, onChange, announceImmediate, onSelectSideEffect],
	);

	const remove = useCallback(
		(key: string) => {
			const target = value.find((i) => i.key === key);
			const next = value.filter((i) => i.key !== key);
			onChange(next);
			if (target) {
				announceImmediate(
					sprintf(
						/* translators: %s: title of the removed item */
						__('Removed %s.', 'valu-block-components'),
						target.title,
					),
				);
			}
		},
		[value, onChange, announceImmediate],
	);

	const reorder = useCallback(
		(from: number, to: number) => {
			if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) {
				return;
			}
			const next = value.slice();
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			onChange(next);
			announceImmediate(
				sprintf(
					/* translators: 1: title, 2: position, 3: total */
					__('Moved %1$s to position %2$d of %3$d.', 'valu-block-components'),
					moved.title,
					to + 1,
					next.length,
				),
			);
		},
		[value, onChange, announceImmediate],
	);

	const { highlightedIndex, setHighlightedIndex, reset: resetHighlight, handleKeyDown } =
		useKeyboardNav({
			itemCount: suggestions.length,
			onSelect: (i) => {
				const item = suggestions[i];
				if (item) select(item);
			},
			onEscape,
		});

	useEffect(() => {
		resetHighlight();
	}, [debouncedQuery, activeTypeFilter, resetHighlight]);

	return {
		query,
		setQuery,
		debouncedQuery,
		suggestions,
		groups,
		highlightedIndex,
		setHighlightedIndex,
		handleKeyDown,
		loading: query_.isFetching && !query_.data,
		error: query_.error,
		hasMore: Boolean(query_.hasNextPage),
		loadMore: () => {
			if (query_.hasNextPage && !query_.isFetchingNextPage) void query_.fetchNextPage();
		},
		fetchingMore: query_.isFetchingNextPage,
		select,
		remove,
		reorder,
		replace,
		maxedOut,
		total: query_.data?.pages[0]?.total ?? 0,
		activeTypeFilter,
		setActiveTypeFilter,
		effectiveSearchTypes,
	};
};

