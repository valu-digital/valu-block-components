import { afterEach, beforeEach, vi, type MockInstance } from 'vitest';
import type { ReactNode } from 'react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * A stand-in for the core-data store with the selectors the resolve hooks use.
 * The real package pulls in @wordpress/blocks, which doesn't load under vitest.
 * Use it with `vi.mock('@wordpress/core-data', () => import('…/fakeCoreData'))`.
 *
 * The resolver never settles, so a record stays unresolved until a test
 * resolves it with `resolve()`.
 */
type State = Record<string, unknown>;

export const store = createReduxStore('core', {
	reducer: (state: State = {}, action: { type: string; key?: string; record?: unknown }) =>
		action.type === 'RECEIVE' && action.key ? { ...state, [action.key]: action.record } : state,
	actions: {
		receive: (key: string, record: unknown) => ({ type: 'RECEIVE', key, record }),
	},
	selectors: {
		getEntityRecord: (state: State, kind: string, name: string, id: number) =>
			state[`${kind}:${name}:${id}`],
	},
	resolvers: {
		getEntityRecord: () => () => new Promise(() => {}),
	},
});

export const createCoreRegistry = () => {
	const registry = createRegistry();
	registry.register(store);

	/** Finish resolving a record, as found (`record`) or as not found. */
	const resolve = (kind: string, name: string, id: number, record?: object) => {
		if (record) registry.dispatch(store).receive(`${kind}:${name}:${id}`, record);
		registry.dispatch(store).finishResolution('getEntityRecord', [kind, name, id]);
	};

	const wrapper = ({ children }: { children: ReactNode }) => (
		<RegistryProvider value={registry}>{children}</RegistryProvider>
	);

	return { resolve, wrapper };
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
