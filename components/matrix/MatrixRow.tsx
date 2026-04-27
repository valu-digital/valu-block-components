import { useCallback } from 'react';
import { ToggleControl } from '@wordpress/components';

import { MatrixCell } from './MatrixCell';
import { MatrixGroupSummary } from './MatrixGroupSummary';
import {
	CellControlWrap,
	MasterCell,
	RowHeaderCell,
	RowHeaderInner,
	RowLabel,
	RowMeta,
	RowSublabel,
	RowHeaderText,
} from './styles';
import { cellKey, toggleCell, toPlainText } from './utils';
import type {
	CellContext,
	GroupSummaryContext,
	MatrixChange,
	MatrixColumn,
	MatrixColumnGroup,
	MatrixLabels,
	MatrixMasterColumn,
	MatrixRow as MatrixRowType,
	MatrixVariant,
} from './types';

interface MatrixRowProps {
	row: MatrixRowType;
	groups: MatrixColumnGroup[];
	master?: MatrixMasterColumn;
	flat: boolean;
	value: ReadonlySet<string>;
	expandedGroups: ReadonlySet<string>;
	stickyFirstColumn: boolean;
	masterLeftOffset: string;
	variant: MatrixVariant;
	onChange: (next: ReadonlySet<string>, change: MatrixChange) => void;
	labels: Required<MatrixLabels>;
	renderCell?: (ctx: CellContext) => React.ReactNode;
	renderRowHeader?: (row: MatrixRowType) => React.ReactNode;
	renderGroupSummary?: (ctx: GroupSummaryContext) => React.ReactNode;
}

const isGroupExpanded = (group: MatrixColumnGroup, expanded: ReadonlySet<string>): boolean =>
	group.collapsible === false ? true : expanded.has(group.id);

const countSelected = (
	value: ReadonlySet<string>,
	rowId: string,
	cols: MatrixColumn[],
): number => {
	let n = 0;
	for (const c of cols) if (value.has(cellKey(rowId, c.id))) n += 1;
	return n;
};

export const MatrixRowView = ({
	row,
	groups,
	master,
	flat,
	value,
	expandedGroups,
	stickyFirstColumn,
	masterLeftOffset,
	variant,
	onChange,
	labels,
	renderCell,
	renderRowHeader,
	renderGroupSummary,
}: MatrixRowProps) => {
	const masterChecked = master ? value.has(cellKey(row.id, master.id)) : true;
	const masterDisablesRow = master ? master.disablesRow !== false : false;
	const rowDisabled = master ? masterDisablesRow && !masterChecked : false;

	const toggleMaster = useCallback(
		(checked: boolean) => {
			if (!master) return;
			const next = toggleCell(value, row.id, master.id, checked);
			onChange(next, { rowId: row.id, colId: master.id, checked });
		},
		[master, onChange, row.id, value],
	);

	return (
		<tr>
			<RowHeaderCell scope="row" $leftSticky={stickyFirstColumn}>
				{renderRowHeader ? (
					renderRowHeader(row)
				) : (
					<RowHeaderInner>
						{row.avatar}
						<RowHeaderText>
							<RowLabel>{row.label}</RowLabel>
							{row.sublabel && <RowSublabel>{row.sublabel}</RowSublabel>}
						</RowHeaderText>
						{row.meta && <RowMeta>{row.meta}</RowMeta>}
					</RowHeaderInner>
				)}
			</RowHeaderCell>

			{master && (
				<MasterCell $leftSticky={stickyFirstColumn} $leftOffset={masterLeftOffset}>
					<CellControlWrap>
						<ToggleControl
							__nextHasNoMarginBottom
							label=""
							checked={masterChecked}
							aria-label={`${toPlainText(master.label)} — ${toPlainText(row.label)}`}
							onChange={toggleMaster}
						/>
					</CellControlWrap>
				</MasterCell>
			)}

			{flat
				? groups[0]!.columns.map((col) => (
						<MatrixCell
							key={col.id}
							row={row}
							column={col}
							value={value}
							disabled={rowDisabled}
							variant={variant}
							onChange={onChange}
							renderCell={renderCell}
						/>
					))
				: groups.flatMap((group) => {
						const open = isGroupExpanded(group, expandedGroups);
						if (!open) {
							return [
								<MatrixGroupSummary
									key={group.id}
									ctx={{
										row,
										group,
										selectedCount: countSelected(value, row.id, group.columns),
										totalCount: group.columns.length,
									}}
									labels={labels}
									render={renderGroupSummary}
								/>,
							];
						}
						return group.columns.map((col) => (
							<MatrixCell
								key={`${group.id}::${col.id}`}
								row={row}
								column={col}
								value={value}
								disabled={rowDisabled}
								variant={variant}
								onChange={onChange}
								renderCell={renderCell}
							/>
						));
					})}
		</tr>
	);
};
