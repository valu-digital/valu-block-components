import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { collectUseSelectWarnings, createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { useResolvedDocuments } from '../hooks/useResolvedDocuments';
import type { DocumentItem } from '../types';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));

const doc = (id: number): DocumentItem => ({
	key: `doc-${id}`,
	id,
	title: `Stored title ${id}`,
	filename: `stored-${id}.pdf`,
	url: `/stored-${id}.pdf`,
	mimeType: 'application/pdf',
	extension: 'PDF',
});

describe('useResolvedDocuments', () => {
	const useSelectWarnings = collectUseSelectWarnings();

	it('returns stable values to useSelect while documents are resolving', () => {
		const { wrapper } = createCoreRegistry();
		const value = [doc(1), doc(2)];

		const { result } = renderHook(() => useResolvedDocuments(value), { wrapper });

		expect(result.current).toEqual(value);
		expect(useSelectWarnings()).toEqual([]);
	});

	it('returns stable values to useSelect once documents are resolved', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'attachment', 1, {
			id: 1,
			title: { rendered: 'Annual report' },
			source_url: '/uploads/annual-report.docx',
			mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		});

		const { result } = renderHook(() => useResolvedDocuments([doc(1)]), { wrapper });

		expect(result.current[0]).toMatchObject({
			title: 'Annual report',
			url: '/uploads/annual-report.docx',
			extension: 'DOCX',
		});
		expect(useSelectWarnings()).toEqual([]);
	});

	it('flags a document as deleted when resolution finds no record', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'attachment', 3);

		const { result } = renderHook(() => useResolvedDocuments([doc(3)]), { wrapper });

		expect(result.current[0]).toMatchObject({ id: 3, missing: 'deleted' });
	});

	it('flags a document as deleted when the REST API answers 404', () => {
		const { fail, wrapper } = createCoreRegistry();
		fail('postType', 'attachment', 4, 404);

		const { result } = renderHook(() => useResolvedDocuments([doc(4)]), { wrapper });

		expect(result.current[0]).toMatchObject({ id: 4, missing: 'deleted' });
	});

	it('flags a document the user may not read as restricted', () => {
		const { fail, wrapper } = createCoreRegistry();
		fail('postType', 'attachment', 5, 403);

		const { result } = renderHook(() => useResolvedDocuments([doc(5)]), { wrapper });

		expect(result.current[0]).toMatchObject({ id: 5, missing: 'restricted' });
		expect(useSelectWarnings()).toEqual([]);
	});
});
