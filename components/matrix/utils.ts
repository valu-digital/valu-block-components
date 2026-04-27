import type {
	ColId,
	MatrixColumn,
	MatrixColumnGroup,
	MatrixLabels,
	RowId,
} from './types';

/** Selection-set key for a single cell. */
export const cellKey = (rowId: RowId, colId: ColId): string => `${rowId}::${colId}`;

/**
 * Returns the column ids selected for a single row.
 *
 * @example
 * selectionByRow(value, 'user-42')  // ['create', 'edit']
 */
export const selectionByRow = (
	value: ReadonlySet<string>,
	rowId: RowId,
): ColId[] => {
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
