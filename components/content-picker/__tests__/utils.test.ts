import { describe, expect, it } from 'vitest';

import {
	dedupeAgainst,
	generateKey,
	groupByType,
	humanizeStatus,
	humanizeType,
	isMaxedOut,
	toDisplayUrl,
} from '../utils';
import type { ContentItem } from '../types';

const item = (over: Partial<ContentItem> = {}): ContentItem => ({
	key: over.key ?? generateKey(),
	id: over.id ?? 1,
	type: over.type ?? 'post',
	kind: over.kind ?? 'post',
	title: over.title ?? 'Hello',
	...over,
});

describe('generateKey', () => {
	it('returns unique strings', () => {
		const a = generateKey();
		const b = generateKey();
		expect(a).not.toBe(b);
		expect(a).toMatch(/[0-9a-f-]{36}/i);
	});
});

describe('groupByType', () => {
	it('groups items by type preserving insertion order', () => {
		const items = [
			item({ id: 1, type: 'post' }),
			item({ id: 2, type: 'page' }),
			item({ id: 3, type: 'post' }),
		];
		const groups = groupByType(items);
		expect(groups.map(([t]) => t)).toEqual(['post', 'page']);
		expect(groups[0][1]).toHaveLength(2);
		expect(groups[1][1]).toHaveLength(1);
	});
});

describe('dedupeAgainst', () => {
	it('filters already-picked ids when enabled', () => {
		const picked = [item({ id: 1 })];
		const results = [item({ id: 1 }), item({ id: 2 })];
		expect(dedupeAgainst(results, picked, true)).toHaveLength(1);
	});

	it('is a no-op when disabled', () => {
		const picked = [item({ id: 1 })];
		const results = [item({ id: 1 }), item({ id: 2 })];
		expect(dedupeAgainst(results, picked, false)).toHaveLength(2);
	});
});

describe('isMaxedOut', () => {
	it('treats Infinity as never maxed', () => {
		expect(isMaxedOut([item(), item()], Infinity)).toBe(false);
	});

	it('returns true when value length reaches max', () => {
		expect(isMaxedOut([item()], 1)).toBe(true);
		expect(isMaxedOut([], 1)).toBe(false);
	});
});

describe('humanizeStatus', () => {
	it('returns null for publish or undefined', () => {
		expect(humanizeStatus(undefined)).toBeNull();
		expect(humanizeStatus('publish')).toBeNull();
	});

	it('returns a friendly label for other statuses', () => {
		expect(humanizeStatus('draft')).toBe('Draft');
		expect(humanizeStatus('trash')).toBe('Trash');
	});
});

describe('humanizeType', () => {
	it('handles known post types', () => {
		expect(humanizeType('post', 'post')).toBe('Post');
		expect(humanizeType('page', 'post')).toBe('Page');
	});

	it('title-cases custom types', () => {
		expect(humanizeType('product_category', 'term')).toBe('Product Category');
		expect(humanizeType('case-study', 'post')).toBe('Case Study');
	});

	it('returns User for user kind regardless of type', () => {
		expect(humanizeType('user', 'user')).toBe('User');
	});
});

describe('toDisplayUrl', () => {
	it('returns empty string for empty input', () => {
		expect(toDisplayUrl(undefined)).toBe('');
		expect(toDisplayUrl('')).toBe('');
	});

	it('strips protocol for display', () => {
		expect(toDisplayUrl('https://example.com/post-1')).toBe('example.com/post-1');
	});
});
