import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { speak } from '@wordpress/a11y';

import { createCoreRegistry } from '../../../test-utils/fakeCoreData';
import { SelectedList } from '../SelectedList';
import type { ContentItem } from '../types';

vi.mock('@wordpress/core-data', () => import('../../../test-utils/fakeCoreData'));
vi.mock('@wordpress/a11y', () => ({ speak: vi.fn() }));

const page = (id: number, title: string): ContentItem => ({
	key: `k${id}`,
	id,
	type: 'page',
	kind: 'post',
	title,
});

const Harness = ({ initial }: { initial: ContentItem[] }) => {
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
				showTypeBadge={false}
			/>
		</>
	);
};

/** Focus a button and press it, as a keyboard user would. */
const press = (name: string) => {
	const button = screen.getByRole('button', { name });
	button.focus();
	fireEvent.click(button);
	return button;
};

describe('SelectedList', () => {
	afterEach(() => {
		vi.mocked(speak).mockClear();
	});

	it('names the buttons of a row whose post was deleted', () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'page', 1);

		render(<Harness initial={[page(1, ''), page(2, 'Second')]} />, { wrapper });

		expect(screen.getByRole('button', { name: 'Remove unavailable item' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Move unavailable item down' })).toBeTruthy();
	});

	it('keeps focus on "Move up" when the row becomes the first', async () => {
		const { wrapper } = createCoreRegistry();
		render(<Harness initial={[page(1, 'First'), page(2, 'Second')]} />, { wrapper });

		const button = press('Move Second up');

		await waitFor(() => expect(document.activeElement).toBe(button));
		expect(button.getAttribute('aria-disabled')).toBe('true');
		expect(button.hasAttribute('disabled')).toBe(false);
		expect(speak).toHaveBeenCalledWith('Moved Second to position 1 of 2.');
	});

	it('keeps focus on "Move down" after the row moves', async () => {
		const { wrapper } = createCoreRegistry();
		render(<Harness initial={[page(1, 'First'), page(2, 'Second'), page(3, 'Third')]} />, {
			wrapper,
		});

		const button = press('Move First down');

		await waitFor(() =>
			expect(
				screen.getAllByRole('button', { name: /^Remove / })[1].getAttribute('aria-label'),
			).toBe('Remove First'),
		);
		await waitFor(() => expect(document.activeElement).toBe(button));
	});

	it('moves focus to the next row after a removal', async () => {
		const { wrapper } = createCoreRegistry();
		render(<Harness initial={[page(1, 'First'), page(2, 'Second')]} />, { wrapper });

		press('Remove First');

		const next = screen.getByRole('button', { name: 'Remove Second' });
		await waitFor(() => expect(document.activeElement).toBe(next));
		expect(speak).toHaveBeenCalledWith('Removed First.');
	});

	it('moves focus to the row above after removing the last row', async () => {
		const { wrapper } = createCoreRegistry();
		render(<Harness initial={[page(1, 'First'), page(2, 'Second')]} />, { wrapper });

		press('Remove Second');

		const previous = screen.getByRole('button', { name: 'Remove First' });
		await waitFor(() => expect(document.activeElement).toBe(previous));
	});

	it('moves focus to the search input after removing the only row', async () => {
		const { resolve, wrapper } = createCoreRegistry();
		resolve('postType', 'page', 1);
		render(<Harness initial={[page(1, '')]} />, { wrapper });

		press('Remove unavailable item');

		const input = screen.getByRole('textbox', { name: 'Search' });
		await waitFor(() => expect(document.activeElement).toBe(input));
		expect(speak).toHaveBeenCalledWith('Removed unavailable item.');
	});
});
