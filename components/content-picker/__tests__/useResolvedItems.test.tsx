import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { collectUseSelectWarnings, createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { useResolvedItems } from '../hooks/useResolvedItems';
import type { ContentItem } from '../types';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));

const page = (id: number): ContentItem => ({
	key: `post:page:${id}`,
	id,
	type: 'page',
	kind: 'post',
	title: `Stored title ${id}`,
});

describe('useResolvedItems', () => {
	const useSelectWarnings = collectUseSelectWarnings();

	it('returns stable values to useSelect while items are resolving', () => {
		const { wrapper } = createCoreRegistry();
		const value = [page(1), page(2)];

		const { result } = renderHook(() => useResolvedItems(value), { wrapper });

		expect(result.current).toEqual(value);
		expect(useSelectWarnings()).toEqual([]);
	});

	it('returns stable values to useSelect once items are resolved', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'page', 1, {
			id: 1,
			title: { rendered: 'Fresh &amp; new' },
			status: 'publish',
			link: '/fresh',
		});

		const { result } = renderHook(() => useResolvedItems([page(1)]), { wrapper });

		expect(result.current[0]).toMatchObject({ title: 'Fresh & new', url: '/fresh' });
		expect(useSelectWarnings()).toEqual([]);
	});

	it('flags an item as deleted when resolution finds no record', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'page', 3);

		const { result } = renderHook(() => useResolvedItems([page(3)]), { wrapper });

		expect(result.current[0]).toMatchObject({ id: 3, missing: 'deleted' });
	});

	it('flags a trashed item', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'page', 4, { id: 4, title: { rendered: 'Gone' }, status: 'trash' });

		const { result } = renderHook(() => useResolvedItems([page(4)]), { wrapper });

		expect(result.current[0]).toMatchObject({ missing: 'trash', status: 'trash' });
	});
});
