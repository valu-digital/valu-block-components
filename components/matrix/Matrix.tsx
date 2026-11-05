import { useCallback, useId, useMemo, useRef } from 'react';

import { MatrixHeader } from './MatrixHeader';
import { MatrixRowView } from './MatrixRow';
import { EmotionCacheProvider } from './styles/emotionCache';
import { Caption, Root, Table, Viewport } from './styles';
import { useExpandedGroups } from './hooks/useExpandedGroups';
import { defaultLabels, normalizeGroups } from './utils';
import type { MatrixProps } from './types';

const DEFAULT_MAX_HEIGHT = 'calc(100vh - 260px)';
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

/**
 * `<Matrix />` — abstract row × column grid of selectable cells.
 *
 * Rows × columns × cells. Each cell is identified by `${rowId}::${colId}`,
 * and the selection is a flat `Set<string>`. The component is **controlled**:
 * the consumer owns the value and the expanded-group state (or uses the
 * `defaultExpanded` escape hatch for uncontrolled expansion).
 *
 * Pass either `columns` (flat — single header row, no expand/collapse) or
 * `groups` (two header rows, collapsible). Optional sticky `master` column
 * can gate the row.
 *
 * @example flat
 * <Matrix
 *     caption="Notification preferences"
 *     rows={users}
 *     columns={[{ id: 'email', label: 'Email' }, { id: 'push', label: 'Push' }]}
 *     value={selection}
 *     onChange={setSelection}
 * />
 *
 * @example grouped with master
 * <Matrix
 *     caption="User permissions"
 *     rows={users}
 *     master={{ id: 'enabled', label: 'Enabled' }}
 *     groups={categories}
 *     value={selection}
 *     onChange={setSelection}
 * />
 */
export const Matrix = (props: MatrixProps) => {
	const {
		rows,
		master,
		value,
		onChange,
		expanded,
		defaultExpanded,
		onExpandedChange,
		variant = 'checkbox',
		renderCell,
		renderRowHeader,
		renderGroupSummary,
		renderHeader,
		stickyHeader = true,
		stickyFirstColumn = true,
		rowHeaderWidth = 220,
		maxHeight = DEFAULT_MAX_HEIGHT,
		caption,
		labels,
		className,
		id,
		getCellState,
		baseline,
		onResetRow,
		showRowReset,
		getRowStatus,
		selectableRows = false,
		selectedRows,
		onSelectedRowsChange,
	} = props;

	const reactId = useId();
	const rootId = id ?? `valu-mx-${reactId.replace(/:/g, '')}`;

	const { groups, flat } = useMemo(
		() => normalizeGroups({ columns: props.columns, groups: props.groups }),
		[props.columns, props.groups],
	);

	const resolvedLabels = useMemo(() => defaultLabels(labels), [labels]);

	const { expanded: expandedGroups, toggle: toggleGroup } = useExpandedGroups({
		expanded,
		defaultExpanded,
		onChange: onExpandedChange,
	});

	const maxHeightCss = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
	const cssLength = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);
	const rowHeaderWidthCss = cssLength(rowHeaderWidth);
	const masterWidthCss = master ? cssLength(master.width ?? 96) : '0';
	const selectWidthCss = '48px';
	const rowHeaderLeftOffset = selectableRows ? selectWidthCss : '0';
	const masterLeftOffset = selectableRows
		? `calc(${selectWidthCss} + ${rowHeaderWidthCss})`
		: rowHeaderWidthCss;

	// Row selection — controlled via `selectedRows`, operates on the current `rows`.
	const selected = selectedRows ?? EMPTY_SET;
	const lastIndexRef = useRef<number | null>(null);
	const selectedCount = selectableRows ? rows.filter((r) => selected.has(r.id)).length : 0;

	const onSelectRow = useCallback(
		(rowId: string, index: number, isSelected: boolean, range: boolean) => {
			const next = new Set(selected);
			const anchor = lastIndexRef.current;
			if (range && anchor !== null && anchor !== index) {
				const [from, to] = anchor < index ? [anchor, index] : [index, anchor];
				for (let i = from; i <= to; i += 1) {
					const r = rows[i];
					if (!r) continue;
					if (isSelected) next.add(r.id);
					else next.delete(r.id);
				}
			} else if (isSelected) next.add(rowId);
			else next.delete(rowId);
			lastIndexRef.current = index;
			onSelectedRowsChange?.(next);
		},
		[onSelectedRowsChange, rows, selected],
	);

	const headerSelection = selectableRows
		? {
				checked: rows.length > 0 && selectedCount === rows.length,
				indeterminate: selectedCount > 0 && selectedCount < rows.length,
				onChange: (checked: boolean) => {
					const next = new Set(selected);
					for (const r of rows) {
						if (checked) next.add(r.id);
						else next.delete(r.id);
					}
					lastIndexRef.current = null;
					onSelectedRowsChange?.(next);
				},
			}
		: undefined;

	return (
		<EmotionCacheProvider>
			<Root id={rootId} className={className}>
				<Viewport $maxHeight={maxHeightCss}>
					<Table>
						{caption && <Caption>{caption}</Caption>}
						{/*
						 * Pin the row-header and master column widths so they don't grow
						 * when leaf columns are collapsed into group-summary cells. The
						 * remaining cols are left without explicit widths so leftover
						 * space distributes among them.
						 */}
						<colgroup>
							{selectableRows && <col style={{ width: selectWidthCss }} />}
							<col style={{ width: rowHeaderWidthCss }} />
							{master && <col style={{ width: masterWidthCss }} />}
						</colgroup>
						<MatrixHeader
							groups={groups}
							master={master}
							flat={flat}
							stickyHeader={stickyHeader}
							stickyFirstColumn={stickyFirstColumn}
							masterLeftOffset={masterLeftOffset}
							expandedGroups={expandedGroups}
							onToggleGroup={toggleGroup}
							labels={resolvedLabels}
							renderHeader={renderHeader}
							selection={headerSelection}
							rowHeaderLeftOffset={rowHeaderLeftOffset}
						/>
						<tbody>
							{rows.map((row, rowIndex) => (
								<MatrixRowView
									key={row.id}
									row={row}
									groups={groups}
									master={master}
									flat={flat}
									value={value}
									expandedGroups={expandedGroups}
									stickyFirstColumn={stickyFirstColumn}
									masterLeftOffset={masterLeftOffset}
									variant={variant}
									onChange={onChange}
									labels={resolvedLabels}
									renderCell={renderCell}
									renderRowHeader={renderRowHeader}
									renderGroupSummary={renderGroupSummary}
									rootId={rootId}
									rowIndex={rowIndex}
									getCellState={getCellState}
									baseline={baseline}
									onResetRow={onResetRow}
									showRowReset={showRowReset}
									status={getRowStatus?.(row.id)}
									trackStatus={!!getRowStatus}
									selectable={selectableRows}
									selected={selectableRows && selected.has(row.id)}
									onSelectRow={onSelectRow}
									rowHeaderLeftOffset={rowHeaderLeftOffset}
								/>
							))}
						</tbody>
					</Table>
				</Viewport>
			</Root>
		</EmotionCacheProvider>
	);
};
