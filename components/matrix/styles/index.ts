import styled from '@emotion/styled';
import { css } from '@emotion/react';

import { tokens as t } from './tokens';

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

/** Scroll viewport — owns sticky positioning's containing block. */
export const Viewport = styled.div<{ $maxHeight: string }>`
	position: relative;
	overflow: auto;
	max-height: ${(p) => p.$maxHeight};
	border: 1px solid ${t.gray300};
	border-radius: ${t.radiusMd};
	background: ${t.bg};
`;

export const Table = styled.table`
	border-collapse: separate;
	border-spacing: 0;
	width: 100%;
	min-width: max-content;

	caption {
		${visuallyHiddenCss};
	}

	th,
	td {
		text-align: left;
		padding: ${t.spaceSm} ${t.spaceMd};
		border-bottom: 1px solid ${t.gray200};
		font-weight: ${t.fontWeightRegular};
		vertical-align: middle;
		background: ${t.bg};
	}

	tbody tr:last-of-type th,
	tbody tr:last-of-type td {
		border-bottom: none;
	}

	tbody tr:hover th,
	tbody tr:hover td {
		background: ${t.bgMuted};
	}
`;

export const HeaderCell = styled.th<{
	$sticky?: boolean;
	$leftSticky?: boolean;
	$leftOffset?: string;
	$top?: string;
	$z?: number;
	$align?: 'left' | 'center';
}>`
	font-weight: ${t.fontWeightBold};
	font-size: ${t.fontSizeSmall};
	text-transform: uppercase;
	letter-spacing: 0.02em;
	color: ${t.gray900};
	white-space: nowrap;
	text-align: ${(p) => p.$align ?? 'left'};

	${(p) =>
		p.$sticky &&
		css`
			position: sticky;
			top: ${p.$top ?? '0'};
			z-index: ${p.$z ?? t.zHeader};
			box-shadow: ${t.shadowStickyTop};
		`};

	${(p) =>
		p.$leftSticky &&
		css`
			position: sticky;
			left: ${p.$leftOffset ?? '0'};
			z-index: ${(p.$z ?? t.zHeader) + 1};
			box-shadow: ${t.shadowStickyLeft}, ${t.shadowStickyTop};
		`};
`;

export const GroupHeaderButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: ${t.spaceXs};
	background: transparent;
	border: 1px solid transparent;
	border-radius: ${t.radiusSm};
	padding: 2px ${t.spaceXs};
	font: inherit;
	color: inherit;
	cursor: pointer;
	text-transform: inherit;
	letter-spacing: inherit;

	&:hover {
		background: ${t.accentHover};
	}

	&:focus-visible {
		outline: 2px solid ${t.accent};
		outline-offset: 1px;
	}

	&[disabled] {
		cursor: default;
		&:hover {
			background: transparent;
		}
	}
`;

export const Caret = styled.span<{ $open: boolean }>`
	display: inline-block;
	width: 0;
	height: 0;
	border-left: 4px solid transparent;
	border-right: 4px solid transparent;
	border-top: 5px solid currentColor;
	transition: transform ${t.transitionFast};
	transform: ${(p) => (p.$open ? 'rotate(0deg)' : 'rotate(-90deg)')};
`;

export const RowHeaderCell = styled.th<{ $leftSticky: boolean }>`
	min-width: 220px;
	max-width: 320px;
	${(p) =>
		p.$leftSticky &&
		css`
			position: sticky;
			left: 0;
			z-index: ${t.zRowHeader};
			box-shadow: ${t.shadowStickyLeft};
		`};
`;

export const RowHeaderInner = styled.div`
	display: flex;
	align-items: center;
	gap: ${t.spaceMd};
	min-height: ${t.rowMinHeight};
`;

export const RowHeaderText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`;

export const RowLabel = styled.div`
	font-weight: ${t.fontWeightMedium};
	color: ${t.gray900};
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const RowSublabel = styled.div`
	color: ${t.gray600};
	font-size: ${t.fontSizeSmall};
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const RowMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${t.spaceXs};
	margin-left: auto;
`;

export const MasterCell = styled.td<{ $leftSticky: boolean; $leftOffset: string }>`
	min-width: 96px;
	text-align: center;
	${(p) =>
		p.$leftSticky &&
		css`
			position: sticky;
			left: ${p.$leftOffset};
			z-index: ${t.zMaster};
			box-shadow: ${t.shadowStickyLeft};
		`};
`;

export const LeafCell = styled.td`
	min-width: 88px;
	text-align: center;

	&[data-disabled='true'] {
		opacity: 0.45;
	}
`;

export const SummaryCell = styled.td`
	min-width: 88px;
	text-align: center;
	color: ${t.gray600};
	font-variant-numeric: tabular-nums;
`;

export const CellControlWrap = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;

	/* Trim @wordpress/components default vertical margins inside table cells. */
	.components-checkbox-control,
	.components-toggle-control,
	.components-base-control,
	.components-base-control__field {
		margin: 0;
	}

	.components-checkbox-control__input-container {
		margin: 0;
	}
`;

export const Caption = styled.caption`
	${visuallyHiddenCss};
`;
