import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Matrix } from '../Matrix';
import { ALL_COLUMNS, noneColumnId } from '../utils';
import type { MatrixChange, MatrixColumnGroup, MatrixRow } from '../types';

const rows: MatrixRow[] = [
	{ id: 'u1', label: 'Alice' },
	{ id: 'u2', label: 'Bob' },
	{ id: 'u3', label: 'Cara' },
];

const columns = [
	{ id: 'read', label: 'Read' },
	{ id: 'write', label: 'Write' },
];

const describedText = (el: HTMLElement): string => {
	const id = el.getAttribute('aria-describedby');
	if (!id) return '';
	return document.getElementById(id)?.textContent ?? '';
};

describe('Matrix — getCellState', () => {
	it('locks a cell with aria-disabled, reason, badge and tone', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={columns}
				value={new Set()}
				onChange={onChange}
				getCellState={(_r, c) =>
					c === 'write'
						? { disabled: true, reason: 'Role cannot write', badge: <i>Pro</i> }
						: { tone: 'warning', reason: 'Needs Read' }
				}
			/>,
		);

		const write = screen.getByRole('checkbox', { name: 'Alice — Write' });
		expect(write).toHaveAttribute('aria-disabled', 'true');
		// Stays focusable so the reason can be read.
		expect(write).not.toBeDisabled();
		expect(describedText(write)).toBe('Role cannot write');
		expect(screen.getByText('Pro')).toBeInTheDocument();
		expect(write.closest('td')).toHaveAttribute('data-locked', 'true');
		expect(write.closest('td')).toHaveAttribute('title', 'Role cannot write');

		await user.click(write);
		expect(onChange).not.toHaveBeenCalled();

		const read = screen.getByRole('checkbox', { name: 'Alice — Read' });
		expect(read).not.toHaveAttribute('aria-disabled');
		expect(read.closest('td')).toHaveAttribute('data-tone', 'warning');
		expect(describedText(read)).toBe('Needs Read');
		await user.click(read);
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('passes state and diff to renderCell', () => {
		const renderCell = vi.fn(() => null);
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={[columns[0]]}
				value={new Set(['u1::read'])}
				baseline={new Set()}
				onChange={() => {}}
				getCellState={() => ({ tone: 'danger' })}
				renderCell={renderCell}
			/>,
		);
		expect(renderCell).toHaveBeenCalledWith(
			expect.objectContaining({ diff: 'added', state: { tone: 'danger' } }),
		);
	});
});

describe('Matrix — column and group locks', () => {
	it('a locked column disables all its cells with the description as reason', () => {
		render(
			<Matrix
				caption="X"
				rows={rows.slice(0, 2)}
				columns={[
					columns[0],
					{
						id: 'fill',
						label: 'Fill',
						disabled: true,
						badge: 'Pro',
						description: 'Requires Pro',
					},
				]}
				value={new Set()}
				onChange={() => {}}
			/>,
		);
		for (const name of ['Alice — Fill', 'Bob — Fill']) {
			const cb = screen.getByRole('checkbox', { name });
			expect(cb).toHaveAttribute('aria-disabled', 'true');
			expect(describedText(cb)).toBe('Requires Pro');
		}
		const header = screen.getByRole('columnheader', { name: /Fill/ });
		expect(header).toHaveAttribute('data-locked', 'true');
		expect(within(header).getByText('Pro')).toBeInTheDocument();
	});

	it('a locked group shows its badge and description when collapsed, and locks cells when expanded', async () => {
		const user = userEvent.setup();
		const groups: MatrixColumnGroup[] = [
			{
				id: 'seo',
				label: 'SEO',
				badge: 'Ultimate',
				disabled: true,
				description: 'Not in your plan',
				columns: [{ id: 'audit', label: 'Audit' }],
			},
		];
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				value={new Set()}
				onChange={() => {}}
			/>,
		);
		const groupHeader = screen.getByRole('columnheader', { name: /SEO/ });
		expect(groupHeader).toHaveAttribute('data-locked', 'true');
		expect(within(groupHeader).getByText('Ultimate')).toBeInTheDocument();
		// Collapsed by default; summary explains the lock.
		expect(screen.getByText('Not in your plan')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /Expand group/ }));
		const cb = screen.getByRole('checkbox', { name: 'Alice — Audit' });
		expect(cb).toHaveAttribute('aria-disabled', 'true');
		expect(describedText(cb)).toBe('Not in your plan');
	});
});

