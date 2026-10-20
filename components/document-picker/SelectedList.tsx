import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
	DndContext,
	DragOverlay,
	MouseSensor,
	TouchSensor,
	KeyboardSensor,
	closestCenter,
	useSensor,
	useSensors,
	defaultDropAnimation,
	type DragEndEvent,
	type DragStartEvent,
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';

import { SelectedItem } from './SelectedItem';
import { DragChip } from '../content-picker/DragChip';
import { useSortableAnnouncements } from '../content-picker/hooks/useSortableAnnouncements';
import { focusAfterRender, removeButtonId } from '../content-picker/utils';
import { aria, displayTitle, documentName } from './utils';
import { useResolvedDocuments } from './hooks/useResolvedDocuments';
import { CountPill, HeaderRow, HeaderTitle, SelectedListEl } from './styles';
import type { DocumentItem, DocumentPickerLabels, ResolvedDocumentItem } from './types';

export interface SelectedListProps {
	/** Root id of the picker, for the ids of focus targets. */
	rootId: string;
	value: DocumentItem[];
	orderable: boolean;
	maxItems: number;
	labels: DocumentPickerLabels;
	onChange: (next: DocumentItem[]) => void;
	renderSelected?: (item: ResolvedDocumentItem) => ReactNode;
	showHeader?: boolean;
	showExtensionBadge: boolean;
	showFileSize: boolean;
	showModifiedDate: boolean;
	enableItemLabels?: boolean;
}

export const SelectedList = ({
	rootId,
	value,
	orderable,
	maxItems,
	labels,
	onChange,
	renderSelected,
	showHeader = true,
	showExtensionBadge,
	showFileSize,
	showModifiedDate,
	enableItemLabels = false,
}: SelectedListProps) => {
	const resolved = useResolvedDocuments(value);
	const [activeKey, setActiveKey] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const listRef = useRef<HTMLUListElement | null>(null);
	const ids = useMemo(() => resolved.map((i) => i.key), [resolved]);
	const activeItem = activeKey ? resolved.find((i) => i.key === activeKey) : null;

	const nameOf = useCallback(
		(key: string) => {
			const item = resolved.find((i) => i.key === key);
			return item ? documentName(item) : key;
		},
		[resolved],
	);
	const { announcements, screenReaderInstructions } = useSortableAnnouncements(ids, nameOf);

	const remove = useCallback(
		(index: number) => {
			const item = resolved[index]!;
			const doc = listRef.current?.ownerDocument;
			const hadFocus = doc?.activeElement?.id === removeButtonId(rootId, item.key);
			onChange(value.filter((i) => i.key !== item.key));
			speak(
				sprintf(
					/* translators: %s: title of the removed document */
					__('Removed %s.', 'valu-block-components'),
					documentName(item),
				),
			);
			if (doc && hadFocus) {
				// The button goes away with its row. Move to the row that takes
				// its place, the one above it, or the search input after the last.
				const next = resolved[index + 1] ?? resolved[index - 1];
				focusAfterRender(
					doc,
					next ? removeButtonId(rootId, next.key) : aria(rootId, 'input'),
				);
			}
		},
		[resolved, value, onChange, rootId],
	);

	const setLabel = useCallback(
		(key: string, label: string) =>
			onChange(
				value.map((i) => {
					if (i.key !== key) {
						return i;
					}
					if (label === '') {
						const rest = { ...i };
						delete rest.label;
						return rest;
					}
					return { ...i, label };
				}),
			),
		[value, onChange],
	);

	const reorder = useCallback(
		(from: number, to: number) => {
			if (from === to) return;
			onChange(arrayMove(value, from, to));
		},
		[value, onChange],
	);

	// Dragging is announced by dnd-kit, the move buttons are not.
	const move = useCallback(
		(from: number, to: number) => {
			reorder(from, to);
			speak(
				sprintf(
					/* translators: 1: title, 2: position, 3: total */
					__('Moved %1$s to position %2$d of %3$d.', 'valu-block-components'),
					documentName(resolved[from]!),
					to + 1,
					resolved.length,
				),
			);
		},
		[reorder, resolved],
	);

	const handleDragStart = useCallback(
		(event: DragStartEvent) => setActiveKey(String(event.active.id)),
		[],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setActiveKey(null);
			const { active, over } = event;
			if (!over || active.id === over.id) return;
			const from = ids.indexOf(String(active.id));
			const to = ids.indexOf(String(over.id));
			if (from >= 0 && to >= 0) reorder(from, to);
		},
		[ids, reorder],
	);

	if (resolved.length === 0) return null;

	const isSingleSelect = maxItems === 1;
	const shouldShowHeader = showHeader && !isSingleSelect;

	const header = shouldShowHeader ? (
		<HeaderRow>
			<HeaderTitle>
				{resolved.length === 1
					? (labels.selectedSingular ?? __('Selected', 'valu-block-components'))
					: (labels.selectedPlural ?? __('Selected', 'valu-block-components'))}
			</HeaderTitle>
			<CountPill aria-hidden="true">
				{Number.isFinite(maxItems)
					? sprintf(
							/* translators: 1: current count, 2: max count */
							'%1$d / %2$d',
							resolved.length,
							maxItems,
						)
					: String(resolved.length)}
			</CountPill>
		</HeaderRow>
	) : null;

	const rows = resolved.map((item, index) => (
		<SelectedItem
			key={item.key}
			item={item}
			index={index}
			total={resolved.length}
			orderable={orderable}
			showExtensionBadge={showExtensionBadge}
			showFileSize={showFileSize}
			showModifiedDate={showModifiedDate}
			labels={labels}
			removeButtonId={removeButtonId(rootId, item.key)}
			onRemove={() => remove(index)}
			{...(index > 0 ? { onMoveUp: () => move(index, index - 1) } : {})}
			{...(index < resolved.length - 1 ? { onMoveDown: () => move(index, index + 1) } : {})}
			{...(enableItemLabels
				? {
						enableLabelEdit: true,
						onLabelChange: (label: string) => setLabel(item.key, label),
					}
				: {})}
			{...(renderSelected ? { render: renderSelected } : {})}
		/>
	));

	if (!orderable) {
		return (
			<>
				{header}
				<SelectedListEl ref={listRef} role="list">
					{rows}
				</SelectedListEl>
			</>
		);
	}

	return (
		<>
			{header}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setActiveKey(null)}
				accessibility={{ announcements, screenReaderInstructions }}
			>
				<SortableContext items={ids} strategy={verticalListSortingStrategy}>
					<SelectedListEl ref={listRef} role="list">
						{rows}
					</SelectedListEl>
				</SortableContext>
				<DragOverlay dropAnimation={defaultDropAnimation}>
					{activeItem ? <DragChip title={displayTitle(activeItem)} /> : null}
				</DragOverlay>
			</DndContext>
		</>
	);
};
