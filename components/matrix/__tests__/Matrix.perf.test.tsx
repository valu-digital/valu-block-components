/**
 * Large-grid smoke + timing for ~150 columns × 200 rows (30,000 cells).
 *
 * Off by default: rendering 30k WP controls in happy-dom takes seconds and
 * would slow the normal suite. Run it with
 *
 *     NODE_OPTIONS=--max-old-space-size=8192 MATRIX_PERF=1 \
 *         npx vitest run components/matrix/__tests__/Matrix.perf.test.tsx
 *
 * The extra heap is for happy-dom: 30k WP CheckboxControls exceed Node's
 * default heap there (a browser handles it fine).
 *
 * Timings are printed so they can be recorded in the readme's
 * "Performance" section. The assertions only guard against pathological
 * regressions (e.g. accidental O(cells²) work), not absolute speed.
 */
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';

import { Matrix } from '../Matrix';
import type { MatrixColumnGroup, MatrixRow } from '../types';

const ROWS = 200;
const GROUPS = 15;
const COLS_PER_GROUP = 10; // 150 columns

const rows: MatrixRow[] = Array.from({ length: ROWS }, (_, i) => ({
	id: `u${i}`,
	label: `User ${i}`,
}));

const groups: MatrixColumnGroup[] = Array.from({ length: GROUPS }, (_, g) => ({
	id: `g${g}`,
	label: `Group ${g}`,
	columns: Array.from({ length: COLS_PER_GROUP }, (_, c) => ({
		id: `g${g}c${c}`,
		label: `Ability ${g}.${c}`,
	})),
}));

const allGroupIds = new Set(groups.map((g) => g.id));

const baseline = new Set<string>();
const value = new Set<string>();
rows.forEach((r, i) =>
	groups.forEach((g) =>
		g.columns.forEach((c, j) => {
			if ((i + j) % 3 === 0) baseline.add(`${r.id}::${c.id}`);
			if ((i + j) % 4 === 0) value.add(`${r.id}::${c.id}`);
		}),
	),
);

const run = process.env.MATRIX_PERF ? describe : describe.skip;

run('Matrix — 150 × 200 performance', () => {
	it('renders collapsed (summary cells only)', () => {
		const t0 = performance.now();
		const { unmount } = render(
			<Matrix
				caption="Perf"
				rows={rows}
				groups={groups}
				value={value}
				baseline={baseline}
				onChange={() => {}}
				selectableRows
				selectedRows={new Set()}
				getRowStatus={() => ({ status: 'idle' })}
			/>,
		);
		const ms = performance.now() - t0;
		process.stdout.write(
			`[matrix perf] collapsed 15 groups × 200 rows: ${ms.toFixed(0)} ms` + '\n',
		);
		unmount();
		expect(ms).toBeLessThan(20_000);
	});

	it('renders fully expanded and re-renders after one toggle', () => {
		const props = {
			caption: 'Perf',
			rows,
			groups,
			baseline,
			onChange: () => {},
			expanded: allGroupIds,
			getCellState: (_r: string, c: string) =>
				c.endsWith('c9') ? { disabled: true, reason: 'Locked' } : undefined,
		};
		const t0 = performance.now();
		const { rerender, container, unmount } = render(<Matrix {...props} value={value} />);
		const mount = performance.now() - t0;

		expect(
			container.querySelectorAll('td[data-diff], td:not([data-diff])').length,
		).toBeGreaterThan(ROWS * GROUPS * COLS_PER_GROUP);

		const next = new Set(value);
		next.add('u0::g0c1');
		const t1 = performance.now();
		act(() => {
			rerender(<Matrix {...props} value={next} />);
		});
		const update = performance.now() - t1;

		process.stdout.write(
			`[matrix perf] expanded 150 cols × 200 rows (30k cells): mount ${mount.toFixed(0)} ms, ` +
				`re-render after one toggle ${update.toFixed(0)} ms` +
				'\n',
		);
		unmount();
		expect(mount).toBeLessThan(120_000);
	}, 180_000);

	it('expanded with a plain renderCell (control cost baseline)', () => {
		const t0 = performance.now();
		const { unmount } = render(
			<Matrix
				caption="Perf"
				rows={rows}
				groups={groups}
				value={value}
				baseline={baseline}
				onChange={() => {}}
				expanded={allGroupIds}
				renderCell={(ctx) => (
					<input
						type="checkbox"
						checked={ctx.checked}
						onChange={(e) => ctx.toggle(e.currentTarget.checked)}
					/>
				)}
			/>,
		);
		const ms = performance.now() - t0;
		process.stdout.write(
			`[matrix perf] expanded 30k cells, native input renderCell: ${ms.toFixed(0)} ms\n`,
		);
		unmount();
		expect(ms).toBeLessThan(120_000);
	}, 180_000);
});
