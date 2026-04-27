import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Matrix } from '../Matrix';
import type { MatrixChange, MatrixColumnGroup, MatrixRow } from '../types';

const rows: MatrixRow[] = [
	{ id: 'u1', label: 'Alice', sublabel: 'alice@example.com' },
	{ id: 'u2', label: 'Bob', sublabel: 'bob@example.com' },
];

const flatColumns = [
	{ id: 'email', label: 'Email' },
	{ id: 'push', label: 'Push' },
];

const groups: MatrixColumnGroup[] = [
	{
		id: 'posts',
		label: 'Posts',
		columns: [
			{ id: 'create', label: 'Create' },
			{ id: 'edit', label: 'Edit' },
		],
	},
	{
		id: 'media',
		label: 'Media',
		columns: [
			{ id: 'upload', label: 'Upload' },
			{ id: 'delete', label: 'Delete' },
		],
	},
];

describe('Matrix — flat columns', () => {
	it('renders one row per row and one cell per column', () => {
		render(
			<Matrix
				caption="Notifications"
				rows={rows}
				columns={flatColumns}
				value={new Set()}
				onChange={() => {}}
			/>,
		);

		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();

		// Two rows × two columns = four leaf checkbox controls.
		expect(screen.getAllByRole('checkbox')).toHaveLength(4);

		// Headers render once.
		expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Push' })).toBeInTheDocument();
	});

	it('clicking a cell calls onChange with the next Set and the change details', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="Notifications"
				rows={rows}
				columns={flatColumns}
				value={new Set()}
				onChange={onChange}
			/>,
		);

		const aliceEmailCheckbox = screen.getByRole('checkbox', { name: /Alice — Email/ });
		await user.click(aliceEmailCheckbox);

		expect(onChange).toHaveBeenCalledTimes(1);
		const [next, change] = onChange.mock.calls[0] as [
			ReadonlySet<string>,
			MatrixChange,
		];
		expect(next.has('u1::email')).toBe(true);
		expect(change).toEqual({ rowId: 'u1', colId: 'email', checked: true });
	});
});

