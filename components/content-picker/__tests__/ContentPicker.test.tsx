import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { ContentPicker } from '../ContentPicker';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));
vi.mock('@wordpress/a11y', () => ({ speak: vi.fn() }));
vi.mock('@wordpress/api-fetch', () => ({
	default: async () =>
		new Response(
			JSON.stringify([{ id: 7, title: 'Seventh', url: '/7', type: 'post', subtype: 'page' }]),
			{ headers: { 'X-WP-TotalPages': '1', 'X-WP-Total': '1' } },
		),
}));

describe('ContentPicker', () => {
	it('moves focus to the new row when a selection fills the picker', async () => {
		const { wrapper } = createCoreRegistry();
		render(
			<ContentPicker
				label="Page"
				variant="inline"
				types={['page']}
				maxItems={1}
				fetchOnOpen
				excludeCurrentPost={false}
			/>,
			{ wrapper },
		);

		await screen.findByRole('option', { name: /Seventh/ });
		const input = screen.getByRole('combobox');
		input.focus();
		fireEvent.keyDown(input, { key: 'ArrowDown' });
		fireEvent.keyDown(input, { key: 'Enter' });

		const remove = await screen.findByRole('button', { name: 'Remove Seventh' });
		expect(screen.queryByRole('combobox')).toBeNull();
		await waitFor(() => expect(document.activeElement).toBe(remove));
	});

	it('limits the items to a maxItems given as a numeric string', async () => {
		const { wrapper } = createCoreRegistry();
		render(
			<ContentPicker
				label="Pages"
				variant="inline"
				types={['page']}
				// As passed on from PHP by `wp_localize_script()`.
				maxItems={'2' as unknown as number}
				defaultValue={[{ key: 'third', id: 3, kind: 'post', type: 'page', title: 'Third' }]}
				fetchOnOpen
				excludeCurrentPost={false}
			/>,
			{ wrapper },
		);

		await screen.findByRole('option', { name: /Seventh/ });
		const input = screen.getByRole('combobox');
		input.focus();
		fireEvent.keyDown(input, { key: 'ArrowDown' });
		fireEvent.keyDown(input, { key: 'Enter' });

		await screen.findByRole('button', { name: 'Remove Seventh' });
		expect(screen.queryByRole('combobox')).toBeNull();
	});

	it('moves focus to the new row when the parent rebuilds the items', async () => {
		const titles: Record<number, string> = { 3: 'Third', 7: 'Seventh' };
		// Stores only ids, like a Query Loop extension: the items it passes
		// back have keys of its own, and the query's post type until it has
		// looked up the real one.
		const Parent = () => {
			const [ids, setIds] = useState([3]);
			return (
				<ContentPicker
					label="Content"
					variant="inline"
					types={['post', 'page']}
					maxItems={2}
					fetchOnOpen
					excludeCurrentPost={false}
					value={ids.map((id) => ({
						key: String(id),
						id,
						kind: 'post' as const,
						type: 'post',
						title: titles[id],
					}))}
					onChange={(next) => setIds(next.map((item) => item.id))}
				/>
			);
		};
		const { wrapper } = createCoreRegistry();
		render(<Parent />, { wrapper });

		await screen.findByRole('option', { name: /Seventh/ });
		const input = screen.getByRole('combobox');
		input.focus();
		fireEvent.keyDown(input, { key: 'ArrowDown' });
		fireEvent.keyDown(input, { key: 'Enter' });

		const remove = await screen.findByRole('button', { name: 'Remove Seventh' });
		expect(remove.id).toMatch(/-remove-7$/);
		await waitFor(() => expect(document.activeElement).toBe(remove));
	});
});
