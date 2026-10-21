import { useMemo, useRef } from 'react';
import { __ } from '@wordpress/i18n';

import { SearchCombobox } from './SearchCombobox';
import { SuggestionList } from './SuggestionList';
import { MediaLibraryButton } from './MediaLibraryButton';
import { useDocumentPickerController } from './hooks/useDocumentPickerController';
import { aria } from './utils';
import { ActionsRow, MaxedOutBanner, SuggestionsShell } from './styles';
import type { DocumentItem, DocumentPickerLabels, DocumentPickerProps } from './types';

export interface DocumentPickerInlineProps {
	rootId: string;
	label: string;
	hideLabelFromVision: boolean;
	help?: string;
	placeholder?: string;
	allowedMimeTypes: string[];
	allowedExtensions?: string[];
	perPage: number;
	inputDelayMs: number;
	uniqueItems: boolean;
	maxItems: number;
	fetchOnOpen: boolean;
	enableMediaLibrary: boolean;
	showExtensionBadge: boolean;
	showFileSize: boolean;
	showModifiedDate: boolean;
	filter?: DocumentPickerProps['filter'];
	request?: DocumentPickerProps['request'];
	renderSuggestion?: DocumentPickerProps['renderSuggestion'];
	value: DocumentItem[];
	onChange: (items: DocumentItem[]) => void;
	labels: DocumentPickerLabels;
}

export const DocumentPickerInline = (props: DocumentPickerInlineProps) => {
	const {
		rootId,
		label,
		hideLabelFromVision,
		help,
		placeholder,
		allowedMimeTypes,
		allowedExtensions,
		perPage,
		inputDelayMs,
		uniqueItems,
		maxItems,
		fetchOnOpen,
		enableMediaLibrary,
		showExtensionBadge,
		showFileSize,
		showModifiedDate,
		filter,
		request,
		renderSuggestion,
		value,
		onChange,
		labels,
	} = props;

	const inputRef = useRef<HTMLInputElement | null>(null);
	const clearQueryRef = useRef<(() => void) | null>(null);

	const controller = useDocumentPickerController({
		mimeTypes: allowedMimeTypes,
		...(allowedExtensions !== undefined ? { allowedExtensions } : {}),
		perPage,
		inputDelayMs,
		uniqueItems,
		maxItems,
		...(filter !== undefined ? { filter } : {}),
		...(request !== undefined ? { request } : {}),
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
		(controller.debouncedQuery.trim().length > 0 || fetchOnOpen || value.length === 0);

	return (
		<div>
			<SearchCombobox
				ref={inputRef}
				rootId={rootId}
				value={controller.query}
				onChange={(next) => controller.setQuery(next)}
				onKeyDown={controller.handleKeyDown}
				{...(placeholder !== undefined ? { placeholder } : {})}
				label={label}
				hideLabelFromVision={hideLabelFromVision}
				{...(help !== undefined ? { help } : {})}
				disabled={disabled}
				open={shouldShowList}
				listboxId={listboxId}
				{...(activeOptionId !== undefined ? { activeOptionId } : {})}
				labels={labels}
			/>
			{enableMediaLibrary ? (
				<ActionsRow>
					<MediaLibraryButton
						allowedMimeTypes={allowedMimeTypes}
						{...(allowedExtensions !== undefined ? { allowedExtensions } : {})}
						multiple={maxItems !== 1}
						value={value}
						onSelect={(items) => controller.selectMany(items)}
						labels={labels}
						disabled={disabled}
					/>
				</ActionsRow>
			) : null}
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
						suggestions={controller.suggestions}
						loading={controller.loading}
						fetchingMore={controller.fetchingMore}
						hasMore={controller.hasMore}
						error={controller.error}
						query={controller.debouncedQuery}
						highlightedIndex={controller.highlightedIndex}
						selectedKeys={selectedKeys}
						labels={labels}
						showExtensionBadge={showExtensionBadge}
						showFileSize={showFileSize}
						showModifiedDate={showModifiedDate}
						{...(renderSuggestion ? { renderSuggestion } : {})}
						onHover={(i) => controller.setHighlightedIndex(i)}
						onSelect={(item) => controller.select(item)}
						onLoadMore={() => controller.loadMore()}
					/>
				</SuggestionsShell>
			) : null}
		</div>
	);
};
