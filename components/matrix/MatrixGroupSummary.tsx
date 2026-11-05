import { SummaryCell } from './styles';
import { cellKey } from './utils';
import type { GroupSummaryContext, MatrixLabels } from './types';

interface MatrixGroupSummaryProps {
	ctx: GroupSummaryContext;
	labels: Required<MatrixLabels>;
	render?: (ctx: GroupSummaryContext) => React.ReactNode;
	/** Needed to name the selected column of a single-select group. */
	value?: ReadonlySet<string>;
}

export const MatrixGroupSummary = ({ ctx, labels, render, value }: MatrixGroupSummaryProps) => {
	const { group, row } = ctx;
	const single = group.selection === 'single';
	const stateProps = {
		'data-locked': group.disabled || undefined,
		'data-selection': single ? 'single' : undefined,
	};

	if (render) return <SummaryCell {...stateProps}>{render(ctx)}</SummaryCell>;

	// Locked groups explain themselves instead of counting.
	if (group.disabled && group.description) {
		return <SummaryCell {...stateProps}>{group.description}</SummaryCell>;
	}

	if (single && value) {
		const picked = group.columns.find((c) => value.has(cellKey(row.id, c.id)));
		const content = picked
			? picked.label
			: group.allowNone
				? (group.noneLabel ?? labels.noneOption)
				: '—';
		return <SummaryCell {...stateProps}>{content}</SummaryCell>;
	}

	return (
		<SummaryCell {...stateProps}>
			{labels.groupSummary(ctx.selectedCount, ctx.totalCount)}
		</SummaryCell>
	);
};
