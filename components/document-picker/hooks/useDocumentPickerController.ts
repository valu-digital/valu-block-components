import { useCallback, useEffect, useMemo, useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';

import { useDocumentSearch } from './useDocumentSearch';
import { useDebouncedValue } from '../../content-picker/hooks/useDebouncedValue';
import { useLiveRegion } from '../../content-picker/hooks/useLiveRegion';
import { useKeyboardNav } from '../../content-picker/hooks/useKeyboardNav';
import { dedupeAgainst, documentName, generateKey, isMaxedOut } from '../utils';
import type { DocumentItem, DocumentPickerProps } from '../types';

export interface DocumentPickerControllerArgs {
	mimeTypes: string[];
	allowedExtensions?: string[];
	perPage: number;
	inputDelayMs: number;
	uniqueItems: boolean;
	maxItems: number;
	filter?: DocumentPickerProps['filter'];
	request?: DocumentPickerProps['request'];
	value: DocumentItem[];
	onChange: (items: DocumentItem[]) => void;
	/** Whether the suggestion UI is open/visible (controls `enabled`). */
	active: boolean;
	/** When true, ignore empty query and fetch anyway. */
	fetchEmpty: boolean;
	onSelectSideEffect?: () => void;
	onEscape?: () => void;
}

export interface DocumentPickerController {
	query: string;
	setQuery: (value: string) => void;
	debouncedQuery: string;
	suggestions: DocumentItem[];
	highlightedIndex: number;
	setHighlightedIndex: (i: number) => void;
	handleKeyDown: (event: React.KeyboardEvent) => void;
	loading: boolean;
	error: unknown;
	hasMore: boolean;
	loadMore: () => void;
	fetchingMore: boolean;
	select: (item: DocumentItem) => void;
	selectMany: (items: DocumentItem[]) => void;
	replace: (items: DocumentItem[]) => void;
	maxedOut: boolean;
	total: number;
}

export const useDocumentPickerController = (
	args: DocumentPickerControllerArgs,
): DocumentPickerController => {
	const {
		mimeTypes,
		allowedExtensions,
		perPage,
		inputDelayMs,
		uniqueItems,
		maxItems,
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
	const debouncedQuery = useDebouncedValue(query, inputDelayMs);

	const enabled = active && (fetchEmpty || debouncedQuery.trim().length > 0);

	const query_ = useDocumentSearch({
		query: debouncedQuery,
		mimeTypes,
		...(allowedExtensions !== undefined ? { allowedExtensions } : {}),
		perPage,
		enabled,
		...(request !== undefined ? { request } : {}),
	});

	const suggestions = useMemo(() => {
		if (!query_.data) return [];
		const flat = query_.data.pages.flatMap((p) => p.items);
		let filtered = dedupeAgainst(flat, value, uniqueItems);
		if (filter) {
			filtered = filter(filtered, { query: debouncedQuery });
		}
		return filtered;
	}, [query_.data, value, uniqueItems, filter, debouncedQuery]);

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
				_n('%d document found', '%d documents found', count, 'valu-block-components'),
				count,
			),
		);
	}, [
		suggestions.length,
		query_.isFetching,
		query_.isError,
		active,
		debouncedQuery,
		fetchEmpty,
		announce,
	]);

	const maxedOut = isMaxedOut(value, maxItems);

	const replace = useCallback((items: DocumentItem[]) => onChange(items), [onChange]);

	const selectMany = useCallback(
		(items: DocumentItem[]) => {
			if (items.length === 0) return;
			const limited = maxItems === 1;
			const normalized = items.map((item) => ({
				...item,
				key: item.key && item.key.length > 0 ? item.key : generateKey(),
			}));

			if (limited) {
				const next = [normalized[normalized.length - 1]!];
				onChange(next);
				announceImmediate(
					sprintf(
						/* translators: %s: document title */
						__('Selected %s.', 'valu-block-components'),
						documentName(next[0]!),
					),
				);
				onSelectSideEffect?.();
				return;
			}

			const existingIds = new Set(value.map((v) => v.id));
			const remaining = Number.isFinite(maxItems)
				? Math.max(0, maxItems - value.length)
				: normalized.length;
			const toAdd = (uniqueItems
				? normalized.filter((n) => !existingIds.has(n.id))
				: normalized
			).slice(0, remaining);
			if (toAdd.length === 0) return;
			const next = [...value, ...toAdd];
			onChange(next);
			announceImmediate(
				sprintf(
					/* translators: 1: number added, 2: total selected */
					_n(
						'Added %1$d document. %2$d selected.',
						'Added %1$d documents. %2$d selected.',
						toAdd.length,
						'valu-block-components',
					),
					toAdd.length,
					next.length,
				),
			);
			onSelectSideEffect?.();
		},
		[maxItems, value, uniqueItems, onChange, announceImmediate, onSelectSideEffect],
	);

	const select = useCallback(
		(item: DocumentItem) => {
			if (maxedOut && maxItems !== 1) return;
			selectMany([item]);
		},
		[maxedOut, maxItems, selectMany],
	);

	const {
		highlightedIndex,
		setHighlightedIndex,
		reset: resetHighlight,
		handleKeyDown,
	} = useKeyboardNav({
		itemCount: suggestions.length,
		onSelect: (i) => {
			const item = suggestions[i];
			if (item) select(item);
		},
		...(onEscape !== undefined ? { onEscape } : {}),
	});

	useEffect(() => {
		resetHighlight();
	}, [debouncedQuery, resetHighlight]);

	return {
		query,
		setQuery,
		debouncedQuery,
		suggestions,
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
		selectMany,
		replace,
		maxedOut,
		total: query_.data?.pages[0]?.total ?? 0,
	};
};
