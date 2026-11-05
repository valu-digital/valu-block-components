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
	/*
	 * Do NOT set \`min-width: max-content\` here. Combined with the
	 * trailing FillerCell's \`width: 100%\`, Chrome's auto table layout
	 * enters a feedback loop and blows the table up to ~1,000,000px,
	 * producing a phantom horizontal scrollbar even when all content
	 * fits. The per-cell min-widths (row header, master, leaf) already
	 * prevent content from squishing, so this rule is unnecessary.
	 */

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

	tbody tr[data-selected='true'] > * {
		background: ${t.selectedRowBg};
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

	&[data-locked='true'] {
		background: ${t.lockedBg};
		color: ${t.lockedFg};
	}
	&[data-selection='single'] {
		background: ${t.singleGroupBg};
	}
	&[data-group-start='true'] {
		box-shadow:
			inset 2px 0 0 ${t.accent},
			${t.shadowStickyTop};
	}

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

export const RowHeaderCell = styled.th<{ $leftSticky: boolean; $leftOffset?: string }>`
	min-width: 220px;
	max-width: 320px;
	${(p) =>
		p.$leftSticky &&
		css`
			position: sticky;
			left: ${p.$leftOffset ?? '0'};
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

/**
 * Leaf cell states. Everything keys off data attributes so a single
 * styled component covers every combination:
 *
 * - `data-diff`: inherited | added | removed
 * - `data-locked`: per-cell / column / group lock (aria-disabled control)
 * - `data-tone`: warning | danger
 * - `data-selection`: single (radio group tint)
 * - `data-group-start`: first column of a single-select group (accent rule)
 */
export const leafCellStateCss = css`
	position: relative;

	/*
	 * \`&&\` doubles the class so these beat the table's base/hover cell
	 * backgrounds and @wordpress/components' own checkbox rules, which tie
	 * on specificity and would otherwise win on source order (the Emotion
	 * cache is prepended).
	 */
	&&[data-selection='single'] {
		background: ${t.singleGroupBg};
	}
	&&[data-group-start='true'] {
		box-shadow: inset 2px 0 0 ${t.accent};
	}

	&&[data-diff='added'] {
		background: ${t.addedBg};
		box-shadow: inset 0 -2px 0 ${t.addedRule};
	}
	&&[data-diff='removed'] {
		background: ${t.removedBg};
		box-shadow: inset 0 -2px 0 ${t.removedRule};
	}

	/* Tone wins over the diff tint; the diff keeps its bottom rule and marker. */
	&&[data-tone='warning'] {
		background: ${t.warningBg};
	}
	&&[data-tone='danger'] {
		background: ${t.removedBg};
	}

	/* Inherited: pale checkbox so overrides stand out. */
	&&[data-diff='inherited'] .components-checkbox-control__input[type='checkbox']:checked {
		background: ${t.inheritedControlBg};
		border-color: ${t.accent};
	}
	&&[data-diff='inherited'] .components-checkbox-control__checked {
		fill: ${t.inheritedControlFg};
	}

	/* Removed: red outlined box with a slash. */
	&&[data-diff='removed'] .components-checkbox-control__input[type='checkbox'] {
		border-color: ${t.removedFg};
		background-color: #ffffff;
		background-image: linear-gradient(
			to top right,
			transparent calc(50% - 1px),
			${t.removedFg} calc(50% - 1px),
			${t.removedFg} calc(50% + 1px),
			transparent calc(50% + 1px)
		);
	}

	&&[data-locked='true'] {
		background: ${t.lockedBg};
	}
	&&[data-locked='true'] .components-checkbox-control__input[type='checkbox'],
	&&[data-locked='true'] input[type='radio'] {
		background: ${t.lockedControlBg};
		border-color: ${t.lockedControlBorder};
		cursor: not-allowed;
	}
	&&[data-locked='true'] .components-checkbox-control__checked {
		fill: ${t.lockedFg};
	}
	&&[data-locked='true'] input[type='radio']::before {
		background: ${t.lockedFg};
	}
	&&[data-locked='true'] .components-form-toggle {
		opacity: 0.45;
	}
`;

export const LeafCell = styled.td`
	min-width: 88px;
	text-align: center;

	&[data-disabled='true'] {
		opacity: 0.45;
	}

	${leafCellStateCss};
`;

export const SummaryCell = styled.td`
	min-width: 88px;
	text-align: center;
	color: ${t.gray600};
	font-variant-numeric: tabular-nums;

	&&[data-locked='true'] {
		background: ${t.lockedBg};
		color: ${t.lockedFg};
		font-size: ${t.fontSizeMeta};
		text-align: left;
	}
	&&[data-selection='single'] {
		background: ${t.singleGroupBg};
		box-shadow: inset 2px 0 0 ${t.accent};
	}
`;

/**
 * Trailing cell that absorbs leftover horizontal space so leaf/summary
 * cells stay at their content size (rather than auto-stretching). Borders
 * and hover-highlight match the rest of the row, so the row separator
 * still extends across the full table width.
 */
export const FillerCell = styled.td`
	width: 100%;
	padding: 0;
`;

/**
 * Header equivalent of `FillerCell`. Placed at the end of the header row.
 * Sticks to the top with the rest of the header so the empty trailing
 * space stays continuous with the bordered/shadowed header bar.
 */
export const FillerHeaderCell = styled.th<{ $sticky?: boolean }>`
	width: 100%;
	padding: 0;

	${(p) =>
		p.$sticky &&
		css`
			position: sticky;
			top: 0;
			z-index: ${t.zHeader};
			background: ${t.bg};
			box-shadow: ${t.shadowStickyTop};
		`};
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

/* ------------------------------------------------------------------ */
/* 0.8 extensions — cell state, baseline diff, single-select, rows.    */
/* ------------------------------------------------------------------ */

/** Small pill for tiers and similar labels (spec: 10px / 600, pill border). */
export const Badge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	padding: 1px 6px;
	border: 1px solid ${t.gray400};
	border-radius: 8px;
	background: #ffffff;
	color: ${t.gray700};
	font-size: ${t.fontSizeBadge};
	font-weight: ${t.fontWeightBold};
	line-height: 12px;
	text-transform: none;
	letter-spacing: normal;
	white-space: nowrap;
`;

/** Wraps header text + badge so the badge sits next to the label. */
export const HeaderLabelWrap = styled.span<{ $muted?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	${(p) =>
		p.$muted &&
		css`
			color: ${t.lockedFg};
		`};
`;

export const HeaderStack = styled.span`
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 3px;
`;

/** Lays out control + diff marker + badge + reset inside a leaf cell. */
export const CellInner = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
`;

export const DiffMarker = styled.span<{ $kind: 'added' | 'removed' }>`
	font-family: ${t.fontFamilyMono};
	font-size: 13px;
	font-weight: 700;
	line-height: 16px;
	color: ${(p) => (p.$kind === 'added' ? t.addedFg : t.removedFg)};
`;

export const ToneIcon = styled.span`
	display: inline-flex;
	color: ${t.warningIcon};
`;

/**
 * Per-cell reset button. Visible on cell hover / focus-within so the grid
 * stays quiet; always in the DOM so keyboard users can reach it.
 */
export const CellResetButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${t.resetButtonSize};
	height: ${t.resetButtonSize};
	padding: 0;
	border: 1px solid ${t.accent};
	border-radius: 3px;
	background: #ffffff;
	color: ${t.accent};
	cursor: pointer;
	opacity: 0;

	td:hover &,
	td:focus-within &,
	&:focus-visible {
		opacity: 1;
	}

	&:focus-visible {
		outline: 2px solid ${t.accent};
		outline-offset: 1px;
	}

	svg {
		fill: currentColor;
	}
`;

/** Native radio styled to match the 16px WP checkbox. */
export const Radio = styled.input`
	appearance: none;
	-webkit-appearance: none;
	display: inline-grid;
	place-content: center;
	width: ${t.cellControlSize};
	height: ${t.cellControlSize};
	margin: 0;
	border: 1.5px solid ${t.gray900};
	border-radius: 50%;
	background: #ffffff;
	cursor: pointer;

	&::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: ${t.accent};
		transform: scale(0);
		transition: transform ${t.transitionFast};
	}

	&:checked {
		border-color: ${t.accent};
	}
	&:checked::before {
		transform: scale(1);
	}

	&:focus-visible {
		outline: 2px solid ${t.accent};
		outline-offset: 2px;
	}

	&:disabled {
		cursor: not-allowed;
		background: ${t.lockedControlBg};
		border-color: ${t.lockedControlBorder};
	}
`;

export const SelectCell = styled.td<{ $leftSticky: boolean }>`
	width: ${t.selectColumnWidth};
	min-width: ${t.selectColumnWidth};
	text-align: center;
	${(p) =>
		p.$leftSticky &&
		css`
			position: sticky;
			left: 0;
			z-index: ${t.zRowHeader};
		`};
`;

/** Row-level status line under the row label. */
export const RowStatusLine = styled.div<{ $status: string }>`
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: ${t.fontSizeMeta};
	line-height: 16px;
	color: ${(p) =>
		p.$status === 'saved' ? t.successFg : p.$status === 'error' ? t.errorFg : t.gray600};

	&:empty {
		display: none;
	}

	svg {
		flex-shrink: 0;
		fill: currentColor;
	}
`;

export const LinkButton = styled.button`
	display: inline;
	padding: 0;
	border: 0;
	background: transparent;
	color: ${t.accent};
	font: inherit;
	font-size: ${t.fontSizeMeta};
	font-weight: ${t.fontWeightMedium};
	line-height: 16px;
	text-align: left;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid ${t.accent};
		outline-offset: 1px;
		border-radius: ${t.radiusSm};
	}
`;

export const RetryButton = styled(LinkButton)`
	text-decoration: underline;
	font-weight: ${t.fontWeightRegular};
`;

export const Spinner = styled.span`
	display: inline-block;
	width: 10px;
	height: 10px;
	border: 1.5px solid ${t.gray300};
	border-top-color: ${t.gray600};
	border-radius: 50%;
	animation: valu-mx-spin 0.8s linear infinite;

	@keyframes valu-mx-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

export const VisuallyHidden = styled.span`
	${visuallyHiddenCss};
`;
