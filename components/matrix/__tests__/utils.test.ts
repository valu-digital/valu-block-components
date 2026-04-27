import { describe, expect, it } from 'vitest';

import { cellKey, defaultLabels, normalizeGroups, selectionByRow, toggleCell } from '../utils';
import type { MatrixColumn, MatrixColumnGroup } from '../types';

describe('cellKey', () => {
	it('joins ids with `::`', () => {
		expect(cellKey('row-1', 'col-a')).toBe('row-1::col-a');
	});
});

describe('selectionByRow', () => {
	it('returns only column ids that belong to the row', () => {
		const set = new Set([
			'row-1::a',
			'row-1::b',
			'row-2::a',
			'row-3::a',
		]);
		const cols = selectionByRow(set, 'row-1').sort();
		expect(cols).toEqual(['a', 'b']);
	});

	it('returns an empty list when nothing is selected for the row', () => {
		const set = new Set(['row-1::a']);
		expect(selectionByRow(set, 'row-2')).toEqual([]);
	});

	it('does not match a row whose id is a prefix of another id', () => {
		const set = new Set(['row-10::a', 'row-1::b']);
		expect(selectionByRow(set, 'row-1').sort()).toEqual(['b']);
	});
});

describe('toggleCell', () => {
	it('adds when checked is true', () => {
		const next = toggleCell(new Set(), 'r', 'c', true);
		expect(next.has('r::c')).toBe(true);
	});

	it('removes when checked is false', () => {
		const next = toggleCell(new Set(['r::c']), 'r', 'c', false);
		expect(next.has('r::c')).toBe(false);
	});

	it('returns a new Set instance even when nothing changed', () => {
		const before = new Set(['r::c']);
		const after = toggleCell(before, 'r', 'c', true);
		expect(after).not.toBe(before);
		expect(after.has('r::c')).toBe(true);
	});
});

describe('normalizeGroups', () => {
	it('wraps a flat columns prop in one synthetic non-collapsible group', () => {
		const columns: MatrixColumn[] = [
			{ id: 'a', label: 'A' },
			{ id: 'b', label: 'B' },
		];
		const { groups, flat } = normalizeGroups({ columns });
		expect(flat).toBe(true);
		expect(groups).toHaveLength(1);
		expect(groups[0].columns).toBe(columns);
		expect(groups[0].collapsible).toBe(false);
	});

	it('passes a real groups prop through unchanged', () => {
		const groups: MatrixColumnGroup[] = [
			{ id: 'g', label: 'G', columns: [{ id: 'a', label: 'A' }] },
		];
		const out = normalizeGroups({ groups });
		expect(out.flat).toBe(false);
		expect(out.groups).toBe(groups);
	});
});

describe('defaultLabels', () => {
	it('fills missing keys with English defaults', () => {
		const labels = defaultLabels();
		expect(labels.expandGroup).toBe('Expand group');
		expect(labels.groupSummary(2, 5)).toBe('2 / 5');
		expect(labels.cellToggled('Alice', 'Edit', true)).toContain('added');
		expect(labels.cellToggled('Alice', 'Edit', false)).toContain('removed');
	});

	it('respects overrides', () => {
		const labels = defaultLabels({
			expandGroup: 'Open',
			groupSummary: (s, t) => `${s} of ${t}`,
		});
		expect(labels.expandGroup).toBe('Open');
		expect(labels.groupSummary(1, 3)).toBe('1 of 3');
		// Untouched key still has its default.
		expect(labels.collapseGroup).toBe('Collapse group');
	});
});
