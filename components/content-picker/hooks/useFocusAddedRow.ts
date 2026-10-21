import { useCallback, useEffect, useRef, type RefObject } from 'react';

import { removeButtonId } from '../utils';

interface Row {
	key: string;
	id: number;
	kind?: string;
	type?: string;
}

const isSameEntity = (a: Row, b: Row): boolean =>
	a.id === b.id && a.kind === b.kind && a.type === b.type;

/**
 * Focus the remove button of an added row once the row renders. Returns the
 * function to call with the added item.
 *
 * Finds the row by entity, not by key: a controlled parent may re-key the
 * items it gets from `onChange`, e.g. as `key: String( id )`.
 */
export const useFocusAddedRow = <T extends Row>(
	rootRef: RefObject<HTMLElement | null>,
	rootId: string,
	value: T[],
): ((added: T) => void) => {
	const pending = useRef<T | null>(null);

	useEffect(() => {
		const added = pending.current;
		pending.current = null;
		if (!added) {
			return;
		}
		// Added items go last, so look from the end in case the same entity
		// was picked twice.
		const row = value.findLast((item) => isSameEntity(item, added));
		if (row) {
			rootRef.current?.ownerDocument.getElementById(removeButtonId(rootId, row.key))?.focus();
		}
	}, [value, rootRef, rootId]);

	return useCallback((added: T) => {
		pending.current = added;
	}, []);
};
