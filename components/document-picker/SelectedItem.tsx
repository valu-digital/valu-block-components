import {
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Icon, TextControl } from '@wordpress/components';
import { caution, chevronDown, chevronUp, closeSmall, dragHandle } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

import {
	ActionColumn,
	DocMetaInline,
	DocRowBody,
	DragHandleButton,
	FilenameText,
	LabelEditBody,
	ReorderButtons,
	SelectedRow,
	SelectedTitle,
} from './styles';
import { ExtensionBadge } from './badges/ExtensionBadge';
import { displayTitle, documentName, formatFileSize, formatModified } from './utils';
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
	/** Id of the remove button, so the list can move focus to it. */
	removeButtonId: string;
	onRemove: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	/** Show the editable per-item display-name field. */
	enableLabelEdit?: boolean;
	/** Called with the next label; an empty string clears the override. */
	onLabelChange?: (label: string) => void;
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
	removeButtonId,
	onRemove,
	onMoveUp,
	onMoveDown,
	enableLabelEdit = false,
	onLabelChange,
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
	const missingLabel =
		labels.missing ?? __('This document is no longer available.', 'valu-block-components');

	const displayName = displayTitle(item);
	const name = documentName(item);

	const removeLabel = labels.remove
		? labels.remove
		: sprintf(
				/* translators: %s: document title */
				__('Remove %s', 'valu-block-components'),
				name,
			);
	const moveUpLabel = labels.moveUp
		? labels.moveUp
		: sprintf(
				/* translators: %s: document title */
				__('Move %s up', 'valu-block-components'),
				name,
			);
	const moveDownLabel = labels.moveDown
		? labels.moveDown
		: sprintf(
				/* translators: %s: document title */
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

	const modified = showModifiedDate ? formatModified(item.modified) : '';

	// Label-edit mode: the display name is edited directly in place of the
	// title. `labelDraft` keeps the in-progress text while the field is
	// focused so clearing it doesn't immediately snap back to the title;
	// on blur the field settles on the effective display name again.
	// Commits are debounced so consumers persisting to block attributes
	// don't re-render the block on every keystroke; blur flushes.
	const isLabelEdit = enableLabelEdit && !isMissing && Boolean(onLabelChange);
	const [labelDraft, setLabelDraft] = useState<string | null>(null);
	const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (commitTimer.current) {
				clearTimeout(commitTimer.current);
			}
		},
		[],
	);

	// An empty field — or the original title typed back — clears the override.
	const normalizeLabel = (value: string): string => {
		const trimmed = value.trim();
		return trimmed === '' || trimmed === item.title ? '' : value;
	};
	const itemLabelText = labels.itemLabel ?? __('Display name', 'valu-block-components');
	const metaParts = [item.filename];
	if (showFileSize && item.fileSize) {
		metaParts.push(formatFileSize(item.fileSize));
	}
	if (modified) {
		metaParts.push(modified);
	}

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
			) : isLabelEdit ? (
				<LabelEditBody>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize={false}
						aria-label={sprintf(
							/* translators: 1: display-name field label, 2: filename */
							'%1$s: %2$s',
							itemLabelText,
							item.filename,
						)}
						value={labelDraft ?? item.label ?? item.title}
						onChange={(value) => {
							setLabelDraft(value);
							if (commitTimer.current) {
								clearTimeout(commitTimer.current);
							}
							commitTimer.current = setTimeout(() => {
								commitTimer.current = null;
								onLabelChange?.(normalizeLabel(value));
							}, 300);
						}}
						onBlur={() => {
							if (commitTimer.current) {
								clearTimeout(commitTimer.current);
								commitTimer.current = null;
								if (labelDraft !== null) {
									onLabelChange?.(normalizeLabel(labelDraft));
								}
							}
							setLabelDraft(null);
						}}
					/>
					<FilenameText title={item.filename}>{metaParts.join(' · ')}</FilenameText>
				</LabelEditBody>
			) : (
				<>
					<DocRowBody>
						<SelectedTitle muted={isMissing} title={displayName}>
							{isMissing ? missingLabel : displayName}
						</SelectedTitle>
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
					<ReorderButtons>
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
					</ReorderButtons>
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
