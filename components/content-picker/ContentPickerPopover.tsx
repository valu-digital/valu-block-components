import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { SearchCombobox } from './SearchCombobox';
import { SuggestionList } from './SuggestionList';
import { TypeFilter } from './TypeFilter';
import { useContentPickerController } from './hooks/useContentPickerController';
import { aria } from './utils';
import { MaxedOutBanner } from './styles';
import { EmotionCacheProvider } from './styles/emotionCache';
import type { ContentItem, ContentPickerLabels, ContentPickerProps } from './types';

export interface ContentPickerPopoverProps {
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

export const ContentPickerPopover = (props: ContentPickerPopoverProps) => {
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

	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const popoverBodyRef = useRef<HTMLDivElement | null>(null);
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

			// Clicks on the input row or anywhere inside the popover body keep it open.
			if (anchorContainer && anchorContainer.contains(target)) return;
			if (body && body.contains(target)) return;

			setOpen(false);
		};

		// Use capture so we beat stopPropagation inside descendants; mousedown
		// fires before the click, which keeps the close snappy and prevents the
		// focus jump from re-opening the popover.
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
				placeholder={placeholder}
				label={label}
				hideLabelFromVision={hideLabelFromVision}
				help={help}
				disabled={disabled}
				open={open && !disabled}
				listboxId={listboxId}
				activeOptionId={activeOptionId}
				labels={labels}
			/>
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
					className="valu-content-picker__popover"
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
						</div>
					</EmotionCacheProvider>
				</Popover>
			) : null}
		</div>
	);
};
