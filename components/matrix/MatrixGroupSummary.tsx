import { SummaryCell } from './styles';
import type { GroupSummaryContext, MatrixLabels } from './types';

interface MatrixGroupSummaryProps {
	ctx: GroupSummaryContext;
	labels: Required<MatrixLabels>;
	render?: (ctx: GroupSummaryContext) => React.ReactNode;
}

export const MatrixGroupSummary = ({ ctx, labels, render }: MatrixGroupSummaryProps) => {
	if (render) return <SummaryCell>{render(ctx)}</SummaryCell>;
	return <SummaryCell>{labels.groupSummary(ctx.selectedCount, ctx.totalCount)}</SummaryCell>;
};
