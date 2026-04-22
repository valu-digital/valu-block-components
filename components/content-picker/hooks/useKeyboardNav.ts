import { useCallback, useState, type KeyboardEvent } from 'react';

export interface KeyboardNavApi {
	highlightedIndex: number;
	setHighlightedIndex: (i: number) => void;
	reset: () => void;
	handleKeyDown: (event: KeyboardEvent) => void;
}

export interface UseKeyboardNavArgs {
	itemCount: number;
	onSelect?: (index: number) => void;
	onEscape?: () => void;
	/** When true, up/down keys wrap at boundaries. */
	wrap?: boolean;
}

/**
 * Shared keyboard-navigation state machine for suggestion lists.
 *
 * Arrow Down / Up  — move highlight (with optional wrap)
 * Home / End       — jump to first / last
 * Enter            — onSelect(highlightedIndex) if >= 0
 * Escape           — onEscape()
 */
export const useKeyboardNav = ({
	itemCount,
	onSelect,
	onEscape,
	wrap = true,
}: UseKeyboardNavArgs): KeyboardNavApi => {
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	const reset = useCallback(() => setHighlightedIndex(-1), []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (itemCount === 0) {
				if (event.key === 'Escape') {
					event.preventDefault();
					onEscape?.();
				}
				return;
			}
			switch (event.key) {
				case 'ArrowDown': {
					event.preventDefault();
					setHighlightedIndex((i) => {
						const next = i + 1;
						if (next >= itemCount) return wrap ? 0 : itemCount - 1;
						return next;
					});
					break;
				}
				case 'ArrowUp': {
					event.preventDefault();
					setHighlightedIndex((i) => {
						if (i <= 0) return wrap ? itemCount - 1 : 0;
						return i - 1;
					});
					break;
				}
				case 'Home': {
					event.preventDefault();
					setHighlightedIndex(0);
					break;
				}
				case 'End': {
					event.preventDefault();
					setHighlightedIndex(itemCount - 1);
					break;
				}
				case 'Enter': {
					if (highlightedIndex >= 0 && highlightedIndex < itemCount) {
						event.preventDefault();
						onSelect?.(highlightedIndex);
					}
					break;
				}
				case 'Escape': {
					event.preventDefault();
					onEscape?.();
					break;
				}
				default:
					break;
			}
		},
		[itemCount, highlightedIndex, onSelect, onEscape, wrap],
	);

	return { highlightedIndex, setHighlightedIndex, reset, handleKeyDown };
};
