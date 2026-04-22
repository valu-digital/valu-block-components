import styled from '@emotion/styled';
import { css } from '@emotion/react';

import { tokens as t } from './tokens';

export const focusRing = css`
	outline: 2px solid ${t.accent};
	outline-offset: 1px;
`;

export const visuallyHiddenCss = css`
	position: absolute !important;
	clip: rect(1px, 1px, 1px, 1px);
	width: 1px;
	height: 1px;
	overflow: hidden;
	white-space: nowrap;
`;

export const Root = styled.div`
	color: ${t.fg};
	font-size: ${t.fontSizeBody};

	* {
		box-sizing: border-box;
	}
`;

export const Label = styled.label`
	display: block;
	margin-bottom: ${t.spaceXs};
	font-weight: ${t.fontWeightMedium};
	font-size: ${t.fontSizeSmall};
	text-transform: uppercase;
	letter-spacing: 0.02em;
	color: ${t.gray900};
`;

export const HelpText = styled.p`
	margin: ${t.spaceXs} 0 0;
	color: ${t.gray600};
	font-size: ${t.fontSizeSmall};
`;

export const InputShell = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	gap: ${t.spaceSm};
	background: ${t.bg};
	border: 1px solid ${t.gray300};
	border-radius: ${t.radiusMd};
	padding: 6px ${t.spaceMd};
	min-height: 40px;
	transition: border-color ${t.transitionFast}, box-shadow ${t.transitionFast};

	&:focus-within {
		border-color: ${t.accent};
		box-shadow: 0 0 0 1px ${t.accent};
	}
`;

export const Input = styled.input`
	flex: 1;
	background: transparent;
	font: inherit;
	color: ${t.fg};
	min-width: 0;

	/*
	 * WP admin's global input styles (\`input[type="text"]\` in various
	 * editor/sidebar stylesheets) set their own border + box-shadow at a
	 * higher specificity than our Emotion class. \`!important\` is the
	 * pragmatic reset here — we provide the focus chrome on the enclosing
	 * \`InputShell\`, so every input-level border/outline/box-shadow
	 * contribution is noise.
	 */
	&,
	&:focus,
	&:focus-visible,
	&:hover {
		border: 0 !important;
		outline: 0 !important;
		box-shadow: none !important;
	}

	&::placeholder {
		color: ${t.gray600};
	}
`;

export const SuggestionsShell = styled.div<{ inline?: boolean }>`
	background: ${t.bg};
	border: 1px solid ${t.gray300};
	border-radius: ${t.radiusMd};
	overflow: hidden;
	max-height: 380px;
	display: flex;
	flex-direction: column;

	${({ inline }) =>
		inline
			? css`
					margin-top: ${t.spaceSm};
				`
			: css`
					box-shadow: ${t.shadowPopover};
				`}
`;

export const ListboxScroll = styled.div`
	overflow-y: auto;
	flex: 1;
	min-height: 0;
`;

export const StickyHeader = styled.div`
	position: sticky;
	top: 0;
	z-index: 2;
	background: ${t.bg};
`;

export const Listbox = styled.ul`
	list-style: none;
	margin: 0;
	padding: ${t.spaceXs} 0;
`;

export const GroupHeading = styled.div`
	padding: 4px ${t.spaceMd};
	font-size: 10px !important;
	font-weight: ${t.fontWeightBold};
	letter-spacing: 0.08em;
	text-transform: uppercase !important;
	color: ${t.gray600};
	background: ${t.gray100};
	line-height: 1.8;

	[role='group']:not(:first-child) > & {
		border-top: 1px solid ${t.gray200};
	}
`;

export const PrimaryText = styled.span<{ muted?: boolean }>`
	font-size: ${t.fontSizeBody};
	font-weight: ${t.fontWeightMedium};
	color: ${({ muted }) => (muted ? t.gray600 : t.gray900)};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	line-height: 1.3;
	transition: color ${t.transitionFast};
`;

export const Option = styled.li<{ highlighted?: boolean; disabled?: boolean }>`
	display: flex;
	align-items: center;
	gap: ${t.spaceSm};
	padding: 4px ${t.spaceMd};
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
	opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
	min-height: ${t.suggestionMinHeight};
	background: ${({ highlighted }) => (highlighted ? t.accentActive : 'transparent')};
	position: relative;
	transition: background ${t.transitionFast};

	&:hover {
		background: ${({ highlighted, disabled }) =>
			disabled ? 'transparent' : highlighted ? t.accentActive : t.accentHover};
	}

	/*
	 * Target the title via a stable data attribute rather than Emotion's
	 * generated class — the popover body has its own Emotion cache, so
	 * class-name interpolation isn't guaranteed to match across caches.
	 */
	&:hover [data-valu-title] {
		color: ${t.accent};
	}

	${({ highlighted }) =>
		highlighted &&
		css`
			[data-valu-title] {
				color: ${t.accent};
			}
			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 4px;
				bottom: 4px;
				width: 2px;
				border-radius: 0 ${t.radiusSm} ${t.radiusSm} 0;
				background: ${t.accent};
			}
		`}
