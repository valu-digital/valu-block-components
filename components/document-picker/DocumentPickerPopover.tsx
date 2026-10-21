import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { SearchCombobox } from './SearchCombobox';
import { SuggestionList } from './SuggestionList';
import { MediaLibraryButton } from './MediaLibraryButton';
import { useDocumentPickerController } from './hooks/useDocumentPickerController';
import { aria } from './utils';
import { ActionsRow, MaxedOutBanner } from './styles';
import { EmotionCacheProvider } from '../content-picker/styles/emotionCache';
import type { DocumentItem, DocumentPickerLabels, DocumentPickerProps } from './types';

export interface DocumentPickerPopoverProps {
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

export const DocumentPickerPopover = (props: DocumentPickerPopoverProps) => {
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

	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const popoverBodyRef = useRef<HTMLDivElement | null>(null);
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
		active: open,
		fetchEmpty: fetchOnOpen,
		onSelectSideEffect: () => {
			if (maxItems === 1) {
				setOpen(false);
				return;
			}
			clearQueryRef.current?.();
			requestAnimationFrame(() => inputRef.current?.focus());
		},
		onEscape: () => {
			setOpen(false);
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

	const handleFocus = useCallback(() => {
		if (!controller.maxedOut) setOpen(true);
	}, [controller.maxedOut]);

	useEffect(() => {
		if (controller.maxedOut) setOpen(false);
	}, [controller.maxedOut]);

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (!target) return;
			const input = inputRef.current;
			const body = popoverBodyRef.current;
			const anchorContainer = input?.closest('div') ?? input;
			if (anchorContainer && anchorContainer.contains(target)) return;
			if (body && body.contains(target)) return;
			setOpen(false);
		};

		const docs = new Set<Document>();
		if (typeof document !== 'undefined') docs.add(document);
		const inputDoc = inputRef.current?.ownerDocument;
		if (inputDoc) docs.add(inputDoc);

		docs.forEach((d) => d.addEventListener('mousedown', handlePointerDown, true));
		return () => {
			docs.forEach((d) => d.removeEventListener('mousedown', handlePointerDown, true));
		};
	}, [open]);

	const disabled = controller.maxedOut;

	return (
		<div style={{ position: 'relative' }}>
			<SearchCombobox
				ref={inputRef}
				rootId={rootId}
				value={controller.query}
				onChange={(next) => {
					controller.setQuery(next);
					if (!open && !disabled) setOpen(true);
				}}
				onFocus={handleFocus}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown' && !open && !disabled) {
						event.preventDefault();
						setOpen(true);
						return;
					}
					controller.handleKeyDown(event);
				}}
				{...(placeholder !== undefined ? { placeholder } : {})}
				label={label}
				hideLabelFromVision={hideLabelFromVision}
				{...(help !== undefined ? { help } : {})}
				disabled={disabled}
				open={open && !disabled}
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
			{open && !disabled && inputRef.current ? (
				<Popover
					anchor={inputRef.current.closest('div') ?? inputRef.current}
					placement="bottom-start"
					focusOnMount={false}
					onClose={() => setOpen(false)}
					onFocusOutside={() => setOpen(false)}
					shift
					flip
					resize
					offset={4}
					className="valu-document-picker__popover"
				>
					<EmotionCacheProvider>
						<div
							ref={popoverBodyRef}
							style={{
								minWidth: inputRef.current.offsetWidth,
								width: '100%',
							}}
						>
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
						</div>
					</EmotionCacheProvider>
				</Popover>
			) : null}
		</div>
	);
};
