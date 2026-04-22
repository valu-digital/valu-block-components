import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useKeyboardNav } from '../hooks/useKeyboardNav';

const keyEvent = (key: string) =>
	({
		key,
		preventDefault: vi.fn(),
	}) as unknown as React.KeyboardEvent;

describe('useKeyboardNav', () => {
	it('starts with no item highlighted', () => {
		const { result } = renderHook(() => useKeyboardNav({ itemCount: 3 }));
		expect(result.current.highlightedIndex).toBe(-1);
	});

	it('ArrowDown moves highlight forward and wraps', () => {
		const { result } = renderHook(() => useKeyboardNav({ itemCount: 2, wrap: true }));
		act(() => result.current.handleKeyDown(keyEvent('ArrowDown')));
		expect(result.current.highlightedIndex).toBe(0);
		act(() => result.current.handleKeyDown(keyEvent('ArrowDown')));
		expect(result.current.highlightedIndex).toBe(1);
		act(() => result.current.handleKeyDown(keyEvent('ArrowDown')));
		expect(result.current.highlightedIndex).toBe(0);
	});

	it('ArrowUp wraps from 0 to last', () => {
		const { result } = renderHook(() => useKeyboardNav({ itemCount: 3, wrap: true }));
		act(() => result.current.handleKeyDown(keyEvent('ArrowUp')));
		expect(result.current.highlightedIndex).toBe(2);
	});

	it('Home / End jump to boundaries', () => {
		const { result } = renderHook(() => useKeyboardNav({ itemCount: 5 }));
		act(() => result.current.handleKeyDown(keyEvent('End')));
		expect(result.current.highlightedIndex).toBe(4);
		act(() => result.current.handleKeyDown(keyEvent('Home')));
		expect(result.current.highlightedIndex).toBe(0);
	});

	it('Enter calls onSelect with highlighted index', () => {
		const onSelect = vi.fn();
		const { result } = renderHook(() => useKeyboardNav({ itemCount: 3, onSelect }));
		act(() => result.current.handleKeyDown(keyEvent('ArrowDown')));
		act(() => result.current.handleKeyDown(keyEvent('Enter')));
		expect(onSelect).toHaveBeenCalledWith(0);
	});

	it('Escape calls onEscape', () => {
		const onEscape = vi.fn();
		const { result } = renderHook(() =>
			useKeyboardNav({ itemCount: 3, onEscape }),
		);
		act(() => result.current.handleKeyDown(keyEvent('Escape')));
		expect(onEscape).toHaveBeenCalled();
	});

	it('resets the highlight', () => {
		const { result } = renderHook(() => useKeyboardNav({ itemCount: 3 }));
		act(() => result.current.handleKeyDown(keyEvent('End')));
		act(() => result.current.reset());
		expect(result.current.highlightedIndex).toBe(-1);
	});
});
