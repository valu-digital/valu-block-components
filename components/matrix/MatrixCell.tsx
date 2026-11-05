import { useCallback, useId } from 'react';
import { CheckboxControl, ToggleControl } from '@wordpress/components';

import {
	CellControlWrap,
	CellInner,
	CellResetButton,
	DiffMarker,
	LeafCell,
	Radio,
	ToneIcon,
	VisuallyHidden,
} from './styles';
import {
	cellKey,
	isOverride,
	noneColumnId,
	resetRowToBaseline,
	selectSingle,
	toPlainText,
} from './utils';
import type {
	CellContext,
	MatrixCellState,
	MatrixChange,
	MatrixColumn,
	MatrixColumnGroup,
	MatrixDiffState,
	MatrixLabels,
	MatrixRow,
	MatrixVariant,
} from './types';

interface MatrixCellProps {
	row: MatrixRow;
	column: MatrixColumn;
	value: ReadonlySet<string>;
	/** Master-gate disabled (native `disabled`, existing behaviour). */
	disabled: boolean;
	variant: MatrixVariant;
	onChange: (next: ReadonlySet<string>, change: MatrixChange) => void;
	renderCell?: (ctx: CellContext) => React.ReactNode;
	/** Owning group (synthetic flat group for `columns`). */
	group?: MatrixColumnGroup;
	/** Merged lock / tone / badge state. */
	state?: MatrixCellState;
	diff?: MatrixDiffState;
	baseline?: ReadonlySet<string>;
	labels?: Required<MatrixLabels>;
	/** Radio `name` for single-select groups. */
	radioName?: string;
	/** First column of a single-select group (draws the accent rule). */
	groupStart?: boolean;
}

const FLAT_GROUP: MatrixColumnGroup = { id: '__flat__', label: '', columns: [] };

const UndoIcon = () => (
	<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden focusable="false">
		<path
			d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const WarningIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
		<path d="M12 3l10 18H2z" fill="currentColor" />
		<path
			d="M12 10v5M12 18v.01"
			fill="none"
			stroke="#1e1e1e"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

export const MatrixCell = ({
	row,
	column,
	value,
	disabled,
	variant,
	onChange,
	renderCell,
	group = FLAT_GROUP,
	state,
	diff = 'none',
	baseline,
	labels,
	radioName,
	groupStart,
}: MatrixCellProps) => {
	const descId = useId();
	const single = group.selection === 'single';
	const noneId = single ? noneColumnId(group.id) : undefined;
	const isNone = column.id === noneId;
	const groupColIds = single ? group.columns.map((c) => c.id) : undefined;

	const key = cellKey(row.id, column.id);
	const checked = isNone
		? !groupColIds!.some((id) => value.has(cellKey(row.id, id)))
		: value.has(key);
	const locked = !!state?.disabled;
	const blocked = disabled || locked;

	const toggle = useCallback(
		(nextChecked: boolean) => {
			if (blocked) return;
			if (single) {
				// Radios only fire on select; ignore deselect requests.
				if (!nextChecked) return;
				const { next, deselected } = selectSingle(
					value,
					row.id,
					groupColIds!,
					isNone ? null : column.id,
				);
				onChange(next, { rowId: row.id, colId: column.id, checked: true, deselected });
				return;
			}
			const next = new Set(value);
			if (nextChecked) next.add(key);
			else next.delete(key);
			onChange(next, { rowId: row.id, colId: column.id, checked: nextChecked });
		},
		[blocked, column.id, groupColIds, isNone, key, onChange, row.id, single, value],
	);

	const reset = useCallback(() => {
		if (!baseline || blocked) return;
		if (single) {
			const next = resetRowToBaseline(value, baseline, row.id, groupColIds!);
			const deselected = groupColIds!.filter(
				(id) => value.has(cellKey(row.id, id)) && !next.has(cellKey(row.id, id)),
			);
			onChange(next, {
				rowId: row.id,
				colId: column.id,
				checked: next.has(key),
				reset: true,
				deselected,
			});
			return;
		}
		const next = resetRowToBaseline(value, baseline, row.id, [column.id]);
		onChange(next, { rowId: row.id, colId: column.id, checked: next.has(key), reset: true });
	}, [baseline, blocked, column.id, groupColIds, key, onChange, row.id, single, value]);

	const rowText = toPlainText(row.label);
	const colText = toPlainText(column.label);
	const ariaLabel = `${rowText} — ${colText}`;

	const diffText =
		labels && diff !== 'none'
			? diff === 'inherited'
				? labels.diffInherited
				: diff === 'added'
					? labels.diffAdded
					: labels.diffRemoved
			: undefined;
	const description = [state?.reason, diffText].filter(Boolean).join('. ');
	const describedBy = description ? descId : undefined;

	// Locked cells keep focus (aria-disabled) so the reason can be read;
	// master-gated cells keep the native `disabled` they always had.
	const a11yProps = {
		'aria-label': ariaLabel,
		'aria-describedby': describedBy,
		'aria-disabled': locked ? true : undefined,
	};

	let control: React.ReactNode;
	if (renderCell) {
		control = renderCell({
			row,
			column,
			checked,
			disabled: blocked,
			toggle,
			selectionKey: key,
			state,
			diff,
			group,
		});
	} else if (single) {
		control = (
			<Radio
				type="radio"
				name={radioName}
				value={column.id}
				checked={checked}
				disabled={disabled}
				onChange={(e) => toggle(e.currentTarget.checked)}
				{...a11yProps}
			/>
		);
	} else if (variant === 'toggle') {
		control = (
			<ToggleControl
				__nextHasNoMarginBottom
				label=""
				checked={checked}
				disabled={disabled}
				onChange={toggle}
				{...a11yProps}
			/>
		);
	} else {
		control = (
			<CheckboxControl
				__nextHasNoMarginBottom
				label=""
				checked={checked}
				disabled={disabled}
				onChange={toggle}
				{...a11yProps}
			/>
		);
	}

	const showReset = !!baseline && !!labels && isOverride(diff) && !blocked && !renderCell;
	const tone = state?.tone && state.tone !== 'default' ? state.tone : undefined;

	return (
		<LeafCell
			data-disabled={disabled || undefined}
			data-locked={locked || undefined}
			data-diff={diff !== 'none' ? diff : undefined}
			data-tone={tone}
			data-selection={single ? 'single' : undefined}
			data-group-start={groupStart || undefined}
			title={state?.reason}
		>
			<CellInner>
				<CellControlWrap>{control}</CellControlWrap>
				{diff === 'added' && (
					<DiffMarker $kind="added" aria-hidden>
						+
					</DiffMarker>
				)}
				{diff === 'removed' && (
					<DiffMarker $kind="removed" aria-hidden>
						−
					</DiffMarker>
				)}
				{tone === 'warning' && !state?.badge && (
					<ToneIcon>
						<WarningIcon />
					</ToneIcon>
				)}
				{state?.badge}
				{showReset && (
					<CellResetButton
						type="button"
						aria-label={labels!.resetCell(rowText, colText)}
						title={labels!.resetCell(rowText, colText)}
						onClick={reset}
					>
						<UndoIcon />
					</CellResetButton>
				)}
			</CellInner>
			{description && <VisuallyHidden id={descId}>{description}</VisuallyHidden>}
		</LeafCell>
	);
};
