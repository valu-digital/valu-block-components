import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Active, Over } from '@dnd-kit/core';

import { useSortableAnnouncements } from '../hooks/useSortableAnnouncements';

const keys = ['k1', 'k2', 'k3'];
const names: Record<string, string> = { k1: 'First', k2: 'Second', k3: 'Third' };
const nameOf = (key: string) => names[key];

const active = { id: 'k1' } as Active;
const over = (id: string) => ({ id }) as Over;

describe('useSortableAnnouncements', () => {
	it('names the dragged item and its position', () => {
		const { result } = renderHook(() => useSortableAnnouncements(keys, nameOf));
		const { announcements } = result.current;

		expect(announcements.onDragStart({ active })).toBe('Picked up First at position 1 of 3.');
		expect(announcements.onDragOver({ active, over: over('k2') })).toBe(
			'First is over position 2 of 3.',
		);
		expect(announcements.onDragEnd({ active, over: over('k3') })).toBe(
			'Dropped First at position 3 of 3.',
		);
		expect(announcements.onDragCancel({ active, over: null })).toBe(
			'Moving First was cancelled.',
		);
	});
});
