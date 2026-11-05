import { useCallback, useRef } from 'react';
import { CheckboxControl, ToggleControl } from '@wordpress/components';

import { MatrixCell } from './MatrixCell';
import { MatrixGroupSummary } from './MatrixGroupSummary';
import {
	CellControlWrap,
	FillerCell,
	LinkButton,
	MasterCell,
	RetryButton,
	RowHeaderCell,
	RowHeaderInner,
	RowLabel,
	RowMeta,
	RowStatusLine,
	RowSublabel,
	RowHeaderText,
	SelectCell,
	Spinner,
	VisuallyHidden,
} from './styles';
import {
	ALL_COLUMNS,
	cellKey,
	diffState,
	isOverride,
	mergeCellState,
	noneColumnId,
	resetRowToBaseline,
	toggleCell,
	toPlainText,
	visibleColumnsOf,
} from './utils';
import type {
	CellContext,
	ColId,
	GroupSummaryContext,
	MatrixCellState,
	MatrixChange,
	MatrixColumn,
	MatrixColumnGroup,
	MatrixLabels,
	MatrixMasterColumn,
	MatrixRow as MatrixRowType,
	MatrixRowStatus,
	MatrixVariant,
	RowId,
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

	/* 0.8 extensions — all optional so the row renders exactly as before without them. */
	rootId?: string;
	rowIndex?: number;
	getCellState?: (rowId: RowId, colId: ColId) => MatrixCellState | undefined;
	baseline?: ReadonlySet<string>;
	onResetRow?: (rowId: RowId, next: ReadonlySet<string>) => void;
	showRowReset?: boolean;
	status?: MatrixRowStatus;
	trackStatus?: boolean;
	selectable?: boolean;
	selected?: boolean;
	onSelectRow?: (rowId: RowId, index: number, selected: boolean, range: boolean) => void;
	rowHeaderLeftOffset?: string;
}

const isGroupExpanded = (group: MatrixColumnGroup, expanded: ReadonlySet<string>): boolean =>
	group.collapsible === false ? true : expanded.has(group.id);

const countSelected = (value: ReadonlySet<string>, rowId: string, cols: MatrixColumn[]): number => {
	let n = 0;
	for (const c of cols) if (value.has(cellKey(rowId, c.id))) n += 1;
	return n;
};

const CheckIcon = () => (
	<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden focusable="false">
		<path
			d="M5 12.5l4.5 4.5L19 7.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const ErrorIcon = () => (
	<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden focusable="false">
		<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
		<path
			d="M12 7v6M12 16.5v.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
		/>
	</svg>
);

