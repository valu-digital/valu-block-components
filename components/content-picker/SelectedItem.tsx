import { useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
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
	ReorderStack,
	SelectedRow,
	SelectedTitle,
	Thumb,
} from './styles';
import { StatusBadge } from './badges/StatusBadge';
import { TypeBadge } from './badges/TypeBadge';
import { itemName, resolveItemIcon } from './utils';
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
	/** Id of the remove button, so the list can move focus to it. */
	removeButtonId: string;
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
	removeButtonId,
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

	const name = itemName(item);
	const removeLabel = labels.remove
		? labels.remove
		: sprintf(
				/* translators: %s: item title */
				__('Remove %s', 'valu-block-components'),
				name,
			);
	const moveUpLabel = labels.moveUp
		? labels.moveUp
		: sprintf(
				/* translators: %s: item title */
				__('Move %s up', 'valu-block-components'),
				name,
			);
	const moveDownLabel = labels.moveDown
		? labels.moveDown
		: sprintf(
				/* translators: %s: item title */
				__('Move %s down', 'valu-block-components'),
				name,
			);
	const moveUpRef = useRef<HTMLButtonElement>(null);
	const moveDownRef = useRef<HTMLButtonElement>(null);

	// React reorders the list by moving row nodes, and a moved node loses
	// focus. Put it back on the button that had it.
	const keepFocus =
		(move: (() => void) | undefined, button: RefObject<HTMLButtonElement>) => () => {
			const hadFocus = button.current === button.current?.ownerDocument.activeElement;
			move?.();
			if (hadFocus) {
				requestAnimationFrame(() => button.current?.focus());
			}
		};

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
					<SelectedTitle muted={isMissing || isTrash} title={item.title}>
						{isMissing ? missingLabel : isTrash ? trashLabel : item.title}
					</SelectedTitle>
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
					<ReorderStack>
						<Button
							ref={moveUpRef}
							size="small"
							variant="tertiary"
							icon={chevronUp}
							label={moveUpLabel}
							onClick={keepFocus(onMoveUp, moveUpRef)}
							disabled={index === 0 || !onMoveUp}
							accessibleWhenDisabled
						/>
						<Button
							ref={moveDownRef}
							size="small"
							variant="tertiary"
							icon={chevronDown}
							label={moveDownLabel}
							onClick={keepFocus(onMoveDown, moveDownRef)}
							disabled={index === total - 1 || !onMoveDown}
							accessibleWhenDisabled
						/>
					</ReorderStack>
				) : null}
				<Button
					id={removeButtonId}
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
