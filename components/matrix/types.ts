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

/** Visual emphasis for a cell. */
export type MatrixCellTone = 'default' | 'warning' | 'danger';

/** Selection mode of a column group. */
export type MatrixSelectionMode = 'multiple' | 'single';

/**
 * Per-cell state returned by `getCellState`.
 *
 * - `disabled` cells render with `aria-disabled="true"` and cannot be
 *   toggled. They stay focusable so the reason can be read.
 * - `reason` becomes the cell's accessible description (and its tooltip).
 * - `badge` renders next to the control (e.g. a tier chip).
 * - `tone` tints the cell background.
 */
export interface MatrixCellState {
	disabled?: boolean;
	reason?: string;
	badge?: ReactNode;
	tone?: MatrixCellTone;
}

/**
 * Cell state relative to `baseline`.
 *
 * - `inherited` — selected in both `value` and `baseline`.
 * - `added` — selected in `value`, not in `baseline` (an override).
 * - `removed` — selected in `baseline`, not in `value` (an override).
 * - `none` — selected in neither.
 */
export type MatrixDiffState = 'inherited' | 'added' | 'removed' | 'none';

/** Save state of a row, shown under the row label. */
export type MatrixRowStatusKind = 'idle' | 'saving' | 'saved' | 'error';

export interface MatrixRowStatus {
	status: MatrixRowStatusKind;
	/** Overrides the default status text (e.g. a specific error). */
	message?: string;
	/** Shows a retry button next to an `error` status. */
	onRetry?: () => void;
}

/** A leaf column. */
export interface MatrixColumn {
	id: ColId;
	label: ReactNode;
	/**
	 * Tooltip / `aria-description` text. On a `disabled` column it is also
	 * the reason announced for every cell in the column.
	 */
	description?: string;
	/** Lock the column: every cell renders disabled with `description` as the reason. */
	disabled?: boolean;
	/** Chip rendered in the header (e.g. the tier that unlocks the column). */
	badge?: ReactNode;
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
	/**
	 * Lock the group: every cell in it renders disabled with `description`
	 * as the reason, the header is muted and shows `badge`, and the
	 * collapsed summary shows `description` instead of the count.
	 */
	disabled?: boolean;
	/** Chip rendered in the group header (e.g. the tier that unlocks it). */
	badge?: ReactNode;
	/** Reason / help text for the group. Used as the lock reason. */
	description?: string;
	/**
	 * `'single'` renders radios: selecting one column deselects the others
	 * in this group for that row. @default 'multiple'
	 */
	selection?: MatrixSelectionMode;
	/**
	 * Single-select only: prepend a "none" radio that clears the group for
	 * the row. Its column id is `noneColumnId(group.id)`; it is never
	 * stored in `value`.
	 */
	allowNone?: boolean;
	/** Label for the "none" column. Defaults to `labels.noneOption`. */
	noneLabel?: ReactNode;
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
	/**
	 * Disabled because the master cell is off (only when `master.disablesRow`),
	 * or locked by `getCellState` / a locked column or group.
	 */
	disabled: boolean;
	/** Resolved per-cell state (merged from `getCellState` and column/group locks). */
	state?: MatrixCellState;
	/** Diff against `baseline`; `'none'` when no `baseline` is given. */
	diff: MatrixDiffState;
	/** The column's group (the synthetic flat group when `columns` is used). */
	group: MatrixColumnGroup;
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
	/** The changed column. `ALL_COLUMNS` (`'*'`) for a whole-row reset. */
	colId: ColId;
	checked: boolean;
	/** True when the change restores `baseline` (per-cell or per-row reset). */
	reset?: boolean;
	/** Single-select groups: columns deselected by this change. */
	deselected?: ColId[];
}

/** i18n bag — every key has a sensible English default. */
export interface MatrixLabels {
	expandGroup?: string;
	collapseGroup?: string;
	/** Format the collapsed-group summary, e.g. `2 / 5`. */
	groupSummary?: (selected: number, total: number) => string;
	/** Screen-reader-only announcement on cell change. */
	cellToggled?: (rowLabel: string, colLabel: string, checked: boolean) => string;
	/** Accessible description of an `inherited` cell. */
	diffInherited?: string;
	/** Accessible description of an `added` cell. */
	diffAdded?: string;
	/** Accessible description of a `removed` cell. */
	diffRemoved?: string;
	/** Accessible name of the per-cell reset button. */
	resetCell?: (rowLabel: string, colLabel: string) => string;
	/** Visible text of the per-row reset button. */
	resetRow?: string;
	/** Accessible name of the per-row reset button. */
	resetRowLabel?: (rowLabel: string) => string;
	/** Label of the "none" column in single-select groups. */
	noneOption?: string;
	/** Row status texts. */
	statusSaving?: string;
	statusSaved?: string;
	statusError?: string;
	/** Retry button text on an `error` row status. */
	retry?: string;
	/** Accessible name of a row's select checkbox. */
	selectRow?: (rowLabel: string) => string;
	/** Accessible name of the header select-all checkbox. */
	selectAllRows?: string;
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

	/**
	 * Per-cell state: lock a cell, explain why, tint it, or add a badge.
	 * Called for every visible leaf cell on every render — keep it cheap.
	 */
	getCellState?: (rowId: RowId, colId: ColId) => MatrixCellState | undefined;

	/**
	 * Reference selection (e.g. what a profile grants). When set, every
	 * cell shows its diff state and override cells get a reset button.
	 */
	baseline?: ReadonlySet<string>;
	/**
	 * Show a "reset row" action under the row label when the row differs
	 * from `baseline`. When provided it is called with the row id and the
	 * computed next Set; otherwise the reset goes through `onChange` with
	 * `{ colId: ALL_COLUMNS, reset: true }`.
	 */
	onResetRow?: (rowId: RowId, next: ReadonlySet<string>) => void;
	/** Show the row reset action even without `onResetRow`. @default !!onResetRow */
	showRowReset?: boolean;

	/** Per-row save status rendered under the row label (with an aria-live region). */
	getRowStatus?: (rowId: RowId) => MatrixRowStatus | undefined;

	/** Prepend a sticky select column with a tri-state select-all header. */
	selectableRows?: boolean;
	/** Controlled row selection. */
	selectedRows?: ReadonlySet<RowId>;
	/** Fires with the next selected-row Set. */
	onSelectedRowsChange?: (next: ReadonlySet<RowId>) => void;

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
