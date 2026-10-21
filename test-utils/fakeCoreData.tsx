import { afterEach, beforeEach, vi, type MockInstance } from 'vitest';
import type { ReactNode } from 'react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * A stand-in for the core-data store with the selectors the resolve hooks use.
 * The real package pulls in @wordpress/blocks, which doesn't load under vitest.
 * Use it with `vi.mock('@wordpress/core-data', () => import('…/fakeCoreData'))`.
 *
 * The resolver never settles, so a record stays unresolved until a test
 * resolves it with `resolve()` or `fail()`.
 *
 * Like core-data, it keeps records per REST context. Only the context of a
 * query counts here, so a test doesn't repeat the hook's `_fields`.
 */
type State = Record<string, unknown>;

const getEntityRecord = (
	state: State,
	kind: string,
	name: string,
	id: number | string,
	context: string,
) => state[`${kind}:${name}:${id}:${context}`];

// @wordpress/data may normalize the same arguments twice, so leave a context
// as it is.
getEntityRecord.__unstableNormalizeArgs = ([kind, name, id, query]: unknown[]) => [
	kind,
	name,
	id,
	typeof query === 'string' ? query : ((query as { context?: string })?.context ?? 'edit'),
];

export const store = createReduxStore('core', {
	reducer: (state: State = {}, action: { type: string; key?: string; record?: unknown }) =>
		action.type === 'RECEIVE' && action.key ? { ...state, [action.key]: action.record } : state,
	actions: {
		receive: (key: string, record: unknown) => ({ type: 'RECEIVE', key, record }),
	},
	selectors: { getEntityRecord },
	resolvers: {
		getEntityRecord: () => () => new Promise(() => {}),
	},
});

/** The context the pickers read records in. */
const VIEW = 'view';

export const createCoreRegistry = () => {
	const registry = createRegistry();
	registry.register(store);

	/** Finish resolving a record, as found (`record`) or as not found. */
	const resolve = (
		kind: string,
		name: string,
		id: number | string,
		record?: object,
		context = VIEW,
	) => {
		if (record) registry.dispatch(store).receive(`${kind}:${name}:${id}:${context}`, record);
		registry.dispatch(store).finishResolution('getEntityRecord', [kind, name, id, context]);
	};

	/** Fail resolving a record as the REST API does, with an HTTP status. */
	const fail = (
		kind: string,
		name: string,
		id: number | string,
		status: number,
		context = VIEW,
	) => {
		registry
			.dispatch(store)
			.failResolution('getEntityRecord', [kind, name, id, context], { status });
	};

	const wrapper = ({ children }: { children: ReactNode }) => (
		<RegistryProvider value={registry}>{children}</RegistryProvider>
	);

	return { resolve, fail, wrapper };
};

/**
 * Turn on useSelect's check for unstable return values (it only runs under
 * SCRIPT_DEBUG) and collect the warnings it logs.
 */
export const collectUseSelectWarnings = () => {
	let warn: MockInstance<typeof console.warn>;

	beforeEach(() => {
		(globalThis as { SCRIPT_DEBUG?: boolean }).SCRIPT_DEBUG = true;
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		delete (globalThis as { SCRIPT_DEBUG?: boolean }).SCRIPT_DEBUG;
		warn.mockRestore();
	});

	return () => warn.mock.calls.filter(([message]) => String(message).includes('useSelect'));
};
