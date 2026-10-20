import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { collectUseSelectWarnings, createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { useTypeLabel, useTypeLabels } from '../hooks/useTypeLabels';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));

describe('useTypeLabels', () => {
	const useSelectWarnings = collectUseSelectWarnings();

	it('uses the registered labels of a post type', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('root', 'postType', 'page', { labels: { name: 'Sivut', singular_name: 'Sivu' } });
		const types = ['page'];

		const { result } = renderHook(() => useTypeLabels(types, 'post'), { wrapper });

		expect(result.current.page).toEqual({ singular: 'Sivu', plural: 'Sivut' });
		expect(useSelectWarnings()).toEqual([]);
	});

	it('uses the registered labels of a taxonomy', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('root', 'taxonomy', 'post_tag', {
			labels: { name: 'Avainsanat', singular_name: 'Avainsana' },
		});

		const { result } = renderHook(() => useTypeLabel('post_tag', 'term'), { wrapper });

		expect(result.current).toEqual({ singular: 'Avainsana', plural: 'Avainsanat' });
	});

	it('falls back to a name from the slug while the labels load', () => {
		const { wrapper } = createCoreRegistry();
		const types = ['case_study'];

		const { result } = renderHook(() => useTypeLabels(types, 'post'), { wrapper });

		expect(result.current.case_study).toEqual({ singular: 'Case Study', plural: 'Case Study' });
		expect(useSelectWarnings()).toEqual([]);
	});

	it('falls back when the type can not be read', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('root', 'postType', 'secret');

		const { result } = renderHook(() => useTypeLabel('secret', 'post'), { wrapper });

		expect(result.current).toEqual({ singular: 'Secret', plural: 'Secret' });
	});

	it('names users without a lookup', () => {
		const { wrapper } = createCoreRegistry();

		const { result } = renderHook(() => useTypeLabel('user', 'user'), { wrapper });

		expect(result.current).toEqual({ singular: 'User', plural: 'User' });
	});
});
