import type {
	ColId,
	MatrixCellState,
	MatrixColumn,
	MatrixColumnGroup,
	MatrixDiffState,
	MatrixLabels,
	RowId,
} from './types';

/** `MatrixChange.colId` of a whole-row reset. */
export const ALL_COLUMNS = '*';

/** Column id of the synthetic "none" radio in a single-select group. */
export const noneColumnId = (groupId: string): ColId => `__none__:${groupId}`;

/** Selection-set key for a single cell. */
export const cellKey = (rowId: RowId, colId: ColId): string => `${rowId}::${colId}`;

/**
 * Returns the column ids selected for a single row.
 *
 * @example
 * selectionByRow(value, 'user-42')  // ['create', 'edit']
 */
export const selectionByRow = (value: ReadonlySet<string>, rowId: RowId): ColId[] => {
	const prefix = `${rowId}::`;
	const out: ColId[] = [];
	for (const key of value) {
		if (key.startsWith(prefix)) out.push(key.slice(prefix.length));
	}
	return out;
};

/** Toggle a single cell, returning the next Set (always a new instance). */
export const toggleCell = (
	value: ReadonlySet<string>,
	rowId: RowId,
	colId: ColId,
	checked: boolean,
): Set<string> => {
	const next = new Set(value);
	if (checked) next.add(cellKey(rowId, colId));
	else next.delete(cellKey(rowId, colId));
	return next;
};

/**
 * Diff state of one cell against a baseline selection.
 *
 * @example
 * diffState(value, baseline, 'user-42', 'edit')  // 'added'
 */
export const diffState = (
	value: ReadonlySet<string>,
	baseline: ReadonlySet<string> | undefined,
	rowId: RowId,
	colId: ColId,
): MatrixDiffState => {
	if (!baseline) return 'none';
	const key = cellKey(rowId, colId);
	const inValue = value.has(key);
	const inBaseline = baseline.has(key);
	if (inValue && inBaseline) return 'inherited';
	if (inValue) return 'added';
	if (inBaseline) return 'removed';
	return 'none';
};

/** True for `added` / `removed` — cells that differ from the baseline. */
export const isOverride = (diff: MatrixDiffState): boolean =>
	diff === 'added' || diff === 'removed';

/**
 * Restore the given columns of one row to the baseline, returning the next
 * Set (always a new instance).
 */
export const resetRowToBaseline = (
	value: ReadonlySet<string>,
	baseline: ReadonlySet<string>,
	rowId: RowId,
	colIds: Iterable<ColId>,
): Set<string> => {
	const next = new Set(value);
	for (const colId of colIds) {
		const key = cellKey(rowId, colId);
		if (baseline.has(key)) next.add(key);
		else next.delete(key);
	}
	return next;
};

/**
 * Select one column of a single-select group for a row, deselecting the
 * group's other columns. Pass `null` to clear the group for the row.
 */
export const selectSingle = (
	value: ReadonlySet<string>,
	rowId: RowId,
	groupColIds: readonly ColId[],
	colId: ColId | null,
): { next: Set<string>; deselected: ColId[] } => {
	const next = new Set(value);
	const deselected: ColId[] = [];
	for (const id of groupColIds) {
		if (id === colId) continue;
		const key = cellKey(rowId, id);
		if (next.delete(key)) deselected.push(id);
	}
	if (colId !== null) next.add(cellKey(rowId, colId));
	return { next, deselected };
};

/**
 * Leaf columns a group renders when expanded. Single-select groups with
 * `allowNone` get a synthetic leading "none" column.
 */
export const visibleColumnsOf = (group: MatrixColumnGroup, noneLabel: string): MatrixColumn[] => {
	if (group.selection !== 'single' || !group.allowNone) return group.columns;
	return [
		{
			id: noneColumnId(group.id),
			label: group.noneLabel ?? noneLabel,
			disabled: group.disabled,
			description: group.description,
		},
		...group.columns,
	];
};

/**
 * Merge group / column locks with the consumer's per-cell state. A lock
 * anywhere wins; the most specific reason wins.
 */
export const mergeCellState = (
	group: MatrixColumnGroup,
	column: MatrixColumn,
	custom: MatrixCellState | undefined,
): MatrixCellState | undefined => {
	const groupLocked = !!group.disabled;
	const columnLocked = !!column.disabled;
	if (!groupLocked && !columnLocked) return custom;
	return {
		...custom,
		disabled: true,
		reason:
			custom?.reason ??
			(columnLocked ? column.description : undefined) ??
			(groupLocked ? group.description : undefined),
	};
};

/**
 * Normalize the public `columns | groups` choice into a single internal
 * shape. A flat `columns` list becomes one synthetic, non-collapsible group.
 */
export const normalizeGroups = (input: {
	columns?: MatrixColumn[];
	groups?: MatrixColumnGroup[];
}): { groups: MatrixColumnGroup[]; flat: boolean } => {
	if (input.groups) return { groups: input.groups, flat: false };
	return {
		groups: [
			{
				id: '__flat__',
				label: '',
				columns: input.columns ?? [],
				collapsible: false,
				defaultExpanded: true,
			},
		],
		flat: true,
	};
};

/**
 * Default labels — used when a key isn't supplied by the consumer. English
 * only; consumers using `@wordpress/i18n` should pass translated strings.
 */
export const defaultLabels = (overrides: MatrixLabels = {}): Required<MatrixLabels> => ({
	expandGroup: overrides.expandGroup ?? 'Expand group',
	collapseGroup: overrides.collapseGroup ?? 'Collapse group',
	groupSummary: overrides.groupSummary ?? ((selected, total) => `${selected} / ${total}`),
	cellToggled:
		overrides.cellToggled ??
		((rowLabel, colLabel, checked) =>
			checked ? `${colLabel} added to ${rowLabel}` : `${colLabel} removed from ${rowLabel}`),
	diffInherited: overrides.diffInherited ?? 'Inherited from baseline',
	diffAdded: overrides.diffAdded ?? 'Added — not in baseline',
	diffRemoved: overrides.diffRemoved ?? 'Removed — in baseline',
	resetCell:
		overrides.resetCell ??
		((rowLabel, colLabel) => `Reset ${colLabel} for ${rowLabel} to baseline`),
	resetRow: overrides.resetRow ?? 'Reset to baseline',
	resetRowLabel: overrides.resetRowLabel ?? ((rowLabel) => `Reset ${rowLabel} to baseline`),
	noneOption: overrides.noneOption ?? 'None',
	statusSaving: overrides.statusSaving ?? 'Saving…',
	statusSaved: overrides.statusSaved ?? 'Saved',
	statusError: overrides.statusError ?? 'Not saved',
	retry: overrides.retry ?? 'Retry',
	selectRow: overrides.selectRow ?? ((rowLabel) => `Select ${rowLabel}`),
	selectAllRows: overrides.selectAllRows ?? 'Select all rows',
});

/** Stringify a ReactNode as best we can for `aria-label`. */
export const toPlainText = (node: unknown): string => {
	if (node === null || node === undefined || node === false || node === true) return '';
	if (typeof node === 'string' || typeof node === 'number') return String(node);
	if (Array.isArray(node)) return node.map(toPlainText).join(' ');
	if (typeof node === 'object' && 'props' in (node as object)) {
		const props = (node as { props?: { children?: unknown } }).props;
		if (props && 'children' in props) return toPlainText(props.children);
	}
	return '';
};
