/** The core-data selectors `selectRecord` reads. */
interface CoreSelectors {
	getEntityRecord: (kind: string, name: string, key: number, query: object) => unknown;
	hasFinishedResolution: (selectorName: 'getEntityRecord', args: unknown[]) => boolean;
	getResolutionError: (selectorName: 'getEntityRecord', args: unknown[]) => unknown;
}

/**
 * Why a record can't be shown: it doesn't exist, or the REST API refuses it
 * to the user, e.g. a draft by another user.
 */
export type UnavailableReason = 'deleted' | 'restricted';

/**
 * HTTP status of a failed request. core-data fetches records with
 * `parse: false`, so api-fetch throws the `Response`; older versions threw
 * the parsed error body, which has the status in `data`.
 */
const errorStatus = (error: unknown): number | undefined => {
	if (!error || typeof error !== 'object') {
		return undefined;
	}
	const { status, data } = error as { status?: unknown; data?: { status?: unknown } };
	const code = status ?? data?.status;
	return typeof code === 'number' ? code : undefined;
};

/**
 * Look up an entity record in core-data. Returns `undefined` while it
 * resolves, the record once found, or why it can't be shown.
 *
 * Pass `query` with `context: 'view'`. core-data asks for the edit context
 * by default, which answers 403 for items the user can read but not edit,
 * such as a published post by another user. Pass a constant: core-data
 * memoizes a record read with `_fields` by the query's identity, and
 * useSelect needs the same object back while the store doesn't change.
 */
export const selectRecord = <T>(
	core: CoreSelectors,
	kind: string,
	name: string,
	id: number,
	query: object,
): T | UnavailableReason | undefined => {
	const record = core.getEntityRecord(kind, name, id, query);
	if (record) {
		return record as T;
	}
	const args = [kind, name, id, query];
	if (!core.hasFinishedResolution('getEntityRecord', args)) {
		return undefined;
	}
	const status = errorStatus(core.getResolutionError('getEntityRecord', args));
	return status === 401 || status === 403 ? 'restricted' : 'deleted';
};
