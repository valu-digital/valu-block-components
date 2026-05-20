import { afterEach, describe, expect, it, vi } from 'vitest';

type FetchMock = ReturnType<typeof vi.fn>;

let apiFetchMock: FetchMock = vi.fn();

vi.mock('@wordpress/api-fetch', () => ({
	default: (args: unknown) => apiFetchMock(args),
}));

vi.mock('@wordpress/url', () => ({
	addQueryArgs: (path: string, args: Record<string, unknown>) => {
		const params = new URLSearchParams();
		for (const [k, v] of Object.entries(args)) {
			if (Array.isArray(v)) {
				for (const entry of v) params.append(`${k}[]`, String(entry));
			} else {
				params.append(k, String(v));
			}
		}
		return `${path}?${params.toString()}`;
	},
}));

vi.mock('@wordpress/html-entities', () => ({
	decodeEntities: (s: string) => s,
}));

vi.mock('@wordpress/i18n', () => ({
	__: (s: string) => s,
}));

const { fetchDocuments } = await import('../api/fetchDocuments');

const jsonResponse = (data: unknown, totalPages = 1, total = 0): Response =>
	({
		json: () => Promise.resolve(data),
		headers: new Headers({
			'x-wp-totalpages': String(totalPages),
			'x-wp-total': String(total),
		}),
	}) as unknown as Response;

afterEach(() => {
	apiFetchMock = vi.fn();
});

describe('fetchDocuments', () => {
	it('targets /wp/v2/media with search + comma-separated mime params', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 1));
		await fetchDocuments({
			query: 'annual',
			page: 1,
			perPage: 10,
			mimeTypes: ['application/pdf', 'application/msword'],
		});
		const call = apiFetchMock.mock.calls[0]![0] as { path: string };
		expect(call.path).toContain('/wp/v2/media?');
		expect(call.path).toContain('search=annual');
		expect(call.path).toContain('per_page=10');
		// `media_type=file` is invalid in WP REST (enum is image|video|text|
		// application|audio). Should not be on the path.
		expect(call.path).not.toContain('media_type=');
		// `mime_type` is a CSV string param, not an array.
		expect(call.path).toContain('mime_type=application%2Fpdf%2Capplication%2Fmsword');
		expect(call.path).toContain('orderby=relevance');
	});

	it('uses orderby=date and omits search when query is empty', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 1));
		await fetchDocuments({
			query: '   ',
			page: 1,
			perPage: 10,
			mimeTypes: ['application/pdf'],
		});
		const call = apiFetchMock.mock.calls[0]![0] as { path: string };
		expect(call.path).toContain('orderby=date');
		expect(call.path).not.toContain('search=');
	});

	it('normalizes a media-endpoint result into DocumentItems', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(
			jsonResponse(
				[
					{
						id: 42,
						title: { rendered: 'Yearly Report' },
						source_url: 'https://example.com/yearly.pdf',
						mime_type: 'application/pdf',
						media_details: { filesize: 2048 },
						modified: '2025-02-01T00:00:00Z',
					},
				],
				1,
				1,
			),
		);
		const page = await fetchDocuments({
			query: '',
			page: 1,
			perPage: 10,
			mimeTypes: ['application/pdf'],
		});
		expect(page.items).toHaveLength(1);
		expect(page.items[0]).toMatchObject({
			id: 42,
			title: 'Yearly Report',
			filename: 'yearly.pdf',
			extension: 'PDF',
			mimeType: 'application/pdf',
			fileSize: 2048,
		});
		expect(page.hasMore).toBe(false);
		expect(page.total).toBe(1);
	});

	it('filters out records that fail matchesAllowed', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(
			jsonResponse(
				[
					{ id: 1, source_url: 'https://x/a.pdf', mime_type: 'application/pdf' },
					{ id: 2, source_url: 'https://x/b.zip', mime_type: 'application/zip' },
				],
				1,
			),
		);
		const page = await fetchDocuments({
			query: '',
			page: 1,
			perPage: 10,
			mimeTypes: ['application/pdf'],
		});
		expect(page.items.map((i) => i.id)).toEqual([1]);
	});

	it('marks hasMore when page < totalPages', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 3, 42));
		const page = await fetchDocuments({
			query: '',
			page: 1,
			perPage: 10,
			mimeTypes: ['application/pdf'],
		});
		expect(page.hasMore).toBe(true);
		expect(page.total).toBe(42);
	});

	it('runs the consumer request() override', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 1));
		await fetchDocuments({
			query: 'x',
			page: 1,
			perPage: 10,
			mimeTypes: [],
			request: (path) => `${path}&_fields=id,source_url`,
		});
		const call = apiFetchMock.mock.calls[0]![0] as { path: string };
		expect(call.path).toContain('_fields=id,source_url');
	});
});