/** Columns a row reset may touch: every real leaf column that isn't locked. */
const resettableColumns = (
	groups: MatrixColumnGroup[],
	rowId: RowId,
	getCellState?: (rowId: RowId, colId: ColId) => MatrixCellState | undefined,
): ColId[] => {
	const out: ColId[] = [];
	for (const g of groups) {
		for (const c of g.columns) {
			const st = mergeCellState(g, c, getCellState?.(rowId, c.id));
			if (!st?.disabled) out.push(c.id);
		}
	}
	return out;
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
	rootId = 'valu-mx',
	rowIndex = 0,
	getCellState,
	baseline,
	onResetRow,
	showRowReset,
	status,
	trackStatus = false,
	selectable = false,
	selected = false,
	onSelectRow,
	rowHeaderLeftOffset,
}: MatrixRowProps) => {
	const masterChecked = master ? value.has(cellKey(row.id, master.id)) : true;
	const masterDisablesRow = master ? master.disablesRow !== false : false;
	const rowDisabled = master ? masterDisablesRow && !masterChecked : false;
	const rowText = toPlainText(row.label);
	const rangeRef = useRef(false);

	const toggleMaster = useCallback(
		(checked: boolean) => {
			if (!master) return;
			const next = toggleCell(value, row.id, master.id, checked);
			onChange(next, { rowId: row.id, colId: master.id, checked });
		},
		[master, onChange, row.id, value],
	);

	// Row reset: only computed when a baseline is present and the action is enabled.
	const rowResetEnabled = !!baseline && (showRowReset ?? !!onResetRow);
	let resetCols: ColId[] = [];
	let rowHasOverrides = false;
	if (rowResetEnabled) {
		resetCols = resettableColumns(groups, row.id, getCellState);
		rowHasOverrides = resetCols.some((c) => isOverride(diffState(value, baseline, row.id, c)));
	}

	const resetRow = () => {
		if (!baseline) return;
		const next = resetRowToBaseline(value, baseline, row.id, resetCols);
		if (onResetRow) onResetRow(row.id, next);
		else onChange(next, { rowId: row.id, colId: ALL_COLUMNS, checked: false, reset: true });
	};

	const statusKind = status?.status ?? 'idle';
	const statusText =
		statusKind === 'idle'
			? ''
			: (status?.message ??
				(statusKind === 'saving'
					? labels.statusSaving
					: statusKind === 'saved'
						? labels.statusSaved
						: labels.statusError));

	const extras =
		trackStatus || (rowResetEnabled && rowHasOverrides) ? (
			<>
				{trackStatus && (
					<RowStatusLine $status={statusKind} data-status={statusKind}>
						<span
							aria-live="polite"
							aria-atomic="true"
							style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
						>
							{statusKind === 'saving' && <Spinner aria-hidden />}
							{statusKind === 'saved' && <CheckIcon />}
							{statusKind === 'error' && <ErrorIcon />}
							{statusText && (
								<>
									<VisuallyHidden>{`${rowText}: `}</VisuallyHidden>
									{statusText}
								</>
							)}
						</span>
						{statusKind === 'error' && status?.onRetry && (
							<>
								<span aria-hidden>·</span>
								<RetryButton type="button" onClick={status.onRetry}>
									{labels.retry}
								</RetryButton>
							</>
						)}
					</RowStatusLine>
				)}
				{rowResetEnabled && rowHasOverrides && (
					<div>
						<LinkButton
							type="button"
							aria-label={labels.resetRowLabel(rowText)}
							onClick={resetRow}
						>
							{labels.resetRow}
						</LinkButton>
					</div>
				)}
			</>
		) : null;

	const renderLeaf = (group: MatrixColumnGroup, col: MatrixColumn, index: number) => {
		const isNone = group.selection === 'single' && col.id === noneColumnId(group.id);
		const state = mergeCellState(
			group,
			col,
			isNone ? undefined : getCellState?.(row.id, col.id),
		);
		const single = group.selection === 'single';
		return (
			<MatrixCell
				key={flat ? col.id : `${group.id}::${col.id}`}
				row={row}
				column={col}
				value={value}
				disabled={rowDisabled}
				variant={variant}
				onChange={onChange}
				renderCell={renderCell}
				group={group}
				state={state}
				diff={isNone ? 'none' : diffState(value, baseline, row.id, col.id)}
				baseline={baseline}
				labels={labels}
				radioName={single ? `${rootId}-${row.id}-${group.id}` : undefined}
				groupStart={single && index === 0}
			/>
		);
	};

	return (
		<tr data-selected={selected || undefined}>
			{selectable && (
				<SelectCell
					$leftSticky={stickyFirstColumn}
					// Capture Shift before the click/space that toggles the checkbox.
					onMouseDownCapture={(e) => {
						rangeRef.current = e.shiftKey;
					}}
					onKeyDownCapture={(e) => {
						rangeRef.current = e.shiftKey;
					}}
				>
					<CellControlWrap>
						<CheckboxControl
							__nextHasNoMarginBottom
							label=""
							checked={selected}
							aria-label={labels.selectRow(rowText)}
							onChange={(next: boolean) => {
								const range = rangeRef.current;
								rangeRef.current = false;
								onSelectRow?.(row.id, rowIndex, next, range);
							}}
						/>
					</CellControlWrap>
				</SelectCell>
			)}

			<RowHeaderCell
				scope="row"
				$leftSticky={stickyFirstColumn}
				$leftOffset={rowHeaderLeftOffset}
			>
				{renderRowHeader ? (
					<>
						{renderRowHeader(row)}
						{extras}
					</>
				) : (
					<RowHeaderInner>
						{row.avatar}
						<RowHeaderText>
							<RowLabel>{row.label}</RowLabel>
							{row.sublabel && <RowSublabel>{row.sublabel}</RowSublabel>}
							{extras}
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
							aria-label={`${toPlainText(master.label)} — ${rowText}`}
							onChange={toggleMaster}
						/>
					</CellControlWrap>
				</MasterCell>
			)}

			{flat
				? groups[0]!.columns.map((col, i) => renderLeaf(groups[0]!, col, i))
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
									value={value}
								/>,
							];
						}
						return visibleColumnsOf(group, labels.noneOption).map((col, i) =>
							renderLeaf(group, col, i),
						);
					})}
			<FillerCell aria-hidden />
		</tr>
	);
};
