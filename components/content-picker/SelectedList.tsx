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
import { DragChip } from './DragChip';
import { useResolvedItems } from './hooks/useResolvedItems';
import { useSortableAnnouncements } from './hooks/useSortableAnnouncements';
import { aria, focusAfterRender, itemName, removeButtonId } from './utils';
import {
	CountPill,
	HeaderRow,
	HeaderTitle,
	SelectedListEl,
} from './styles';
import type {
	ContentItem,
	ContentPickerIconMap,
	ContentPickerLabels,
	ResolvedContentItem,
} from './types';

export interface SelectedListProps {
	/** Root id of the picker, for the ids of focus targets. */
	rootId: string;
	value: ContentItem[];
	orderable: boolean;
	maxItems: number;
	labels: ContentPickerLabels;
	onChange: (next: ContentItem[]) => void;
	renderSelected?: (item: ResolvedContentItem) => ReactNode;
	showHeader?: boolean;
	showTypeBadge: boolean;
	icons?: ContentPickerIconMap;
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
	showTypeBadge,
	icons,
}: SelectedListProps) => {
	const resolved = useResolvedItems(value);
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
			return item ? itemName(item) : key;
		},
		[resolved],
	);
	const { announcements, screenReaderInstructions } = useSortableAnnouncements(ids, nameOf);

	const remove = useCallback(
		(index: number) => {
			const item = resolved[index];
			const doc = listRef.current?.ownerDocument;
			const hadFocus = doc?.activeElement?.id === removeButtonId(rootId, item.key);
			onChange(value.filter((i) => i.key !== item.key));
			speak(
				sprintf(
					/* translators: %s: title of the removed item */
					__('Removed %s.', 'valu-block-components'),
					itemName(item),
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
					itemName(resolved[from]),
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
			showTypeBadge={showTypeBadge}
			icons={icons}
			labels={labels}
			removeButtonId={removeButtonId(rootId, item.key)}
			onRemove={() => remove(index)}
			onMoveUp={index > 0 ? () => move(index, index - 1) : undefined}
			onMoveDown={index < resolved.length - 1 ? () => move(index, index + 1) : undefined}
			render={renderSelected}
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
					{activeItem ? <DragChip title={activeItem.title} /> : null}
				</DragOverlay>
			</DndContext>
		</>
	);
};
