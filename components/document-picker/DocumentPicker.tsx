import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DocumentPickerPopover } from './DocumentPickerPopover';
import { DocumentPickerInline } from './DocumentPickerInline';
import { SelectedList } from './SelectedList';
import { MediaLibraryButton } from './MediaLibraryButton';
import { EmotionCacheProvider } from '../content-picker/styles/emotionCache';
import { ActionsRow, Root } from './styles';
import { focusAfterRender, removeButtonId } from '../content-picker/utils';
import { DEFAULT_DOCUMENT_MIME_TYPES, isMaxedOut } from './utils';
import type { DocumentItem, DocumentPickerLabels, DocumentPickerProps } from './types';

const DEFAULT_LABELS: DocumentPickerLabels = {};
const DEFAULT_MIME = [...DEFAULT_DOCUMENT_MIME_TYPES];

const makeQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: 1, refetchOnWindowFocus: false },
		},
	});

/**
 * `<DocumentPicker />` — search for and attach WordPress document attachments
 * (PDFs, Word, Excel, PowerPoint by default) to a block. Combines a fast
 * REST-search popover/inline list with WordPress's native Media Library modal
 * for browsing and uploading.
 *
 * The component is **controlled** when `value` is defined and **uncontrolled**
 * (with optional `defaultValue`) otherwise. In both modes `onChange` fires
 * with the full next array.
 *
 * @example
 * <DocumentPicker
 *     label="Downloadable documents"
 *     value={attributes.documents}
 *     onChange={(items) => setAttributes({ documents: items })}
 * />
 */
export const DocumentPicker = ({
	label,
	hideLabelFromVision = false,
	help,
	variant = 'popover',
	value: controlledValue,
	defaultValue,
	onChange,
	maxItems = Infinity,
	orderable,
	placeholder,
	allowedMimeTypes,
	allowedExtensions,
	perPage,
	inputDelayMs = 250,
	fetchOnOpen = false,
	uniqueItems = true,
	enableMediaLibrary = true,
	enableItemLabels = false,
	showExtensionBadge = true,
	showFileSize = true,
	showModifiedDate = false,
	filter,
	request,
	renderSuggestion,
	renderSelected,
	labels = DEFAULT_LABELS,
	className,
	id,
}: DocumentPickerProps) => {
	const reactId = useId();
	const rootId = id ?? `valu-dp-${reactId.replace(/:/g, '')}`;

	const [uncontrolled, setUncontrolled] = useState<DocumentItem[]>(defaultValue ?? []);
	const isControlled = controlledValue !== undefined;
	const value = isControlled ? controlledValue : uncontrolled;

	const handleChange = useCallback(
		(next: DocumentItem[]) => {
			if (!isControlled) setUncontrolled(next);
			onChange?.(next);
		},
		[isControlled, onChange],
	);

	const effectiveMime = allowedMimeTypes ?? DEFAULT_MIME;
	const effectivePerPage = perPage ?? (variant === 'popover' ? 10 : 20);
	const effectiveOrderable = orderable ?? (Number.isFinite(maxItems) ? maxItems > 1 : true);

	const queryClientRef = useRef<QueryClient | null>(null);
	if (!queryClientRef.current) queryClientRef.current = makeQueryClient();

	const isSingleSelect = maxItems === 1;
	const isFull = Number.isFinite(maxItems) && value.length >= maxItems;
	// In single-select mode we hide the search input once a document is picked
	// (matches ContentPicker). The selected row carries a Replace button.
	const hideInputForSingleSelect = isSingleSelect && value.length > 0;
	const showInput = !isFull && !hideInputForSingleSelect;

	const rootRef = useRef<HTMLDivElement | null>(null);

	// A selection that fills the picker removes the search input, and focus
	// with it. Move focus to the new row instead.
	const handleSelect = useCallback(
		(next: DocumentItem[]) => {
			handleChange(next);
			const added = next[next.length - 1];
			const doc = rootRef.current?.ownerDocument;
			if (added && doc && isMaxedOut(next, maxItems)) {
				focusAfterRender(doc, removeButtonId(rootId, added.key));
			}
		},
		[handleChange, maxItems, rootId],
	);

	const variantProps = useMemo(
		() => ({
			rootId,
			label,
			hideLabelFromVision,
			...(help !== undefined ? { help } : {}),
			...(placeholder !== undefined ? { placeholder } : {}),
			allowedMimeTypes: effectiveMime,
			...(allowedExtensions !== undefined ? { allowedExtensions } : {}),
			perPage: effectivePerPage,
			inputDelayMs,
			uniqueItems,
			maxItems,
			fetchOnOpen,
			enableMediaLibrary,
			showExtensionBadge,
			showFileSize,
			showModifiedDate,
			...(filter !== undefined ? { filter } : {}),
			...(request !== undefined ? { request } : {}),
			...(renderSuggestion ? { renderSuggestion } : {}),
			value,
			onChange: handleSelect,
			labels,
		}),
		[
			rootId,
			label,
			hideLabelFromVision,
			help,
			placeholder,
			effectiveMime,
			allowedExtensions,
			effectivePerPage,
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
			handleSelect,
			labels,
		],
	);

	return (
		<EmotionCacheProvider>
			<QueryClientProvider client={queryClientRef.current}>
				<Root ref={rootRef} id={rootId} {...(className !== undefined ? { className } : {})}>
					{showInput ? (
						variant === 'popover' ? (
							<DocumentPickerPopover {...variantProps} />
						) : (
							<DocumentPickerInline {...variantProps} />
						)
					) : null}
					{/*
					 * Single-select: show a compact "Replace" affordance via the
					 * MediaLibrary modal once a document is attached.
					 */}
					{hideInputForSingleSelect && enableMediaLibrary ? (
						<ActionsRow>
							<MediaLibraryButton
								allowedMimeTypes={effectiveMime}
								{...(allowedExtensions !== undefined ? { allowedExtensions } : {})}
								multiple={false}
								value={value}
								onSelect={(items) => {
									const next = items[items.length - 1]!;
									const prev = value[0];
									// Re-selecting the same attachment keeps the
									// user-authored label; a different file drops it.
									const keepLabel =
										prev?.id === next.id && prev.label !== undefined;
									handleChange([
										keepLabel ? { ...next, label: prev.label! } : next,
									]);
								}}
								labels={labels}
								variant="tertiary"
								label={labels.replace}
							/>
						</ActionsRow>
					) : null}
					<SelectedList
						rootId={rootId}
						value={value}
						orderable={effectiveOrderable && value.length > 1}
						maxItems={maxItems}
						labels={labels}
						onChange={handleChange}
						{...(renderSelected ? { renderSelected } : {})}
						showHeader={value.length > 0}
						showExtensionBadge={showExtensionBadge}
						showFileSize={showFileSize}
						showModifiedDate={showModifiedDate}
						enableItemLabels={enableItemLabels}
					/>
				</Root>
			</QueryClientProvider>
		</EmotionCacheProvider>
	);
};