describe('Matrix — baseline diff', () => {
	const baseline = new Set(['u1::read', 'u1::write']);
	const value = new Set(['u1::read']); // write removed

	it('marks inherited / added / removed / none cells with data-diff and descriptions', () => {
		render(
			<Matrix
				caption="X"
				rows={rows.slice(0, 2)}
				columns={columns}
				value={new Set([...value, 'u2::read'])}
				baseline={baseline}
				onChange={() => {}}
			/>,
		);
		const read = screen.getByRole('checkbox', { name: 'Alice — Read' });
		const write = screen.getByRole('checkbox', { name: 'Alice — Write' });
		const bobRead = screen.getByRole('checkbox', { name: 'Bob — Read' });
		const bobWrite = screen.getByRole('checkbox', { name: 'Bob — Write' });

		expect(read.closest('td')).toHaveAttribute('data-diff', 'inherited');
		expect(describedText(read)).toBe('Inherited from baseline');
		expect(write.closest('td')).toHaveAttribute('data-diff', 'removed');
		expect(describedText(write)).toBe('Removed — in baseline');
		expect(bobRead.closest('td')).toHaveAttribute('data-diff', 'added');
		expect(describedText(bobRead)).toBe('Added — not in baseline');
		expect(bobWrite.closest('td')).not.toHaveAttribute('data-diff');
		expect(bobWrite).not.toHaveAttribute('aria-describedby');
	});

	it('override cells get a reset button that restores the baseline', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={columns}
				value={value}
				baseline={baseline}
				onChange={onChange}
			/>,
		);
		// Only the removed cell is an override.
		const buttons = screen.getAllByRole('button', { name: /to baseline/ });
		expect(buttons).toHaveLength(1);
		await user.click(screen.getByRole('button', { name: 'Reset Write for Alice to baseline' }));
		const [next, change] = onChange.mock.calls[0] as [ReadonlySet<string>, MatrixChange];
		expect(next.has('u1::write')).toBe(true);
		expect(change).toEqual({ rowId: 'u1', colId: 'write', checked: true, reset: true });
	});

	it('row reset calls onResetRow with the restored Set', async () => {
		const user = userEvent.setup();
		const onResetRow = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={rows.slice(0, 2)}
				columns={columns}
				value={new Set(['u1::read', 'u1::extra'])}
				baseline={baseline}
				onChange={() => {}}
				onResetRow={onResetRow}
			/>,
		);
		// Bob has no overrides, so only Alice gets the row reset.
		expect(screen.getAllByRole('button', { name: /^Reset .* to baseline$/ })).toHaveLength(2);
		await user.click(screen.getByRole('button', { name: 'Reset Alice to baseline' }));
		const [rowId, next] = onResetRow.mock.calls[0] as [string, ReadonlySet<string>];
		expect(rowId).toBe('u1');
		expect([...next].sort()).toEqual(['u1::extra', 'u1::read', 'u1::write']);
	});

	it('row reset without onResetRow goes through onChange with reset: true', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={columns}
				value={new Set(['u1::read'])}
				baseline={baseline}
				onChange={onChange}
				showRowReset
				labels={{ resetRow: 'Palauta', resetRowLabel: (r) => `Palauta ${r}` }}
			/>,
		);
		const btn = screen.getByRole('button', { name: 'Palauta Alice' });
		expect(btn).toHaveTextContent('Palauta');
		await user.click(btn);
		const [next, change] = onChange.mock.calls[0] as [ReadonlySet<string>, MatrixChange];
		expect(next.has('u1::write')).toBe(true);
		expect(change).toEqual({ rowId: 'u1', colId: ALL_COLUMNS, checked: false, reset: true });
	});

	it('row reset leaves locked cells alone', async () => {
		const user = userEvent.setup();
		const onResetRow = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={[columns[0], { ...columns[1], disabled: true }]}
				value={new Set()}
				baseline={baseline}
				onChange={() => {}}
				onResetRow={onResetRow}
			/>,
		);
		await user.click(screen.getByRole('button', { name: 'Reset Alice to baseline' }));
		const [, next] = onResetRow.mock.calls[0] as [string, ReadonlySet<string>];
		expect([...next]).toEqual(['u1::read']);
	});

	it('without baseline nothing diff-related renders', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={columns}
				value={new Set(['u1::read'])}
				onChange={() => {}}
				onResetRow={() => {}}
			/>,
		);
		expect(document.querySelector('[data-diff]')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
	});
});

