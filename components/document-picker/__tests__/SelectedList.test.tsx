import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { speak } from '@wordpress/a11y';

import { createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { SelectedList } from '../SelectedList';
import type { DocumentItem } from '../types';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));
vi.mock('@wordpress/a11y', () => ({ speak: vi.fn() }));

const doc = (id: number, title: string): DocumentItem => ({
	key: `k${id}`,
	id,
	title,
	filename: `file-${id}.pdf`,
	url: `/file-${id}.pdf`,
	mimeType: 'application/pdf',
	extension: 'PDF',
});

const Harness = ({ initial }: { initial: DocumentItem[] }) => {
	const [value, setValue] = useState(initial);
	return (
		<>
			<input id="root-input" aria-label="Search" />
			<SelectedList
				rootId="root"
				value={value}
				orderable
				maxItems={Infinity}
				labels={{}}
				onChange={setValue}
				showExtensionBadge={false}
				showFileSize={false}
				showModifiedDate={false}
			/>
		</>
	);
};

describe('SelectedList', () => {
	// The move buttons sit in a container query, hidden at happy-dom's zero width.
	it('names the buttons of a row whose file was deleted', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'attachment', 1);

		render(<Harness initial={[doc(1, ''), doc(2, 'Second')]} />, { wrapper });

		expect(screen.getByRole('button', { name: 'Remove unavailable document' })).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Move unavailable document down', hidden: true }),
		).toBeTruthy();
	});

	it('keeps focus on "Move up" when the row becomes the first', async () => {
		const { wrapper } = createCoreRegistry();
		render(<Harness initial={[doc(1, 'First'), doc(2, 'Second')]} />, { wrapper });

		const button = screen.getByRole('button', { name: 'Move Second up', hidden: true });
		button.focus();
		fireEvent.click(button);

		await waitFor(() => expect(document.activeElement).toBe(button));
		expect(button.getAttribute('aria-disabled')).toBe('true');
	});

	it('moves focus to the search input after removing the only row', async () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'attachment', 1);
		render(<Harness initial={[doc(1, '')]} />, { wrapper });

		const button = screen.getByRole('button', { name: 'Remove unavailable document' });
		button.focus();
		fireEvent.click(button);

		const input = screen.getByRole('textbox', { name: 'Search' });
		await waitFor(() => expect(document.activeElement).toBe(input));
		expect(speak).toHaveBeenCalledWith('Removed unavailable document.');
	});
});
