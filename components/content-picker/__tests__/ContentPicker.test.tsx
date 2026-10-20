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
});
