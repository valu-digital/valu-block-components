import { useCallback, useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import {
	DocMetaInline,
	DocRowBody,
	FilenameText,
	Option,
	PrimaryText,
} from './styles';
import { ExtensionBadge } from './badges/ExtensionBadge';
import { formatFileSize, formatModified } from './utils';
import type { DocumentItem, SuggestionRenderState } from './types';

export interface SuggestionItemProps {
	item: DocumentItem;
	optionId: string;
	highlighted: boolean;
	selected: boolean;
	showExtensionBadge: boolean;
	showFileSize: boolean;
	showModifiedDate: boolean;
	onHover: () => void;
	onSelect: () => void;
	render?: (item: DocumentItem, state: SuggestionRenderState) => ReactNode;
}

export const SuggestionItem = ({
	item,
	optionId,
	highlighted,
	selected,
	showExtensionBadge,
	showFileSize,
	showModifiedDate,
	onHover,
	onSelect,
	render,
}: SuggestionItemProps) => {
	const ref = useRef<HTMLLIElement | null>(null);

	useEffect(() => {
		if (!highlighted || !ref.current) return;
		ref.current.scrollIntoView({ block: 'nearest' });
	}, [highlighted]);

	const handleClick = useCallback(
		(event: MouseEvent) => {
			event.preventDefault();
			onSelect();
		},
		[onSelect],
	);

	const handleMouseDown = useCallback((event: MouseEvent) => {
		event.preventDefault();
	}, []);

	if (render) {
		return (
			<Option
				ref={ref}
				role="option"
				id={optionId}
				aria-selected={selected}
				highlighted={highlighted}
				onMouseEnter={onHover}
				onMouseDown={handleMouseDown}
				onClick={handleClick}
			>
				{render(item, { highlighted, selected })}
			</Option>
		);
	}

	const modified = showModifiedDate ? formatModified(item.modified) : '';
	const hasMeta = Boolean((showFileSize && item.fileSize) || modified);

	return (
		<Option
			ref={ref}
			role="option"
			id={optionId}
			aria-selected={selected}
			highlighted={highlighted}
			onMouseEnter={onHover}
			onMouseDown={handleMouseDown}
			onClick={handleClick}
		>
			{showExtensionBadge ? <ExtensionBadge extension={item.extension} /> : null}
			<DocRowBody>
				<PrimaryText data-valu-title title={item.title}>
					{item.title}
				</PrimaryText>
				<FilenameText title={item.filename}>{item.filename}</FilenameText>
			</DocRowBody>
			{hasMeta ? (
				<DocMetaInline>
					{showFileSize && item.fileSize ? (
						<span>{formatFileSize(item.fileSize)}</span>
					) : null}
					{modified ? <span>{modified}</span> : null}
				</DocMetaInline>
			) : null}
		</Option>
	);
};