describe('Matrix — single-select groups', () => {
	const groups: MatrixColumnGroup[] = [
		{
			id: 'mcp',
			label: 'MCP profile',
			selection: 'single',
			allowNone: true,
			collapsible: false,
			columns: [
				{ id: 'translator', label: 'Translator' },
				{ id: 'writer', label: 'Writer' },
			],
		},
	];

	it('renders radios, including a none option', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				value={new Set(['u1::writer'])}
				onChange={() => {}}
			/>,
		);
		const radios = screen.getAllByRole('radio');
		expect(radios).toHaveLength(3);
		expect(screen.getByRole('radio', { name: 'Alice — None' })).not.toBeChecked();
		expect(screen.getByRole('radio', { name: 'Alice — Writer' })).toBeChecked();
		// Same name groups the radios for arrow-key navigation.
		const names = new Set(radios.map((r) => r.getAttribute('name')));
		expect(names.size).toBe(1);
		expect(screen.getByRole('columnheader', { name: 'None' })).toBeInTheDocument();
	});

	it('selecting a radio deselects the others for the row', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={rows.slice(0, 2)}
				groups={groups}
				value={new Set(['u1::writer', 'u2::writer'])}
				onChange={onChange}
			/>,
		);
		await user.click(screen.getByRole('radio', { name: 'Alice — Translator' }));
		const [next, change] = onChange.mock.calls[0] as [ReadonlySet<string>, MatrixChange];
		expect([...next].sort()).toEqual(['u1::translator', 'u2::writer']);
		expect(change).toEqual({
			rowId: 'u1',
			colId: 'translator',
			checked: true,
			deselected: ['writer'],
		});
	});

	it('the none radio clears the group for the row and is never stored', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				value={new Set(['u1::writer'])}
				onChange={onChange}
			/>,
		);
		await user.click(screen.getByRole('radio', { name: 'Alice — None' }));
		const [next, change] = onChange.mock.calls[0] as [ReadonlySet<string>, MatrixChange];
		expect(next.size).toBe(0);
		expect(change.colId).toBe(noneColumnId('mcp'));
		expect(change.deselected).toEqual(['writer']);
	});

	it('locked radios use aria-disabled and ignore selection', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				value={new Set()}
				onChange={onChange}
				getCellState={(_r, c) =>
					c === 'translator'
						? { disabled: true, reason: 'Profile not in MCP' }
						: undefined
				}
			/>,
		);
		const r = screen.getByRole('radio', { name: 'Alice — Translator' });
		expect(r).toHaveAttribute('aria-disabled', 'true');
		expect(describedText(r)).toBe('Profile not in MCP');
		await user.click(r);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('collapsed single groups summarise the selected column', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={[{ ...groups[0], collapsible: true }]}
				value={new Set(['u1::translator'])}
				onChange={() => {}}
			/>,
		);
		expect(screen.getByRole('cell', { name: 'Translator' })).toBeInTheDocument();
	});
});

