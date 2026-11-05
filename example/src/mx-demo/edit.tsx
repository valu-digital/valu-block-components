import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	Matrix,
	type MatrixCellState,
	type MatrixColumnGroup,
	type MatrixRowStatus,
} from '@valu/block-components/components/matrix';

type Attributes = { value: string[] };

type EditProps = {
	attributes: Attributes;
	setAttributes: (next: Partial<Attributes>) => void;
};

const rows = [
	{ id: 'u1', label: 'Elina Korhonen', sublabel: 'Editor' },
	{ id: 'u2', label: 'Matti Meikäläinen', sublabel: 'Author' },
	{ id: 'u3', label: 'Anna Virtanen', sublabel: 'Contributor' },
];

const groups: MatrixColumnGroup[] = [
	{
		id: 'posts',
		label: __('Post management', 'valu-cp-demo'),
		columns: [
			{ id: 'list', label: __('List posts', 'valu-cp-demo') },
			{ id: 'create', label: __('Create post', 'valu-cp-demo') },
			{ id: 'publish', label: __('Publish post', 'valu-cp-demo') },
		],
	},
	{
		id: 'templates',
		label: __('Templates', 'valu-cp-demo'),
		columns: [
			{ id: 'get', label: __('Get templates', 'valu-cp-demo') },
			{
				id: 'fill',
				label: __('Fill template', 'valu-cp-demo'),
				disabled: true,
				badge: 'Pro',
				description: __('Requires the Pro plan', 'valu-cp-demo'),
			},
		],
	},
	{
		id: 'mcp',
		label: __('MCP profile', 'valu-cp-demo'),
		selection: 'single',
		allowNone: true,
		noneLabel: __('No MCP', 'valu-cp-demo'),
		columns: [
			{ id: 'mcp-translator', label: __('Translator', 'valu-cp-demo') },
			{ id: 'mcp-writer', label: __('Writer', 'valu-cp-demo') },
		],
	},
	{
		id: 'seo',
		label: 'Valu AI SEO',
		disabled: true,
		badge: 'Ultimate',
		description: __('Not included in your plan', 'valu-cp-demo'),
		columns: [
			{ id: 'audit', label: __('Audit', 'valu-cp-demo') },
			{ id: 'keywords', label: __('Keywords', 'valu-cp-demo') },
		],
	},
];

/** What each user's profile grants — the diff reference. */
const baseline = new Set([
	'u1::list',
	'u1::publish',
	'u1::get',
	'u2::list',
	'u2::create',
	'u2::get',
	'u2::mcp-writer',
	'u3::list',
	'u3::create',
]);

const getCellState = (rowId: string, colId: string): MatrixCellState | undefined => {
	if (rowId === 'u3' && colId === 'publish') {
		return { disabled: true, reason: __('Contributors cannot publish', 'valu-cp-demo') };
	}
	if (colId === 'mcp-translator') {
		return { disabled: true, reason: __('Profile is not enabled for MCP', 'valu-cp-demo') };
	}
	return undefined;
};

export function Edit({ attributes, setAttributes }: EditProps) {
	const blockProps = useBlockProps();
	const value = new Set(attributes.value);
	const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
	const [statuses, setStatuses] = useState<Record<string, MatrixRowStatus['status']>>({});
	const timers = useRef<number[]>([]);

	useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

	// Fake a per-row save: saving → saved (or error for Anna) → idle.
	const save = (rowId: string, next: ReadonlySet<string>) => {
		setAttributes({ value: [...next] });
		setStatuses((s) => ({ ...s, [rowId]: 'saving' }));
		timers.current.push(
			window.setTimeout(() => {
				setStatuses((s) => ({ ...s, [rowId]: rowId === 'u3' ? 'error' : 'saved' }));
			}, 600),
		);
	};

	// Cross-check a dependency: publishing without "create" is flagged.
	const withWarnings = (rowId: string, colId: string): MatrixCellState | undefined => {
		const base = getCellState(rowId, colId);
		if (base) return base;
		if (colId === 'publish' && value.has(`${rowId}::publish`) && !value.has(`${rowId}::create`)) {
			return { tone: 'warning', reason: __('Requires: Create post', 'valu-cp-demo') };
		}
		return undefined;
	};

	return (
		<div {...blockProps}>
			<h3 style={{ marginTop: 0 }}>{__('Permissions vs. profile', 'valu-cp-demo')}</h3>
			<Matrix
				caption={__('User permissions', 'valu-cp-demo')}
				rows={rows}
				groups={groups}
				defaultExpanded={new Set(['posts', 'templates', 'mcp'])}
				value={value}
				onChange={(next, change) => save(change.rowId, next)}
				baseline={baseline}
				onResetRow={(rowId, next) => save(rowId, next)}
				getCellState={withWarnings}
				getRowStatus={(rowId) => ({
					status: statuses[rowId] ?? 'idle',
					onRetry: () => save(rowId, value),
				})}
				selectableRows
				selectedRows={selected}
				onSelectedRowsChange={setSelected}
				maxHeight={480}
			/>
			<p>
				{__('Selected rows:', 'valu-cp-demo')} {[...selected].join(', ') || '—'}
			</p>
		</div>
	);
}
