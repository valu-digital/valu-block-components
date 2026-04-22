import { useCallback, useEffect, useRef, type MouseEvent } from 'react';
import { Icon } from '@wordpress/components';

import {
	ItemBody,
	Option,
	PrimaryText,
	SecondaryText,
	Thumb,
	TypeHint,
} from './styles';
import { StatusBadge } from './badges/StatusBadge';
import { humanizeType, resolveItemIcon, toDisplayUrl } from './utils';
import type {
	ContentItem,
	ContentPickerIconMap,
	SuggestionRenderState,
} from './types';

export interface SuggestionItemProps {
	item: ContentItem;
	optionId: string;
	highlighted: boolean;
	selected: boolean;
	showTypeHint: boolean;
	showUrl: boolean;
	icons?: ContentPickerIconMap;
	onHover: () => void;
	onSelect: () => void;
	render?: (item: ContentItem, state: SuggestionRenderState) => React.ReactNode;
}

export const SuggestionItem = ({
	item,
	optionId,
	highlighted,
	selected,
	showTypeHint,
	showUrl,
	icons,
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
		// Keep focus on the input; don't let a mousedown on the option steal it.
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

	const displayUrl = toDisplayUrl(item.url);
	const hasAbnormalStatus = item.status && item.status !== 'publish';
	const icon = resolveItemIcon(item, icons);
	const isAvatar = item.kind === 'user' && Boolean(item.thumbnailUrl);
	const hasVisual = Boolean(item.thumbnailUrl) || Boolean(icon);

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
			{hasVisual ? (
				<Thumb
					hasImage={Boolean(item.thumbnailUrl) && !isAvatar}
					avatar={isAvatar}
				>
					{item.thumbnailUrl ? (
						<img src={item.thumbnailUrl} alt="" loading="lazy" />
					) : icon ? (
						<Icon icon={icon} size={22} />
					) : null}
				</Thumb>
			) : null}
			<ItemBody>
				<PrimaryText data-valu-title>{item.title}</PrimaryText>
				{showUrl && displayUrl ? <SecondaryText>{displayUrl}</SecondaryText> : null}
			</ItemBody>
			{hasAbnormalStatus ? <StatusBadge status={item.status!} /> : null}
			{showTypeHint ? (
				<TypeHint>{humanizeType(item.type, item.kind)}</TypeHint>
			) : null}
		</Option>
	);
};