`;

export const Thumb = styled.div<{
	size?: 'xs' | 'sm' | 'md' | 'lg';
	missing?: boolean;
	hasImage?: boolean;
	avatar?: boolean;
}>`
	flex: 0 0 auto;
	width: ${({ size, hasImage, avatar }) =>
		avatar
			? '22px'
			: hasImage
				? t.thumbMd
				: size === 'md'
					? t.thumbMd
					: size === 'lg'
						? t.thumbLg
						: size === 'sm'
							? t.thumbSm
							: '22px'};
	height: ${({ size, hasImage, avatar }) =>
		avatar
			? '22px'
			: hasImage
				? t.thumbMd
				: size === 'md'
					? t.thumbMd
					: size === 'lg'
						? t.thumbLg
						: size === 'sm'
							? t.thumbSm
							: '22px'};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ missing }) => (missing ? t.danger : t.gray600)};

	${({ hasImage, avatar }) =>
		avatar
			? css`
					border-radius: 999px;
					overflow: hidden;
				`
			: hasImage
				? css`
						border: 1px solid ${t.gray200};
						border-radius: ${t.radiusSm};
						overflow: hidden;
						background: ${t.gray100};
					`
				: undefined}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	svg {
		width: 22px;
		height: 22px;
	}
`;

export const ItemBody = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0;
`;

export const SecondaryText = styled.span`
	font-size: ${t.fontSizeSmall};
	color: ${t.gray600};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	line-height: 1.3;
`;

export const BadgeRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${t.spaceXs};
	flex-wrap: wrap;
	margin-top: 0;
`;

export const TypeHint = styled.span`
	flex: 0 0 auto;
	font-size: ${t.fontSizeSmall};
	color: ${t.gray600};
	margin-left: ${t.spaceSm};
	white-space: nowrap;
`;

export const ActionColumn = styled.div`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	gap: ${t.spaceXs};
	margin-left: auto;
`;

export const SelectedListEl = styled.ul`
	list-style: none;
	margin: ${t.spaceSm} 0 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

export const SelectedRow = styled.li<{ dragging?: boolean; missing?: boolean }>`
	display: flex;
	align-items: center;
	gap: ${t.spaceSm};
	padding: 2px ${t.spaceSm};
	background: ${({ missing }) => (missing ? t.dangerSoft : t.bg)};
	border: 1px solid ${({ missing }) => (missing ? t.dangerLine : t.gray300)};
	border-radius: ${t.radiusMd};
	min-height: ${t.rowMinHeight};
	box-shadow: ${({ dragging }) => (dragging ? t.shadowPopover : 'none')};
	transition: box-shadow ${t.transitionFast}, border-color ${t.transitionFast};

	&:hover {
		border-color: ${({ missing }) => (missing ? t.dangerLine : t.gray600)};
	}
`;

export const DragHandleButton = styled.button`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: 0;
	background: transparent;
	color: ${t.gray600};
	cursor: grab;
	border-radius: ${t.radiusSm};
	padding: 0;

	&:hover {
		background: ${t.gray100};
		color: ${t.gray900};
	}

	&:focus-visible {
		${focusRing}
	}

	&:active {
		cursor: grabbing;
	}

	&[disabled] {
		cursor: not-allowed;
		opacity: 0.4;
	}

	svg {
		width: 14px;
		height: 14px;
	}
`;

export const EmptyState = styled.div`
	padding: ${t.spaceLg} ${t.spaceMd};
	text-align: center;
	color: ${t.gray600};
	font-size: ${t.fontSizeBody};
`;

export const LoadingState = styled.div`
	padding: ${t.spaceLg} ${t.spaceMd};
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${t.spaceSm};
	color: ${t.gray600};
	font-size: ${t.fontSizeBody};
`;

export const ErrorState = styled.div`
	padding: ${t.spaceMd};
	background: ${t.dangerSoft};
	color: ${t.danger};
	border: 1px solid ${t.dangerLine};
	border-radius: ${t.radiusMd};
	font-size: ${t.fontSizeBody};
`;

export const MaxedOutBanner = styled.div`
	display: flex;
	align-items: center;
	gap: ${t.spaceSm};
	padding: ${t.spaceSm} ${t.spaceMd};
	background: ${t.gray100};
	color: ${t.gray900};
	border: 1px dashed ${t.gray300};
	border-radius: ${t.radiusMd};
	font-size: ${t.fontSizeSmall};
`;

export const CountPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	background: ${t.gray100};
	color: ${t.gray900};
	border-radius: 999px;
	font-size: 10px;
	font-weight: ${t.fontWeightBold};
	letter-spacing: 0.04em;
`;

export const ChipWrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: ${t.spaceSm};
	background: ${t.gray900};
	color: #fff;
	border-radius: ${t.radiusMd};
	padding: 6px ${t.spaceMd};
	max-width: 280px;
	box-shadow: ${t.shadowPopover};
`;

export const ChipTitle = styled.span`
	font-size: ${t.fontSizeSmall};
	font-weight: ${t.fontWeightMedium};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const LoadMoreRow = styled.li`
	list-style: none;
	display: flex;
	justify-content: center;
	padding: ${t.spaceSm};
`;

export const SearchIconWrap = styled.span`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	color: ${t.gray600};
`;

export const HeaderRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${t.spaceSm};
	margin-top: ${t.spaceSm};
	margin-bottom: ${t.spaceXs};
`;

export const HeaderTitle = styled.h3`
	margin: 0;
	font-size: 10px !important;
	text-transform: uppercase !important;
	letter-spacing: 0.04em;
	font-weight: ${t.fontWeightBold};
	color: ${t.gray600};
	line-height: 1.8;
`;
