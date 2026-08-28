import { describe, expect, it } from 'vitest';

import {
	DEFAULT_DOCUMENT_MIME_TYPES,
	basenameFromUrl,
	dedupeAgainst,
	displayTitle,
	extensionFromUrl,
	formatFileSize,
	formatModified,
	generateKey,
	isMaxedOut,
	mapMediaToDocumentItem,
	matchesAllowed,
} from '../utils';
import type { DocumentItem } from '../types';

const item = (over: Partial<DocumentItem> = {}): DocumentItem => ({
	key: over.key ?? generateKey(),
	id: over.id ?? 1,
	title: over.title ?? 'Doc',
	filename: over.filename ?? 'doc.pdf',
	url: over.url ?? 'https://example.com/doc.pdf',
	mimeType: over.mimeType ?? 'application/pdf',
	extension: over.extension ?? 'PDF',
	...over,
});

describe('DEFAULT_DOCUMENT_MIME_TYPES', () => {
	it('includes PDF, Word, Excel, PowerPoint variants', () => {
		expect(DEFAULT_DOCUMENT_MIME_TYPES).toContain('application/pdf');
		expect(DEFAULT_DOCUMENT_MIME_TYPES).toContain(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		);
		expect(DEFAULT_DOCUMENT_MIME_TYPES).toContain('application/vnd.ms-excel');
		expect(DEFAULT_DOCUMENT_MIME_TYPES).toContain(
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		);
	});
});

describe('basenameFromUrl', () => {
	it('returns trailing path segment', () => {
		expect(basenameFromUrl('https://example.com/wp-content/uploads/doc.pdf')).toBe('doc.pdf');
	});

	it('strips query and hash', () => {
		expect(basenameFromUrl('https://example.com/x/y.docx?foo=bar#z')).toBe('y.docx');
	});

	it('returns empty for nullish input', () => {
		expect(basenameFromUrl(undefined)).toBe('');
		expect(basenameFromUrl(null)).toBe('');
	});
});

describe('extensionFromUrl', () => {
	it('returns uppercase extension', () => {
		expect(extensionFromUrl('https://example.com/doc.PdF')).toBe('PDF');
	});

	it('handles compound paths', () => {
		expect(extensionFromUrl('/wp-content/uploads/2025/12/file.xlsx?v=1')).toBe('XLSX');
	});

	it('returns empty when no dot or trailing dot', () => {
		expect(extensionFromUrl('https://example.com/no-ext')).toBe('');
		expect(extensionFromUrl('https://example.com/dot.')).toBe('');
	});

	it('skips dot-prefixed filenames with no real extension', () => {
		expect(extensionFromUrl('.gitignore')).toBe('');
	});
});

describe('formatFileSize', () => {
	it('returns empty for 0/undefined/NaN', () => {
		expect(formatFileSize(0)).toBe('');
		expect(formatFileSize(undefined)).toBe('');
		expect(formatFileSize(Number.NaN)).toBe('');
	});

	it('formats bytes', () => {
		expect(formatFileSize(512)).toBe('512 B');
	});

	it('formats KB with one decimal under 100', () => {
		expect(formatFileSize(1536)).toBe('1.5 KB');
	});

	it('drops decimal at >= 100', () => {
		expect(formatFileSize(1024 * 150)).toBe('150 KB');
	});

	it('scales to MB and GB', () => {
		expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
		expect(formatFileSize(1024 * 1024 * 1024 * 3)).toBe('3.0 GB');
	});
});

describe('formatModified', () => {
	it('returns empty for invalid input', () => {
		expect(formatModified(undefined)).toBe('');
		expect(formatModified('not-a-date')).toBe('');
	});

	it('formats valid ISO dates', () => {
		const out = formatModified('2025-03-15T12:00:00Z');
		expect(out.length).toBeGreaterThan(0);
	});
});

describe('mapMediaToDocumentItem', () => {
	it('derives extension and filename from source_url', () => {
		const out = mapMediaToDocumentItem({
			id: 12,
			title: { rendered: 'Annual Report' },
			source_url: 'https://site.test/wp-content/uploads/2025/annual.pdf',
			mime_type: 'application/pdf',
			media_details: { filesize: 1234567 },
			modified: '2025-01-02T00:00:00Z',
		});
		expect(out.id).toBe(12);
		expect(out.title).toBe('Annual Report');
		expect(out.filename).toBe('annual.pdf');
		expect(out.extension).toBe('PDF');
		expect(out.fileSize).toBe(1234567);
		expect(out.mimeType).toBe('application/pdf');
		expect(out.modified).toBe('2025-01-02T00:00:00Z');
		expect(out.key).toBeTruthy();
	});

	it('falls back to filename when title is empty', () => {
		const out = mapMediaToDocumentItem({
			id: 1,
			title: { rendered: '' },
			source_url: 'https://x.test/handbook.docx',
			mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		});
		expect(out.title).toBe('handbook.docx');
		expect(out.extension).toBe('DOCX');
	});

	it('accepts wp.media-shaped attachments with url/mime fields', () => {
		const out = mapMediaToDocumentItem({
			id: 7,
			title: 'Brochure',
			url: 'https://x.test/brochure.pptx',
			mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		});
		expect(out.url).toBe('https://x.test/brochure.pptx');
		expect(out.mimeType).toContain('presentation');
		expect(out.extension).toBe('PPTX');
	});
});

describe('matchesAllowed', () => {
	const it_ = { mimeType: 'application/pdf', extension: 'PDF' };

	it('passes everything when both lists are empty', () => {
		expect(matchesAllowed(it_, [], [])).toBe(true);
		expect(matchesAllowed(it_, undefined, undefined)).toBe(true);
	});

	it('matches MIME', () => {
		expect(matchesAllowed(it_, ['application/pdf'], undefined)).toBe(true);
		expect(matchesAllowed(it_, ['application/zip'], undefined)).toBe(false);
	});

	it('matches by extension when MIME does not match', () => {
		expect(matchesAllowed(it_, ['application/zip'], ['pdf'])).toBe(true);
		expect(matchesAllowed(it_, ['application/zip'], ['.PDF'])).toBe(true);
		expect(matchesAllowed(it_, ['application/zip'], ['docx'])).toBe(false);
	});
});

describe('isMaxedOut & dedupeAgainst', () => {
	it('isMaxedOut respects Infinity', () => {
		expect(isMaxedOut([item(), item()], Infinity)).toBe(false);
		expect(isMaxedOut([item()], 1)).toBe(true);
	});

	it('dedupeAgainst removes already-picked ids', () => {
		const picked = [item({ id: 1 })];
		const results = [item({ id: 1 }), item({ id: 2 })];
		expect(dedupeAgainst(results, picked, true)).toHaveLength(1);
		expect(dedupeAgainst(results, picked, false)).toHaveLength(2);
	});
});

describe('displayTitle', () => {
	it('prefers the user-authored label over the title', () => {
		expect(displayTitle(item({ label: 'Custom name' }))).toBe('Custom name');
	});

	it('falls back to the title when the label is missing or blank', () => {
		expect(displayTitle(item())).toBe('Doc');
		expect(displayTitle(item({ label: '   ' }))).toBe('Doc');
	});
});
