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
	DocMetaInline,
	DocRowBody,
	DragHandleButton,
	FilenameText,
	PrimaryText,
	SelectedRow,
} from './styles';
import { ExtensionBadge } from './badges/ExtensionBadge';
import { formatFileSize, formatModified } from './utils';
import type { DocumentPickerLabels, ResolvedDocumentItem } from './types';

export interface SelectedItemProps {
	item: ResolvedDocumentItem;
	index: number;
	total: number;
	orderable: boolean;
	showExtensionBadge: boolean;
	showFileSize: boolean;
	showModifiedDate: boolean;
	labels: DocumentPickerLabels;
	onRemove: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	render?: (item: ResolvedDocumentItem) => ReactNode;
}

export const SelectedItem = ({
	item,
	index,
	total,
	orderable,
	showExtensionBadge,
	showFileSize,
	showModifiedDate,
	labels,
	onRemove,
	onMoveUp,
	onMoveDown,
	render,
}: SelectedItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({
			id: item.key,
			disabled: !orderable,
		});

	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0 : 1,
	};

	const isMissing = item.missing === 'deleted';
	const missingLabel =
		labels.missing ?? __('This document is no longer available.', 'valu-block-components');

	const removeLabel = labels.remove
		? labels.remove
		: sprintf(
				/* translators: %s: document title */
				__('Remove %s', 'valu-block-components'),
				item.title,
			);
	const moveUpLabel = labels.moveUp
		? labels.moveUp
		: sprintf(
				/* translators: %s: document title */
				__('Move %s up', 'valu-block-components'),
				item.title,
			);
	const moveDownLabel = labels.moveDown
		? labels.moveDown
		: sprintf(
				/* translators: %s: document title */
				__('Move %s down', 'valu-block-components'),
				item.title,
			);

	const modified = showModifiedDate ? formatModified(item.modified) : '';

	return (
		<SelectedRow
			ref={setNodeRef}
			style={style}
			dragging={isDragging}
			missing={isMissing}
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
			{isMissing ? (
				<Icon icon={caution} size={20} />
			) : showExtensionBadge ? (
				<ExtensionBadge extension={item.extension} />
			) : null}
			{render ? (
				render(item)
			) : (
				<>
					<DocRowBody>
						<PrimaryText muted={isMissing} title={item.title}>
							{isMissing ? missingLabel : item.title}
						</PrimaryText>
						{!isMissing ? (
							<FilenameText title={item.filename}>{item.filename}</FilenameText>
						) : null}
					</DocRowBody>
					{!isMissing && (showFileSize || modified) ? (
						<DocMetaInline>
							{showFileSize && item.fileSize ? (
								<span>{formatFileSize(item.fileSize)}</span>
							) : null}
							{modified ? <span>{modified}</span> : null}
						</DocMetaInline>
					) : null}
				</>
			)}
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
