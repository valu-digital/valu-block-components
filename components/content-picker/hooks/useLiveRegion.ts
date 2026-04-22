import { useCallback, useEffect, useRef } from 'react';
import { speak } from '@wordpress/a11y';

/**
 * Debounced screen-reader announcements. Prevents spam while a user is
 * typing quickly (each keystroke would otherwise trigger a new "N results").
 */
export const useLiveRegion = (debounceMs = 500) => {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const announce = useCallback(
		(message: string, assertiveness: 'polite' | 'assertive' = 'polite') => {
			if (!message) return;
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => speak(message, assertiveness), debounceMs);
		},
		[debounceMs],
	);

	const announceImmediate = useCallback(
		(message: string, assertiveness: 'polite' | 'assertive' = 'polite') => {
			if (!message) return;
			if (timer.current) clearTimeout(timer.current);
			speak(message, assertiveness);
		},
		[],
	);

	return { announce, announceImmediate };
};
