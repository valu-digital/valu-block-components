import { useMemo, useRef } from 'react';
import { __ } from '@wordpress/i18n';

import { SearchCombobox } from './SearchCombobox';
import { SuggestionList } from './SuggestionList';
import { TypeFilter } from './TypeFilter';
import { useContentPickerController } from './hooks/useContentPickerController';
import { aria } from './utils';
import { MaxedOutBanner, SuggestionsShell } from './styles';
import type { ContentItem, ContentPickerLabels, ContentPickerProps } from './types';

export interface ContentPickerInlineProps {
	rootId: string;
	label: string;
	hideLabelFromVision: boolean;
	help?: string;
	placeholder?: string;
	kind: NonNullable<ContentPickerProps['kind']>;
	types?: string[];
	perPage: number;
	inputDelayMs: number;
	excludeCurrentPost: boolean;
	uniqueItems: boolean;
	maxItems: number;
	groupByType: boolean;
	fetchOnOpen: boolean;
	filter?: ContentPickerProps['filter'];
	request?: ContentPickerProps['request'];
	renderSuggestion?: ContentPickerProps['renderSuggestion'];
	renderGroupHeading?: ContentPickerProps['renderGroupHeading'];
	icons?: ContentPickerProps['icons'];
	disableTypeFilter?: boolean;
	showUrl?: boolean;
	value: ContentItem[];
	onChange: (items: ContentItem[]) => void;
	labels: ContentPickerLabels;
}

export const ContentPickerInline = (props: ContentPickerInlineProps) => {
	const {
		rootId,
		label,
		hideLabelFromVision,
		help,
		placeholder,
		kind,
		types,
		perPage,
		inputDelayMs,
		excludeCurrentPost,
		uniqueItems,
		maxItems,
		groupByType,
		fetchOnOpen,
		filter,
		request,
		renderSuggestion,
		renderGroupHeading,
		icons,
		disableTypeFilter,
		showUrl,
		value,
		onChange,
		labels,
	} = props;

	const inputRef = useRef<HTMLInputElement | null>(null);
	const clearQueryRef = useRef<(() => void) | null>(null);

	const controller = useContentPickerController({
		kind,
		types,
		perPage,
		inputDelayMs,
		excludeCurrentPost,
		uniqueItems,
		maxItems,
		groupByType,
		filter,
		request,
		value,
		onChange,
		active: true,
		fetchEmpty: fetchOnOpen || value.length === 0,
		onSelectSideEffect: () => {
			clearQueryRef.current?.();
			requestAnimationFrame(() => inputRef.current?.focus());
		},
	});

	clearQueryRef.current = () => controller.setQuery('');

	const listboxId = aria(rootId, 'listbox');
	const activeOptionId =
		controller.highlightedIndex >= 0
			? aria(rootId, `option-${controller.highlightedIndex}`)
			: undefined;

	const selectedKeys = useMemo(() => new Set(value.map((v) => v.key)), [value]);

	const disabled = controller.maxedOut;
	const shouldShowList =
		!disabled &&
		(controller.debouncedQuery.trim().length > 0 ||
			fetchOnOpen ||
			value.length === 0);

	return (
		<div>
			<SearchCombobox
				ref={inputRef}
				rootId={rootId}
				value={controller.query}
				onChange={(next) => controller.setQuery(next)}
				onKeyDown={controller.handleKeyDown}
				placeholder={placeholder}
				label={label}
				hideLabelFromVision={hideLabelFromVision}
				help={help}
				disabled={disabled}
				open={shouldShowList}
				listboxId={listboxId}
				activeOptionId={activeOptionId}
				labels={labels}
			/>
			{disabled ? (
				<MaxedOutBanner role="status" style={{ marginTop: 8 }}>
					{labels.limitReached ?? __('Selection limit reached.', 'valu-block-components')}
				</MaxedOutBanner>
			) : null}
			{shouldShowList ? (
				<SuggestionsShell inline style={{ marginTop: 8 }}>
					<SuggestionList
						listboxId={listboxId}
						rootId={rootId}
						groups={controller.groups}
						suggestions={controller.suggestions}
						kind={kind}
						loading={controller.loading}
						fetchingMore={controller.fetchingMore}
						hasMore={controller.hasMore}
						error={controller.error}
						query={controller.debouncedQuery}
						highlightedIndex={controller.highlightedIndex}
						selectedKeys={selectedKeys}
						icons={icons}
						labels={labels}
						showUrl={showUrl ?? true}
						headerSlot={
							!disableTypeFilter && types && types.length > 1 ? (
								<TypeFilter
									types={types}
									kind={kind}
									active={controller.activeTypeFilter}
									onChange={controller.setActiveTypeFilter}
								/>
							) : null
						}
						renderSuggestion={renderSuggestion}
						renderGroupHeading={renderGroupHeading}
						onHover={(i) => controller.setHighlightedIndex(i)}
						onSelect={(item) => controller.select(item)}
						onLoadMore={() => controller.loadMore()}
					/>
				</SuggestionsShell>
			) : null}
		</div>
	);
};