describe('Matrix — row status', () => {
	it('renders status under the row label in an aria-live region', async () => {
		const user = userEvent.setup();
		const onRetry = vi.fn();
		const statuses = {
			u1: { status: 'saving' as const },
			u2: { status: 'saved' as const },
			u3: { status: 'error' as const, message: 'Network down', onRetry },
		};
		render(
			<Matrix
				caption="X"
				rows={rows}
				columns={columns}
				value={new Set()}
				onChange={() => {}}
				getRowStatus={(id) => statuses[id as keyof typeof statuses]}
			/>,
		);
		const regions = document.querySelectorAll('[data-status] [aria-live="polite"]');
		expect(regions).toHaveLength(3);
		expect(regions[0]).toHaveTextContent('Alice: Saving…');
		expect(regions[1]).toHaveTextContent('Bob: Saved');
		expect(regions[2]).toHaveTextContent('Cara: Network down');
		expect(regions[0]).toHaveAttribute('aria-atomic', 'true');

		await user.click(screen.getByRole('button', { name: 'Retry' }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('idle rows keep an empty live region so later updates are announced', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={columns}
				value={new Set()}
				onChange={() => {}}
				getRowStatus={() => ({ status: 'idle' })}
			/>,
		);
		const region = document.querySelector('[data-status] [aria-live="polite"]');
		expect(region).not.toBeNull();
		expect(region).toHaveTextContent('');
	});
});

describe('Matrix — row selection', () => {
	const setup = (selected: string[], onSelectedRowsChange = vi.fn()) => {
		render(
			<Matrix
				caption="X"
				rows={rows}
				columns={columns}
				value={new Set()}
				onChange={() => {}}
				selectableRows
				selectedRows={new Set(selected)}
				onSelectedRowsChange={onSelectedRowsChange}
			/>,
		);
		return onSelectedRowsChange;
	};

	it('renders a select checkbox per row and a tri-state header', () => {
		setup(['u1']);
		const all = screen.getByRole('checkbox', { name: 'Select all rows' });
		expect(all).not.toBeChecked();
		expect((all as HTMLInputElement).indeterminate).toBe(true);
		expect(screen.getByRole('checkbox', { name: 'Select Alice' })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: 'Select Bob' })).not.toBeChecked();
		expect(screen.getByText('Alice').closest('tr')).toHaveAttribute('data-selected', 'true');
	});

	it('select-all selects every row, then clears them', async () => {
		const user = userEvent.setup();
		const spy = setup([]);
		await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
		expect([...(spy.mock.calls[0][0] as Set<string>)].sort()).toEqual(['u1', 'u2', 'u3']);
	});

	it('header is checked when every row is selected; clicking clears', async () => {
		const user = userEvent.setup();
		const spy = setup(['u1', 'u2', 'u3', 'other']);
		const all = screen.getByRole('checkbox', { name: 'Select all rows' });
		expect(all).toBeChecked();
		await user.click(all);
		// Rows outside the current list are preserved.
		expect([...(spy.mock.calls[0][0] as Set<string>)]).toEqual(['other']);
	});

	it('toggles a single row with the keyboard', async () => {
		const user = userEvent.setup();
		const spy = setup([]);
		screen.getByRole('checkbox', { name: 'Select Bob' }).focus();
		await user.keyboard(' ');
		expect([...(spy.mock.calls[0][0] as Set<string>)]).toEqual(['u2']);
	});

	it('shift+click selects a range from the last clicked row', async () => {
		const user = userEvent.setup();
		const spy = vi.fn();
		const { rerender } = render(
			<Matrix
				caption="X"
				rows={rows}
				columns={columns}
				value={new Set()}
				onChange={() => {}}
				selectableRows
				selectedRows={new Set()}
				onSelectedRowsChange={spy}
			/>,
		);
		await user.click(screen.getByRole('checkbox', { name: 'Select Alice' }));
		rerender(
			<Matrix
				caption="X"
				rows={rows}
				columns={columns}
				value={new Set()}
				onChange={() => {}}
				selectableRows
				selectedRows={new Set(['u1'])}
				onSelectedRowsChange={spy}
			/>,
		);
		await user.keyboard('{Shift>}');
		await user.click(screen.getByRole('checkbox', { name: 'Select Cara' }));
		await user.keyboard('{/Shift}');
		expect([...(spy.mock.calls[1][0] as Set<string>)].sort()).toEqual(['u1', 'u2', 'u3']);
	});

	it('existing behaviour: no select column without selectableRows', () => {
		render(
			<Matrix
				caption="X"
				rows={rows}
				columns={columns}
				value={new Set()}
				onChange={() => {}}
			/>,
		);
		expect(screen.queryByRole('checkbox', { name: /Select/ })).toBeNull();
		expect(screen.getAllByRole('checkbox')).toHaveLength(6);
	});
});

