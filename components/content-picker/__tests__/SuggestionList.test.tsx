import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { SuggestionList, type SuggestionListProps } from '../SuggestionList';
import type { ContentItem } from '../types';

class FakeIntersectionObserver {
	static instances: FakeIntersectionObserver[] = [];
	/** Whether the sentinel is in view when an observer starts observing. */
	static inView = false;

	callback: IntersectionObserverCallback;
	disconnected = false;

	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback;
		FakeIntersectionObserver.instances.push(this);
	}

	// Like the real one, report the current state as soon as observing starts.
	observe() {
		this.trigger(FakeIntersectionObserver.inView);
	}

	disconnect() {
		this.disconnected = true;
	}

	trigger(isIntersecting: boolean) {
		this.callback(
			[{ isIntersecting } as IntersectionObserverEntry],
			this as unknown as IntersectionObserver,
		);
	}
}

const live = () => FakeIntersectionObserver.instances.filter((io) => !io.disconnected);

const item = (id: number): ContentItem => ({
	key: `k${id}`,
	id,
	type: 'post',
	kind: 'post',
	title: `Post ${id}`,
});

const items = [item(1), item(2)];

const props = (over: Partial<SuggestionListProps> = {}): SuggestionListProps => ({
	listboxId: 'listbox',
	rootId: 'root',
	groups: [['__all__', items]],
	suggestions: items,
	kind: 'post',
	loading: false,
	fetchingMore: false,
	hasMore: true,
	error: null,
	query: '',
	activeTypeFilter: null,
	highlightedIndex: -1,
	selectedKeys: new Set(),
	labels: {},
	showUrl: false,
	onHover: () => {},
	onSelect: () => {},
	onLoadMore: () => {},
	...over,
});

describe('SuggestionList infinite scroll', () => {
	beforeEach(() => {
		FakeIntersectionObserver.instances = [];
		FakeIntersectionObserver.inView = false;
		vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('keeps one observer when onLoadMore changes between renders', () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = render(<SuggestionList {...props({ onLoadMore: first })} />);
		rerender(<SuggestionList {...props({ onLoadMore: second })} />);

		expect(FakeIntersectionObserver.instances).toHaveLength(1);

		live()[0].trigger(true);
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('does not load when the sentinel is out of view', () => {
		const onLoadMore = vi.fn();
		render(<SuggestionList {...props({ onLoadMore })} />);

		live()[0].trigger(false);
		expect(onLoadMore).not.toHaveBeenCalled();
	});

	it('loads again when a page leaves the sentinel in view', () => {
		const onLoadMore = vi.fn();
		const { rerender } = render(<SuggestionList {...props({ onLoadMore })} />);
		rerender(<SuggestionList {...props({ onLoadMore, fetchingMore: true })} />);
		onLoadMore.mockClear();

		// The page added too few rows to push the sentinel out of view.
		FakeIntersectionObserver.inView = true;
		rerender(<SuggestionList {...props({ onLoadMore, fetchingMore: false })} />);

		expect(onLoadMore).toHaveBeenCalledTimes(1);
		expect(live()).toHaveLength(1);
	});

	it('scrolls back to the top when the search changes', () => {
		const { container, rerender } = render(<SuggestionList {...props({ query: 'a' })} />);
		const scroller = container.querySelector('[role="listbox"]')!.parentElement!;
		scroller.scrollTop = 500;

		rerender(<SuggestionList {...props({ query: 'ab' })} />);
		expect(scroller.scrollTop).toBe(0);

		scroller.scrollTop = 500;
		rerender(<SuggestionList {...props({ query: 'ab', activeTypeFilter: 'page' })} />);
		expect(scroller.scrollTop).toBe(0);
	});

	it('stops observing after the last page', () => {
		const { rerender } = render(<SuggestionList {...props()} />);
		rerender(<SuggestionList {...props({ hasMore: false })} />);

		expect(live()).toHaveLength(0);
	});
});
