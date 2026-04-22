import { useCallback, useMemo, useState, type ReactNode } from 'react';
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
import { __, sprintf } from '@wordpress/i18n';

import { SelectedItem } from './SelectedItem';
import { DragChip } from './DragChip';
import { useResolvedItems } from './hooks/useResolvedItems';
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

	const ids = useMemo(() => resolved.map((i) => i.key), [resolved]);
	const activeItem = activeKey ? resolved.find((i) => i.key === activeKey) : null;

	const remove = useCallback(
		(key: string) => onChange(value.filter((i) => i.key !== key)),
		[value, onChange],
	);

	const reorder = useCallback(
		(from: number, to: number) => {
			if (from === to) return;
			onChange(arrayMove(value, from, to));
		},
		[value, onChange],
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
			onRemove={() => remove(item.key)}
			onMoveUp={index > 0 ? () => reorder(index, index - 1) : undefined}
			onMoveDown={
				index < resolved.length - 1 ? () => reorder(index, index + 1) : undefined
			}
			render={renderSelected}
		/>
	));

	if (!orderable) {
		return (
			<>
				{header}
				<SelectedListEl role="list">{rows}</SelectedListEl>
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
			>
				<SortableContext items={ids} strategy={verticalListSortingStrategy}>
					<SelectedListEl role="list">{rows}</SelectedListEl>
				</SortableContext>
				<DragOverlay dropAnimation={defaultDropAnimation}>
					{activeItem ? <DragChip title={activeItem.title} /> : null}
				</DragOverlay>
			</DndContext>
		</>
	);
};
