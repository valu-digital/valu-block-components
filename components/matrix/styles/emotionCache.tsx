import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

/**
 * Emotion cache scoped to the Matrix component.
 *
 * Same pattern as ContentPicker — captures the owning document via a
 * callback ref so styles reach the iframe head when the component is rendered
 * inside the WordPress site editor.
 */
export const EmotionCacheProvider = ({ children }: { children: ReactNode }) => {
	const [head, setHead] = useState<HTMLElement | null>(null);

	const captureDocument = useCallback((node: HTMLDivElement | null) => {
		if (!node) return;
		const owner = node.ownerDocument ?? document;
		setHead((prev) => (prev === owner.head ? prev : (owner.head as HTMLElement)));
	}, []);

	const cache = useMemo(() => {
		if (!head) return null;
		return createCache({ key: 'valu-mx', container: head, prepend: true });
	}, [head]);

	if (!cache) {
		return <div ref={captureDocument} style={{ display: 'contents' }} />;
	}

	return (
		<CacheProvider value={cache}>
			<div ref={captureDocument} style={{ display: 'contents' }}>
				{children}
			</div>
		</CacheProvider>
	);
};
