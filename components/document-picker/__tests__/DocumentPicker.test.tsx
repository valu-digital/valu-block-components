import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { DocumentPicker } from '../DocumentPicker';
import type { DocumentItem } from '../types';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));
// @wordpress/media-utils pulls in @wordpress/blocks, which doesn't load under vitest.
vi.mock('../MediaLibraryButton', () => ({ MediaLibraryButton: () => null }));
vi.mock('@wordpress/a11y', () => ({ speak: vi.fn() }));
vi.mock('@wordpress/api-fetch', () => ({
	default: async () =>
		new Response(
			JSON.stringify([
				{
					id: 7,
					title: { rendered: 'Seventh' },
					source_url: '/seventh.pdf',
					mime_type: 'application/pdf',
				},
			]),
			{ headers: { 'X-WP-TotalPages': '1', 'X-WP-Total': '1' } },
		),
}));

const doc = (id: number, title: string): DocumentItem => ({
	key: String(id),
	id,
	title,
	filename: `${title.toLowerCase()}.pdf`,
	url: `/${title.toLowerCase()}.pdf`,
	mimeType: 'application/pdf',
	extension: 'PDF',
});

describe('DocumentPicker', () => {
	it('moves focus to the new row when the parent re-keys the items', async () => {
		const titles: Record<number, string> = { 3: 'Third', 7: 'Seventh' };
		// Stores only ids, so the items it passes back have keys of its own.
		const Parent = () => {
			const [ids, setIds] = useState([3]);
			return (
				<DocumentPicker
					label="Documents"
					variant="inline"
					maxItems={2}
					fetchOnOpen
					enableMediaLibrary={false}
					value={ids.map((id) => doc(id, titles[id]))}
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
