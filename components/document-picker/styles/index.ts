import styled from '@emotion/styled';
import { css } from '@emotion/react';

import { tokens as t } from '../../content-picker/styles/tokens';

export { tokens } from '../../content-picker/styles/tokens';

// Reuse the generic primitives from content-picker so visual language stays
// in sync. Anything specific to the document picker is defined below.
export {
	ActionColumn,
	ChipTitle,
	ChipWrap,
	CountPill,
	DragHandleButton,
	EmptyState,
	ErrorState,
	HeaderRow,
	HeaderTitle,
	Input,
	InputShell,
	ItemBody,
	Listbox,
	ListboxScroll,
	LoadMoreRow,
	LoadingState,
	MaxedOutBanner,
	PrimaryText,
	SearchIconWrap,
	SecondaryText,
	SelectedListEl,
	StickyHeader,
	SuggestionsShell,
} from '../../content-picker/styles';

// `SelectedRow` is forked from content-picker so we can attach a container
// query: rows reflow inline (title + filename + meta on one line) when the
// row is wide enough, and stack (title above filename, meta hidden) when
// rendered in a narrow context like the inspector sidebar.
export const SelectedRow = styled.li<{ dragging?: boolean; missing?: boolean }>`
	container-type: inline-size;
	container-name: valu-dp-row;
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

// Wide-row breakpoint. Below this width, rows fall back to the stacked
// narrow layout (title above filename, meta hidden).
const WIDE_ROW = '380px';

// `Option` (suggestion row) is forked from content-picker so it also acts
// as a container for the same `valu-dp-row` query — suggestion rows and
// selected rows share one responsive layout.
export const Option = styled.li<{ highlighted?: boolean; disabled?: boolean }>`
	container-type: inline-size;
	container-name: valu-dp-row;
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

/** Body of a selected row — stacks narrow, lays out inline when wide. */
export const DocRowBody = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0;

	@container valu-dp-row (min-width: ${WIDE_ROW}) {
		flex-direction: row;
		align-items: baseline;
		gap: ${t.spaceMd};
	}
`;

/**
 * Filename text — block element under the title when narrow,
 * inline next to it when wide.
 */
export const FilenameText = styled.span`
	font-size: ${t.fontSizeSmall};
	color: ${t.gray600};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	line-height: 1.3;
	min-width: 0;

	@container valu-dp-row (min-width: ${WIDE_ROW}) {
		flex: 1;
	}
`;

/**
 * Inline meta (size, date) — hidden in the narrow layout, visible and
 * right-aligned in the wide one.
 */
export const DocMetaInline = styled.div`
	display: none;

	@container valu-dp-row (min-width: ${WIDE_ROW}) {
		display: inline-flex;
		align-items: center;
		gap: ${t.spaceSm};
		flex: 0 0 auto;
		color: ${t.gray600};
		font-size: ${t.fontSizeSmall};
		white-space: nowrap;
	}
`;

/**
 * Move up/down buttons — redundant with the drag handle (which also supports
 * keyboard reordering), so they are hidden in narrow containers like the
 * inspector sidebar where every pixel of row width matters.
 */
export const ReorderButtons = styled.span`
	display: none;

	@container valu-dp-row (min-width: 340px) {
		display: inline-flex;
	}
`;

/**
 * Body of a selected row in label-edit mode (`enableItemLabels`): the display
 * name is edited directly in place of the title, with the filename (and meta)
 * as one muted line underneath. Always stacked — the input needs the full
 * row width in narrow containers like the inspector sidebar.
 */
export const LabelEditBody = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 4px 0;

	.components-base-control,
	.components-text-control__input {
		width: 100%;
		min-width: 0;
	}

	/* __nextHasNoMarginBottom is not honored by every bundled
	   wp-components version — enforce the no-margin layout here. */
	.components-base-control.components-base-control {
		margin-bottom: 0;
	}

	/* Doubled class beats wp-components' own input rules regardless of
	   stylesheet order (the emotion cache may be prepended). */
	.components-text-control__input.components-text-control__input {
		font-size: ${t.fontSizeBody};
		height: 28px;
		min-height: 28px;
		padding: 2px 8px;
	}

	@container valu-dp-row (min-width: ${WIDE_ROW}) {
		flex-direction: row;
		align-items: center;
		gap: ${t.spaceMd};

		.components-base-control {
			flex: 0 1 340px;
			min-width: 180px;
			width: auto;
		}
	}
`;

export const Root = styled.div`
	color: ${t.fg};
	font-size: ${t.fontSizeBody};

	* {
		box-sizing: border-box;
	}
`;

export const ActionsRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${t.spaceSm};
	margin-top: ${t.spaceSm};
`;

export const FileMeta = styled.span`
	font-size: ${t.fontSizeSmall};
	color: ${t.gray600};
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: ${t.spaceXs};

	&::before {
		content: '·';
		opacity: 0.6;
	}

	&:first-of-type::before {
		content: '';
	}
`;

export const MetaRow = styled.div`
	display: flex;
	align-items: center;
	gap: ${t.spaceSm};
	flex-wrap: wrap;
	min-width: 0;
	color: ${t.gray600};
`;

// Extension badge — a uppercase pill in the leading slot. Tone shifts by
// extension so a row of mixed files is scannable at a glance.
export const ExtensionPill = styled.span<{ tone?: 'red' | 'blue' | 'green' | 'orange' | 'gray' }>`
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 38px;
	padding: 2px 6px;
	font-size: 10px;
	font-weight: ${t.fontWeightBold};
	letter-spacing: 0.04em;
	text-transform: uppercase;
	border-radius: ${t.radiusSm};
	border: 1px solid currentColor;
	line-height: 1.4;
	white-space: nowrap;

	${({ tone = 'gray' }) => {
		switch (tone) {
			case 'red':
				return css`
					color: #c0392b;
					background: #fdecea;
				`;
			case 'blue':
				return css`
					color: #1a4fb8;
					background: #e8efff;
				`;
			case 'green':
				return css`
					color: #1f6b3a;
					background: #e6f4ea;
				`;
			case 'orange':
				return css`
					color: #b15a06;
					background: #fff1de;
				`;
			default:
				return css`
					color: ${t.gray900};
					background: ${t.gray100};
				`;
		}
	}}
`;
