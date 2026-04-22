import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

/**
 * Creates an Emotion cache scoped to this component.
 *
 * Two reasons this exists:
 *
 * 1. The WordPress site editor renders blocks inside an iframe. The default
 *    Emotion cache targets `document.head` of the top frame, so styles
 *    never reach the iframe. We capture the owning document via a callback
 *    ref and build the cache pointing at the correct `<head>`.
 * 2. A unique cache key per component prevents class-name collisions with
 *    a consumer's own Emotion instance.
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
		return createCache({ key: 'valu-cp', container: head, prepend: true });
	}, [head]);

	if (!cache) {
		// First render: emit a hidden probe so we can read ownerDocument. No
		// styled content has a chance to render yet, so nothing ends up in
		// the wrong head.
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
