import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { collectUseSelectWarnings, createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { useTypeLabel, useTypeLabels } from '../hooks/useTypeLabels';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));

describe('useTypeLabels', () => {
	const useSelectWarnings = collectUseSelectWarnings();

	it('uses the registered name of a post type', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('root', 'postType', 'page', { name: 'Sivut' });
		const types = ['page'];

		const { result } = renderHook(() => useTypeLabels(types, 'post'), { wrapper });

		expect(result.current.page).toBe('Sivut');
		expect(useSelectWarnings()).toEqual([]);
	});

	it('uses the registered name of a taxonomy', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('root', 'taxonomy', 'post_tag', { name: 'Avainsanat' });

		const { result } = renderHook(() => useTypeLabel('post_tag', 'term'), { wrapper });

		expect(result.current).toBe('Avainsanat');
	});

	it('reads the name in the view context', () => {
		const { resolve, wrapper } = createCoreRegistry();
		// The edit context answers 403 for types the user can't edit.
		resolve('root', 'postType', 'contact', { name: 'Edit only' }, 'edit');
		resolve('root', 'postType', 'contact', { name: 'Yhteystiedot' });

		const { result } = renderHook(() => useTypeLabel('contact', 'post'), { wrapper });

		expect(result.current).toBe('Yhteystiedot');
	});

	it('falls back to a name from the slug while the labels load', () => {
		const { wrapper } = createCoreRegistry();
		const types = ['case_study'];

		const { result } = renderHook(() => useTypeLabels(types, 'post'), { wrapper });

		expect(result.current.case_study).toBe('Case Study');
		expect(useSelectWarnings()).toEqual([]);
	});

	it('falls back when the type can not be read', () => {
		const { fail, wrapper } = createCoreRegistry();
		fail('root', 'postType', 'secret', 404);

		const { result } = renderHook(() => useTypeLabel('secret', 'post'), { wrapper });

		expect(result.current).toBe('Secret');
	});

	it('names users without a lookup', () => {
		const { wrapper } = createCoreRegistry();

		const { result } = renderHook(() => useTypeLabel('user', 'user'), { wrapper });

		expect(result.current).toBe('Users');
	});
});
