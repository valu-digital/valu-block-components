import { useEffect, useRef, type ReactNode } from 'react';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { SuggestionItem } from './SuggestionItem';
import {
	EmptyState,
	ErrorState,
	Listbox,
	ListboxScroll,
	LoadMoreRow,
	LoadingState,
	StickyHeader,
} from './styles';
import { aria } from './utils';
import type { DocumentItem, DocumentPickerLabels, SuggestionRenderState } from './types';

export interface SuggestionListProps {
	listboxId: string;
	rootId: string;
	suggestions: DocumentItem[];
	loading: boolean;
	fetchingMore: boolean;
	hasMore: boolean;
	error: unknown;
	query: string;
	highlightedIndex: number;
	selectedKeys: Set<string>;
	labels: DocumentPickerLabels;
	showExtensionBadge: boolean;
	showFileSize: boolean;
	showModifiedDate: boolean;
	headerSlot?: ReactNode;
	renderSuggestion?: (item: DocumentItem, state: SuggestionRenderState) => ReactNode;
	onHover: (index: number) => void;
	onSelect: (item: DocumentItem) => void;
	onLoadMore: () => void;
}

export const SuggestionList = ({
	listboxId,
	rootId,
	suggestions,
	loading,
	fetchingMore,
	hasMore,
	error,
	query,
	highlightedIndex,
	selectedKeys,
	labels,
	showExtensionBadge,
	showFileSize,
	showModifiedDate,
	headerSlot,
	renderSuggestion,
	onHover,
	onSelect,
	onLoadMore,
}: SuggestionListProps) => {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!hasMore || !sentinelRef.current || !scrollRef.current) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) onLoadMore();
				}
			},
			{ root: scrollRef.current, rootMargin: '120px' },
		);
		io.observe(sentinelRef.current);
		return () => io.disconnect();
	}, [hasMore, onLoadMore]);

	const header = headerSlot ? <StickyHeader>{headerSlot}</StickyHeader> : null;

	if (error) {
		return (
			<ListboxScroll ref={scrollRef}>
				{header}
				<ErrorState role="alert">
					{labels.empty ??
						__('Search failed. Please try again.', 'valu-block-components')}
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
				? (labels.noDocumentsFound ??
					__('No documents match this search.', 'valu-block-components'))
				: __('Type to search documents.', 'valu-block-components');
		return (
			<ListboxScroll ref={scrollRef}>
				{header}
				<EmptyState>{emptyMessage}</EmptyState>
			</ListboxScroll>
		);
	}

	return (
		<ListboxScroll ref={scrollRef}>
			{header}
			<Listbox
				role="listbox"
				id={listboxId}
				aria-label={labels.input ?? __('Document suggestions', 'valu-block-components')}
			>
				{suggestions.map((item, index) => {
					const optionId = aria(rootId, `option-${index}`);
					return (
						<SuggestionItem
							key={item.key}
							item={item}
							optionId={optionId}
							highlighted={index === highlightedIndex}
							selected={selectedKeys.has(item.key)}
							showExtensionBadge={showExtensionBadge}
							showFileSize={showFileSize}
							showModifiedDate={showModifiedDate}
							onHover={() => onHover(index)}
							onSelect={() => onSelect(item)}
							{...(renderSuggestion ? { render: renderSuggestion } : {})}
						/>
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
				<div ref={sentinelRef} aria-hidden="true" />
			</Listbox>
		</ListboxScroll>
	);
};