describe('Matrix — groups (collapsible)', () => {
	it('collapsed groups render a single summary cell per row', () => {
		render(
			<Matrix
				caption="Permissions"
				rows={[rows[0]]}
				groups={groups}
				value={new Set(['u1::create'])}
				onChange={() => {}}
			/>,
		);

		// Group buttons in the header — both groups collapsed.
		const groupButtons = screen.getAllByRole('button', { name: /Expand group/i });
		expect(groupButtons).toHaveLength(2);
		expect(groupButtons[0]).toHaveAttribute('aria-expanded', 'false');
		expect(groupButtons[1]).toHaveAttribute('aria-expanded', 'false');

		// "1 / 2" summary for posts (create selected of [create, edit]).
		expect(screen.getByText('1 / 2')).toBeInTheDocument();
		// "0 / 2" summary for media.
		expect(screen.getByText('0 / 2')).toBeInTheDocument();

		// Leaf headers should not be in the DOM yet.
		expect(screen.queryByRole('columnheader', { name: 'Create' })).toBeNull();
	});

	it('clicking a group header expands it and shows leaf cells', async () => {
		const user = userEvent.setup();
		render(
			<Matrix
				caption="Permissions"
				rows={[rows[0]]}
				groups={groups}
				value={new Set()}
				onChange={() => {}}
			/>,
		);

		const buttons = screen.getAllByRole('button');
		// Two collapsible groups → two buttons.
		expect(buttons).toHaveLength(2);
		await user.click(buttons[0]);

		expect(screen.getByRole('columnheader', { name: 'Create' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Edit' })).toBeInTheDocument();
		// Other group still collapsed.
		expect(screen.queryByRole('columnheader', { name: 'Upload' })).toBeNull();
	});
});

describe('Matrix — master column', () => {
	it('disables leaf cells in a row when the master toggle is off', () => {
		render(
			<Matrix
				caption="Permissions"
				rows={[rows[0]]}
				master={{ id: 'enabled', label: 'Enabled' }}
				columns={flatColumns}
				value={new Set()}
				onChange={() => {}}
			/>,
		);

		// Row-leaf checkboxes should be disabled (master off, disablesRow defaults to true).
		// Filter out the master toggle (which should remain enabled).
		const allInputs = screen.getAllByRole('checkbox');
		const leafInputs = allInputs.filter(
			(el) => !el.getAttribute('aria-label')?.startsWith('Enabled —'),
		);
		expect(leafInputs).toHaveLength(2);
		for (const cb of leafInputs) {
			expect(cb).toBeDisabled();
		}
	});

	it('does not disable leaf cells when disablesRow is false', () => {
		render(
			<Matrix
				caption="Permissions"
				rows={[rows[0]]}
				master={{ id: 'enabled', label: 'Enabled', disablesRow: false }}
				columns={flatColumns}
				value={new Set()}
				onChange={() => {}}
			/>,
		);

		const allInputs = screen.getAllByRole('checkbox');
		const leafInputs = allInputs.filter(
			(el) => !el.getAttribute('aria-label')?.startsWith('Enabled —'),
		);
		for (const cb of leafInputs) {
			expect(cb).not.toBeDisabled();
		}
	});

	it('master cell uses the same selection Set as leaf cells', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<Matrix
				caption="Permissions"
				rows={[rows[0]]}
				master={{ id: 'enabled', label: 'Enabled' }}
				columns={flatColumns}
				value={new Set()}
				onChange={onChange}
			/>,
		);

		const masterToggle = screen.getByRole('checkbox', { name: /Enabled — Alice/ });
		await user.click(masterToggle);
		expect(onChange).toHaveBeenCalledTimes(1);
		const [, change] = onChange.mock.calls[0] as [unknown, MatrixChange];
		expect(change).toEqual({ rowId: 'u1', colId: 'enabled', checked: true });
	});
});

describe('Matrix — render overrides', () => {
	it('renderRowHeader replaces the default row-header layout', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={flatColumns}
				value={new Set()}
				onChange={() => {}}
				renderRowHeader={(row) => <span data-testid="custom">{row.id}</span>}
			/>,
		);

		expect(screen.getByTestId('custom')).toHaveTextContent('u1');
		expect(screen.queryByText('alice@example.com')).toBeNull();
	});

	it('renderGroupSummary replaces the default summary cell', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				groups={[groups[0]]}
				value={new Set(['u1::create', 'u1::edit'])}
				onChange={() => {}}
				renderGroupSummary={(ctx) => <em>all-{ctx.selectedCount}</em>}
			/>,
		);

		expect(screen.getByText('all-2')).toBeInTheDocument();
	});

	it('renderCell replaces the default checkbox/toggle', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={[flatColumns[0]]}
				value={new Set()}
				onChange={() => {}}
				renderCell={(ctx) => <span data-testid="cc">{ctx.checked ? 'on' : 'off'}</span>}
			/>,
		);

		const cell = screen.getByTestId('cc');
		expect(cell).toHaveTextContent('off');
	});
});

describe('Matrix — variant=toggle', () => {
	it('renders toggles instead of checkboxes', () => {
		render(
			<Matrix
				caption="X"
				rows={[rows[0]]}
				columns={[flatColumns[0]]}
				value={new Set()}
				onChange={() => {}}
				variant="toggle"
			/>,
		);

		// ToggleControl renders a checkbox-role input under the hood.
		const inputs = screen.getAllByRole('checkbox');
		expect(inputs).toHaveLength(1);
	});
});

describe('Matrix — caption a11y', () => {
	it('renders the caption inside the table for screen readers', () => {
		render(
			<Matrix
				caption="My grid"
				rows={[rows[0]]}
				columns={flatColumns}
				value={new Set()}
				onChange={() => {}}
			/>,
		);

		const table = screen.getByRole('table');
		expect(within(table).getByText('My grid')).toBeInTheDocument();
	});
});
