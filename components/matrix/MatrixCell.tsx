import { useCallback } from 'react';
import { CheckboxControl, ToggleControl } from '@wordpress/components';

import { CellControlWrap, LeafCell } from './styles';
import { cellKey, toggleCell, toPlainText } from './utils';
import type {
	CellContext,
	MatrixChange,
	MatrixColumn,
	MatrixRow,
	MatrixVariant,
} from './types';

interface MatrixCellProps {
	row: MatrixRow;
	column: MatrixColumn;
	value: ReadonlySet<string>;
	disabled: boolean;
	variant: MatrixVariant;
	onChange: (next: ReadonlySet<string>, change: MatrixChange) => void;
	renderCell?: (ctx: CellContext) => React.ReactNode;
}

export const MatrixCell = ({
	row,
	column,
	value,
	disabled,
	variant,
	onChange,
	renderCell,
}: MatrixCellProps) => {
	const key = cellKey(row.id, column.id);
	const checked = value.has(key);

	const toggle = useCallback(
		(nextChecked: boolean) => {
			if (disabled) return;
			const next = toggleCell(value, row.id, column.id, nextChecked);
			onChange(next, { rowId: row.id, colId: column.id, checked: nextChecked });
		},
		[column.id, disabled, onChange, row.id, value],
	);

	const ariaLabel = `${toPlainText(row.label)} — ${toPlainText(column.label)}`;

	const content = renderCell ? (
		renderCell({ row, column, checked, disabled, toggle, selectionKey: key })
	) : variant === 'toggle' ? (
		<ToggleControl
			__nextHasNoMarginBottom
			label=""
			checked={checked}
			disabled={disabled}
			aria-label={ariaLabel}
			onChange={toggle}
		/>
	) : (
		<CheckboxControl
			__nextHasNoMarginBottom
			label=""
			checked={checked}
			disabled={disabled}
			aria-label={ariaLabel}
			onChange={toggle}
		/>
	);

	return (
		<LeafCell data-disabled={disabled || undefined}>
			<CellControlWrap>{content}</CellControlWrap>
		</LeafCell>
	);
};
