import { useId, useMemo } from 'react';

import { MatrixHeader } from './MatrixHeader';
import { MatrixRowView } from './MatrixRow';
import { EmotionCacheProvider } from './styles/emotionCache';
import { Caption, Root, Table, Viewport } from './styles';
import { useExpandedGroups } from './hooks/useExpandedGroups';
import { defaultLabels, normalizeGroups } from './utils';
import type { MatrixProps } from './types';

const DEFAULT_MAX_HEIGHT = 'calc(100vh - 260px)';

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
	const masterLeftOffset = rowHeaderWidthCss;

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
						/>
						<tbody>
							{rows.map((row) => (
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
								/>
							))}
						</tbody>
					</Table>
				</Viewport>
			</Root>
		</EmotionCacheProvider>
	);
};