describe('Matrix — row memoization', () => {
	it('re-renders only the row whose cells changed', () => {
		const renderRowHeader = vi.fn((row: MatrixRow) => <span>{row.label}</span>);
		const props = {
			caption: 'X',
			rows,
			columns,
			onChange: () => {},
			renderRowHeader,
		};
		const { rerender } = render(<Matrix {...props} value={new Set()} />);
		expect(renderRowHeader).toHaveBeenCalledTimes(3);
		renderRowHeader.mockClear();

		rerender(<Matrix {...props} value={new Set(['u2::read'])} />);
		expect(renderRowHeader).toHaveBeenCalledTimes(1);
		expect(renderRowHeader).toHaveBeenCalledWith(rows[1]);
	});

	it('a skipped row computes its change from the latest value', async () => {
		const user = userEvent.setup();
		const calls: ReadonlySet<string>[] = [];
		const Harness = () => {
			const [value, setValue] = useState<ReadonlySet<string>>(new Set());
			return (
				<Matrix
					caption="X"
					rows={rows}
					columns={columns}
					value={value}
					onChange={(next) => {
						calls.push(next);
						setValue(next);
					}}
				/>
			);
		};
		render(<Harness />);
		await user.click(screen.getByRole('checkbox', { name: 'Alice — Read' }));
		await user.click(screen.getByRole('checkbox', { name: 'Bob — Write' }));
		expect([...calls[1]].sort()).toEqual(['u1::read', 'u2::write']);
	});

	it('re-renders a row when getCellState results change for it', () => {
		const props = { caption: 'X', rows, columns, value: new Set<string>(), onChange: () => {} };
		const { rerender } = render(<Matrix {...props} getCellState={() => undefined} />);
		rerender(
			<Matrix
				{...props}
				getCellState={(r, c) =>
					r === 'u3' && c === 'read' ? { disabled: true } : undefined
				}
			/>,
		);
		expect(screen.getByRole('checkbox', { name: 'Cara — Read' })).toHaveAttribute(
			'aria-disabled',
			'true',
		);
	});

	it('retry calls the latest getRowStatus onRetry', async () => {
		const user = userEvent.setup();
		const first = vi.fn();
		const second = vi.fn();
		const props = {
			caption: 'X',
			rows: [rows[0]],
			columns,
			value: new Set<string>(),
			onChange: () => {},
		};
		const { rerender } = render(
			<Matrix {...props} getRowStatus={() => ({ status: 'error', onRetry: first })} />,
		);
		rerender(<Matrix {...props} getRowStatus={() => ({ status: 'error', onRetry: second })} />);
		await user.click(screen.getByRole('button', { name: 'Retry' }));
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});
});

describe('Matrix — group.defaultExpanded', () => {
	const groups: MatrixColumnGroup[] = [
		{ id: 'open', label: 'Open', defaultExpanded: true, columns: [{ id: 'a', label: 'A' }] },
		{ id: 'closed', label: 'Closed', columns: [{ id: 'b', label: 'B' }] },
		{
			id: 'locked',
			label: 'Locked',
			disabled: true,
			description: 'Not in plan',
			columns: [{ id: 'c', label: 'C' }],
		},
	];

	it('expands groups with defaultExpanded when uncontrolled; others stay collapsed', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				value={new Set()}
				onChange={() => {}}
			/>,
		);
		expect(screen.getByRole('columnheader', { name: 'A' })).toBeInTheDocument();
		expect(screen.queryByRole('columnheader', { name: 'B' })).toBeNull();
		expect(screen.queryByRole('columnheader', { name: 'C' })).toBeNull();
		expect(screen.getByText('Not in plan')).toBeInTheDocument();
	});

	it('merges with the Matrix-level defaultExpanded', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				defaultExpanded={new Set(['closed'])}
				value={new Set()}
				onChange={() => {}}
			/>,
		);
		expect(screen.getByRole('columnheader', { name: 'A' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'B' })).toBeInTheDocument();
	});

	it('is ignored when expanded is controlled', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				expanded={new Set()}
				value={new Set()}
				onChange={() => {}}
			/>,
		);
		expect(screen.queryByRole('columnheader', { name: 'A' })).toBeNull();
	});

	it('the user can still collapse a defaultExpanded group', async () => {
		const user = userEvent.setup();
		const onExpandedChange = vi.fn();
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={groups}
				value={new Set()}
				onChange={() => {}}
				onExpandedChange={onExpandedChange}
			/>,
		);
		await user.click(screen.getByRole('button', { name: 'Collapse group' }));
		expect(screen.queryByRole('columnheader', { name: 'A' })).toBeNull();
		expect([...(onExpandedChange.mock.calls[0][0] as Set<string>)]).toEqual([]);
	});
});
