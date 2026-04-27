import type { ReactNode } from 'react';

/** Stable id for a row. */
export type RowId = string;

/** Stable id for a column. */
export type ColId = string;

/** Default cell control. Anything else uses `renderCell`. */
export type MatrixVariant = 'checkbox' | 'toggle';

/** A row in the matrix. The `id` must be unique and stable. */
export interface MatrixRow {
	id: RowId;
	/** Primary line in the row header. */
	label: ReactNode;
	/** Secondary line under the label (e.g. an email). */
	sublabel?: ReactNode;
	/** Visual to the left of the label (e.g. an avatar). */
	avatar?: ReactNode;
	/** Trailing chips/tags shown after the labels (roles, tags, …). */
	meta?: ReactNode;
}

/** A leaf column. */
export interface MatrixColumn {
	id: ColId;
	label: ReactNode;
	/** Tooltip / `aria-description` text. */
	description?: string;
}

/** A column group — collapsible by default. */
export interface MatrixColumnGroup {
	id: string;
	label: ReactNode;
	columns: MatrixColumn[];
	/** Whether the user can expand/collapse this group. @default true */
	collapsible?: boolean;
	/** Initial expanded state when uncontrolled. @default false */
	defaultExpanded?: boolean;
}

/**
 * Optional sticky "master" column that gates the row.
 *
 * The master cell uses the same value Set as every other cell — its presence
 * is checked at `${rowId}::${master.id}`. When `disablesRow` is true and the
 * master cell is unchecked, every leaf cell in that row renders disabled.
 */
export interface MatrixMasterColumn {
	id: ColId;
	label: ReactNode;
	/** Disable every leaf cell in the row when this cell is unchecked. @default true */
	disablesRow?: boolean;
	/**
	 * Fixed column width. Pin a number (px) or any CSS length (`'10rem'`,
	 * `'12ch'`, …). Default `96` works for short labels like "Agent" /
	 * "Enabled"; widen it for longer labels.
	 * @default 96
	 */
	width?: number | string;
}

/** Context passed to a custom cell renderer. */
export interface CellContext {
	row: MatrixRow;
	column: MatrixColumn;
	/** Is this cell currently selected (i.e. `${row.id}::${column.id}` is in `value`). */
	checked: boolean;
	/** Disabled because the master cell is off (only when `master.disablesRow`). */
	disabled: boolean;
	/** Toggle the cell. Calls the same `onChange` flow as the default control. */
	toggle: (checked: boolean) => void;
	/** Stable selection-set key for this cell (`row::col`). */
	selectionKey: string;
}

/** Context passed to a collapsed-group summary cell renderer. */
export interface GroupSummaryContext {
	row: MatrixRow;
	group: MatrixColumnGroup;
	/** How many of the group's columns are currently selected for this row. */
	selectedCount: number;
	/** Total leaf columns in the group. */
	totalCount: number;
}

/** Information about a single value change, paired with the next Set. */
export interface MatrixChange {
	rowId: RowId;
	colId: ColId;
	checked: boolean;
}

/** i18n bag — every key has a sensible English default. */
export interface MatrixLabels {
	expandGroup?: string;
	collapseGroup?: string;
	/** Format the collapsed-group summary, e.g. `2 / 5`. */
	groupSummary?: (selected: number, total: number) => string;
	/** Screen-reader-only announcement on cell change. */
	cellToggled?: (rowLabel: string, colLabel: string, checked: boolean) => string;
}

/** Props that don't depend on the columns/groups choice. */
interface MatrixBaseProps {
	/** Rows top-to-bottom. */
	rows: MatrixRow[];

	/** Optional sticky gate column. Same value Set as everything else. */
	master?: MatrixMasterColumn;

	/** Controlled selection. Each entry is `${rowId}::${colId}`. */
	value: ReadonlySet<string>;
	/** Called with the next Set and the specific change that caused it. */
	onChange: (next: ReadonlySet<string>, change: MatrixChange) => void;

	/** Controlled expanded-group state (group ids). */
	expanded?: ReadonlySet<string>;
	/** Uncontrolled initial expanded-group state. */
	defaultExpanded?: ReadonlySet<string>;
	/** Fires when the user expands or collapses a group. */
	onExpandedChange?: (next: ReadonlySet<string>) => void;

	/** Default control rendered in each leaf cell. @default 'checkbox' */
	variant?: MatrixVariant;

	/** Custom cell renderer (overrides `variant`). */
	renderCell?: (ctx: CellContext) => ReactNode;
	/** Custom row-header renderer. */
	renderRowHeader?: (row: MatrixRow) => ReactNode;
	/** Custom collapsed-group summary cell renderer. */
	renderGroupSummary?: (ctx: GroupSummaryContext) => ReactNode;
	/** Custom leaf-column header renderer. */
	renderHeader?: (column: MatrixColumn) => ReactNode;

	/** Stick the column headers to the top of the scroll viewport. @default true */
	stickyHeader?: boolean;
	/** Stick the row-header column to the left of the scroll viewport. @default true */
	stickyFirstColumn?: boolean;
	/**
	 * Fixed width of the row-header column. Pinning this keeps the column
	 * the same width regardless of how many leaf/summary cells are visible.
	 * @default 220
	 */
	rowHeaderWidth?: number | string;
	/** Caps the scroll viewport. @default 'calc(100vh - 260px)' */
	maxHeight?: number | string;

	/** `<caption>` text — required for accessibility unless `aria-label` is set. */
	caption?: string;
	/** i18n overrides. */
	labels?: MatrixLabels;
	/** Extra class on the root. */
	className?: string;
	/** Explicit id; used as ARIA prefix. */
	id?: string;
}

/**
 * Public props.
 *
 * Exactly one of `columns` (flat — single header row, no expand/collapse) or
 * `groups` (two header rows, collapsible) must be provided.
 *
 * @example flat
 * <Matrix rows={rows} columns={[{ id: 'a', label: 'A' }]} value={set} onChange={…} />
 *
 * @example grouped
 * <Matrix rows={rows} groups={[{ id: 'g', label: 'G', columns: […] }]} value={set} onChange={…} />
 */
export type MatrixProps = MatrixBaseProps &
	(
		| { columns: MatrixColumn[]; groups?: never }
		| { groups: MatrixColumnGroup[]; columns?: never }
	);
