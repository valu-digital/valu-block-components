import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { SuggestionItem } from './SuggestionItem';
import { useTypeLabels } from './hooks/useTypeLabels';
import {
	EmptyState,
	ErrorState,
	GroupHeading,
	Listbox,
	ListboxScroll,
	LoadMoreRow,
	LoadingState,
	StickyHeader,
} from './styles';
import { aria } from './utils';
import type {
	ContentItem,
	ContentKind,
	ContentPickerIconMap,
	ContentPickerLabels,
} from './types';

export interface SuggestionListProps {
	listboxId: string;
	rootId: string;
	groups: Array<[string, ContentItem[]]>;
	suggestions: ContentItem[];
	kind: ContentKind;
	loading: boolean;
	fetchingMore: boolean;
	hasMore: boolean;
	error: unknown;
	query: string;
	activeTypeFilter: string | null;
	highlightedIndex: number;
	selectedKeys: Set<string>;
	icons?: ContentPickerIconMap;
	labels: ContentPickerLabels;
	showUrl: boolean;
	headerSlot?: ReactNode;
	renderSuggestion?: (
		item: ContentItem,
		state: { highlighted: boolean; selected: boolean },
	) => ReactNode;
	renderGroupHeading?: (type: string, items: ContentItem[]) => ReactNode;
	onHover: (index: number) => void;
	onSelect: (item: ContentItem) => void;
	onLoadMore: () => void;
}

export const SuggestionList = ({
	listboxId,
	rootId,
	groups,
	suggestions,
	kind,
	loading,
	fetchingMore,
	hasMore,
	error,
	query,
	activeTypeFilter,
	highlightedIndex,
	selectedKeys,
	icons,
	labels,
	showUrl,
	headerSlot,
	renderSuggestion,
	renderGroupHeading,
	onHover,
	onSelect,
	onLoadMore,
}: SuggestionListProps) => {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
	// Callers pass a new function on every render. Reading it from a ref keeps
	// the observer from being recreated on every render: a new observer
	// reports the sentinel right away, which would load a page every time.
	const onLoadMoreRef = useRef(onLoadMore);
	onLoadMoreRef.current = onLoadMore;

	// A new search starts from the top. Left at the bottom, the shorter list
	// would show the sentinel at once and load a second page.
	useEffect(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = 0;
	}, [query, activeTypeFilter]);

	// Paused while a page loads and recreated after it, on purpose. The
	// observer only reports changes, so a page that adds few rows (duplicates,
	// `filter`) would leave the sentinel in view and stop loading. A new one
	// reports it right away.
	useEffect(() => {
		if (!hasMore || fetchingMore || !sentinel || !scrollRef.current) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) onLoadMoreRef.current();
				}
			},
			{ root: scrollRef.current, rootMargin: '120px' },
		);
		io.observe(sentinel);
		return () => io.disconnect();
	}, [hasMore, sentinel, fetchingMore]);

	const types = useMemo(
		() => Array.from(new Set(suggestions.map((item) => item.type))),
		[suggestions],
	);
	const typeLabels = useTypeLabels(types, kind);

	const header = headerSlot ? <StickyHeader>{headerSlot}</StickyHeader> : null;

	if (error) {
		return (
			<ListboxScroll ref={scrollRef}>
				{header}
				<ErrorState role="alert">
					{labels.empty ?? __('Search failed. Please try again.', 'valu-block-components')}
				</ErrorState>
			</ListboxScroll>
		);
	}

	if (loading && suggestions.length === 0) {
		return (
			<ListboxScroll ref={scrollRef}>
				{header}
				<LoadingState>
					<Spinner />
					{labels.loading ?? __('Searching…', 'valu-block-components')}
				</LoadingState>
			</ListboxScroll>
		);
	}

	if (suggestions.length === 0) {
		const emptyMessage =
			query.trim().length > 0
				? (labels.empty ?? __('No matches. Try a different search.', 'valu-block-components'))
				: __('Type to search.', 'valu-block-components');
		return (
			<ListboxScroll ref={scrollRef}>
				{header}
				<EmptyState>{emptyMessage}</EmptyState>
			</ListboxScroll>
		);
	}

	let runningIndex = 0;
	const showGroupHeadings = groups.length > 1 || groups[0]?.[0] !== '__all__';
	const showTypeHint = !showGroupHeadings;

	return (
		<ListboxScroll ref={scrollRef}>
			{header}
			<Listbox
				role="listbox"
				id={listboxId}
				aria-label={labels.input ?? __('Suggestions', 'valu-block-components')}
			>
				{groups.map(([type, items]) => {
					const headingId = aria(rootId, `group-${type}`);
					const optionNodes = items.map((item) => {
						const index = runningIndex++;
						const optionId = aria(rootId, `option-${index}`);
						return (
							<SuggestionItem
								key={item.key}
								item={item}
								optionId={optionId}
								highlighted={index === highlightedIndex}
								selected={selectedKeys.has(item.key)}
								typeHint={showTypeHint ? typeLabels[item.type].singular : null}
								showUrl={showUrl}
								icons={icons}
								onHover={() => onHover(index)}
								onSelect={() => onSelect(item)}
								render={renderSuggestion}
							/>
						);
					});

					if (!showGroupHeadings) return optionNodes;

					return (
						<div role="group" key={type} aria-labelledby={headingId}>
							<GroupHeading id={headingId}>
								{renderGroupHeading
									? renderGroupHeading(type, items)
									: typeLabels[type].plural}
							</GroupHeading>
							{optionNodes}
						</div>
					);
				})}
				{hasMore ? (
					<LoadMoreRow>
						<Button
							variant="tertiary"
							onClick={onLoadMore}
							disabled={fetchingMore}
							isBusy={fetchingMore}
						>
							{fetchingMore
								? __('Loading…', 'valu-block-components')
								: __('Load more', 'valu-block-components')}
						</Button>
					</LoadMoreRow>
				) : null}
				<div ref={setSentinel} aria-hidden="true" />
			</Listbox>
		</ListboxScroll>
	);
};
