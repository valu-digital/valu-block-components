import { type CSSProperties, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Icon } from '@wordpress/components';
import {
	caution,
	chevronDown,
	chevronUp,
	closeSmall,
	dragHandle,
} from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

import {
	ActionColumn,
	DragHandleButton,
	ItemBody,
	PrimaryText,
	SelectedRow,
	Thumb,
} from './styles';
import { StatusBadge } from './badges/StatusBadge';
import { TypeBadge } from './badges/TypeBadge';
import { resolveItemIcon } from './utils';
import type {
	ContentPickerIconMap,
	ContentPickerLabels,
	ResolvedContentItem,
} from './types';

export interface SelectedItemProps {
	item: ResolvedContentItem;
	index: number;
	total: number;
	orderable: boolean;
	showTypeBadge: boolean;
	icons?: ContentPickerIconMap;
	labels: ContentPickerLabels;
	onRemove: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	render?: (item: ResolvedContentItem) => ReactNode;
}

export const SelectedItem = ({
	item,
	index,
	total,
	orderable,
	showTypeBadge,
	icons,
	labels,
	onRemove,
	onMoveUp,
	onMoveDown,
	render,
}: SelectedItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.key,
		disabled: !orderable,
	});

	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0 : 1,
	};

	const isMissing = item.missing === 'deleted';
	const isTrash = item.missing === 'trash';
	const missingLabel =
		labels.missing ?? __('This item is no longer available.', 'valu-block-components');
	const trashLabel =
		labels.statusTrash ?? __('This item is in the trash.', 'valu-block-components');

	const removeLabel = labels.remove
		? labels.remove
		: sprintf(
				/* translators: %s: item title */
				__('Remove %s', 'valu-block-components'),
				item.title,
			);
	const moveUpLabel = labels.moveUp
		? labels.moveUp
		: sprintf(
				/* translators: %s: item title */
				__('Move %s up', 'valu-block-components'),
				item.title,
			);
	const moveDownLabel = labels.moveDown
		? labels.moveDown
		: sprintf(
				/* translators: %s: item title */
				__('Move %s down', 'valu-block-components'),
				item.title,
			);
	const hasAbnormalStatus = item.status && item.status !== 'publish';
	const resolvedIcon = resolveItemIcon(item, icons);
	const hasThumbImage = Boolean(item.thumbnailUrl) && !isMissing && !isTrash;
	const isAvatar = item.kind === 'user' && hasThumbImage;
	const hasVisual = isMissing || isTrash || hasThumbImage || Boolean(resolvedIcon);

	return (
		<SelectedRow
			ref={setNodeRef}
			style={style}
			dragging={isDragging}
			missing={isMissing || isTrash}
			aria-setsize={total}
			aria-posinset={index + 1}
		>
			{orderable ? (
				<DragHandleButton
					type="button"
					aria-label={labels.dragHandle ?? __('Reorder item', 'valu-block-components')}
					{...attributes}
					{...listeners}
				>
					<Icon icon={dragHandle} size={14} />
				</DragHandleButton>
			) : null}
			{hasVisual ? (
				<Thumb
					hasImage={hasThumbImage && !isAvatar}
					avatar={isAvatar}
					missing={isMissing || isTrash}
				>
					{isMissing || isTrash ? (
						<Icon icon={caution} size={22} />
					) : hasThumbImage ? (
						<img src={item.thumbnailUrl} alt="" loading="lazy" />
					) : resolvedIcon ? (
						<Icon icon={resolvedIcon} size={22} />
					) : null}
				</Thumb>
			) : null}
			{render ? (
				render(item)
			) : (
				<ItemBody>
					<PrimaryText muted={isMissing || isTrash} title={item.title}>
						{isMissing ? missingLabel : isTrash ? trashLabel : item.title}
					</PrimaryText>
				</ItemBody>
			)}
			{!isMissing && showTypeBadge ? (
				<TypeBadge type={item.type} kind={item.kind} />
			) : null}
			{!isMissing && hasAbnormalStatus ? (
				<StatusBadge status={item.status!} />
			) : null}
			<ActionColumn>
				{orderable ? (
					<>
						<Button
							size="small"
							variant="tertiary"
							icon={chevronUp}
							label={moveUpLabel}
							onClick={onMoveUp}
							disabled={index === 0 || !onMoveUp}
						/>
						<Button
							size="small"
							variant="tertiary"
							icon={chevronDown}
							label={moveDownLabel}
							onClick={onMoveDown}
							disabled={index === total - 1 || !onMoveDown}
						/>
					</>
				) : null}
				<Button
					size="small"
					variant="tertiary"
					icon={closeSmall}
					label={removeLabel}
					onClick={onRemove}
					isDestructive
				/>
			</ActionColumn>
		</SelectedRow>
	);
};
