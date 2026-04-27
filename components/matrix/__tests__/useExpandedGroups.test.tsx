import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useExpandedGroups } from '../hooks/useExpandedGroups';

describe('useExpandedGroups (uncontrolled)', () => {
	it('starts from defaultExpanded', () => {
		const { result } = renderHook(() =>
			useExpandedGroups({ defaultExpanded: new Set(['a']) }),
		);
		expect(result.current.isExpanded('a')).toBe(true);
		expect(result.current.isExpanded('b')).toBe(false);
	});

	it('toggle flips a group', () => {
		const { result } = renderHook(() => useExpandedGroups({}));
		act(() => result.current.toggle('a'));
		expect(result.current.isExpanded('a')).toBe(true);
		act(() => result.current.toggle('a'));
		expect(result.current.isExpanded('a')).toBe(false);
	});

	it('expand and collapse are no-ops when already in that state', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useExpandedGroups({ defaultExpanded: new Set(['a']), onChange }),
		);
		act(() => result.current.expand('a'));
		expect(onChange).not.toHaveBeenCalled();
		act(() => result.current.collapse('b'));
		expect(onChange).not.toHaveBeenCalled();
	});
});

describe('useExpandedGroups (controlled)', () => {
	it('reads from the controlled prop and never updates internally', () => {
		const onChange = vi.fn();
		const { result, rerender } = renderHook(
			({ expanded }: { expanded: ReadonlySet<string> }) =>
				useExpandedGroups({ expanded, onChange }),
			{ initialProps: { expanded: new Set<string>(['a']) } },
		);
		expect(result.current.isExpanded('a')).toBe(true);

		act(() => result.current.toggle('a'));
		// Controlled: callback fires, internal state doesn't change.
		expect(onChange).toHaveBeenCalledTimes(1);
		const next = onChange.mock.calls[0][0] as ReadonlySet<string>;
		expect(next.has('a')).toBe(false);

		// Until the consumer re-renders with a new value, our view of state matches the prop.
		expect(result.current.isExpanded('a')).toBe(true);

		rerender({ expanded: next });
		expect(result.current.isExpanded('a')).toBe(false);
	});
});
