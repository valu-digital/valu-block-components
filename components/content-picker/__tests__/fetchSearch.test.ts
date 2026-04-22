import { afterEach, describe, expect, it, vi } from 'vitest';

type FetchMock = ReturnType<typeof vi.fn>;

let apiFetchMock: FetchMock = vi.fn();

vi.mock('@wordpress/api-fetch', () => ({
	default: (args: unknown) => apiFetchMock(args),
}));

vi.mock('@wordpress/url', () => ({
	addQueryArgs: (path: string, args: Record<string, string | number>) => {
		const params = new URLSearchParams();
		for (const [k, v] of Object.entries(args)) {
			params.append(k, String(v));
		}
		return `${path}?${params.toString()}`;
	},
}));

vi.mock('@wordpress/html-entities', () => ({
	decodeEntities: (s: string) => s,
}));

const { fetchSearch } = await import('../api/fetchSearch');

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

describe('fetchSearch', () => {
	it('builds a post-search path with subtype and _embed', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 1));
		await fetchSearch({ query: 'hello', kind: 'post', types: ['post', 'page'], page: 1, perPage: 10 });
		const call = apiFetchMock.mock.calls[0][0] as { path: string };
		expect(call.path).toContain('/wp/v2/search?');
		expect(call.path).toContain('search=hello');
		expect(call.path).toContain('type=post');
		expect(call.path).toContain('subtype=post%2Cpage');
		expect(call.path).toContain('_embed=wp%3Afeaturedmedia%2Cself');
	});

	it('builds a user-search path against wp/v2/users', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 1));
		await fetchSearch({ query: 'lauri', kind: 'user', page: 1, perPage: 5 });
		const call = apiFetchMock.mock.calls[0][0] as { path: string };
		expect(call.path).toContain('/wp/v2/users?');
		expect(call.path).toContain('search=lauri');
	});

	it('normalizes a search-endpoint result', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(
			jsonResponse(
				[
					{
						id: 42,
						title: 'Hello world',
						url: 'https://example.com/hello',
						type: 'post',
						subtype: 'post',
						_embedded: {
							self: [{ status: 'draft' }],
							'wp:featuredmedia': [{ source_url: 'https://example.com/a.jpg' }],
						},
					},
				],
				1,
				1,
			),
		);
		const page = await fetchSearch({ query: 'hi', kind: 'post', page: 1, perPage: 10 });
		expect(page.items).toHaveLength(1);
		expect(page.items[0]).toMatchObject({
			id: 42,
			title: 'Hello world',
			type: 'post',
			kind: 'post',
			status: 'draft',
			thumbnailUrl: 'https://example.com/a.jpg',
		});
		expect(page.items[0].key).toBeTruthy();
		expect(page.hasMore).toBe(false);
		expect(page.total).toBe(1);
	});

	it('sets hasMore when page < totalPages', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 3, 42));
		const page = await fetchSearch({ query: '', kind: 'post', page: 1, perPage: 10 });
		expect(page.hasMore).toBe(true);
		expect(page.total).toBe(42);
	});

	it('runs the consumer request() override', async () => {
		apiFetchMock = vi.fn().mockResolvedValue(jsonResponse([], 1));
		await fetchSearch({
			query: 'x',
			kind: 'post',
			page: 1,
			perPage: 10,
			request: (path) => `${path}&_fields=id,title`,
		});
		const call = apiFetchMock.mock.calls[0][0] as { path: string };
		expect(call.path).toContain('_fields=id,title');
	});
});
