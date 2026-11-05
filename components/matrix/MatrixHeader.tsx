import { CheckboxControl } from '@wordpress/components';

import {
	Badge,
	CellControlWrap,
	GroupHeaderButton,
	Caret,
	FillerHeaderCell,
	HeaderCell,
	HeaderLabelWrap,
	HeaderStack,
} from './styles';
import { visibleColumnsOf } from './utils';
import type { MatrixColumn, MatrixColumnGroup, MatrixLabels, MatrixMasterColumn } from './types';

/** Header select-all state, present only when `selectableRows` is on. */
export interface HeaderSelection {
	checked: boolean;
	indeterminate: boolean;
	onChange: (checked: boolean) => void;
}

interface MatrixHeaderProps {
	groups: MatrixColumnGroup[];
	master?: MatrixMasterColumn;
	flat: boolean;
	stickyHeader: boolean;
	stickyFirstColumn: boolean;
	masterLeftOffset: string;
	expandedGroups: ReadonlySet<string>;
	onToggleGroup: (groupId: string) => void;
	labels: Required<MatrixLabels>;
	renderHeader?: (column: MatrixColumn) => React.ReactNode;
	rowHeaderLabel?: string;
	selection?: HeaderSelection;
	rowHeaderLeftOffset?: string;
}

const isExpanded = (group: MatrixColumnGroup, expanded: ReadonlySet<string>): boolean =>
	group.collapsible === false ? true : expanded.has(group.id);

const LockIcon = () => (
	<svg width="9" height="9" viewBox="0 0 24 24" aria-hidden focusable="false">
		<rect
			x="5"
			y="11"
			width="14"
			height="10"
			rx="2"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
		/>
		<path
			d="M8 11V8a4 4 0 018 0v3"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
		/>
	</svg>
);

/** Render a badge: strings get the default pill + lock, nodes render as-is. */
const renderBadge = (badge: React.ReactNode, locked: boolean) => {
	if (badge === undefined || badge === null || badge === false) return null;
	if (typeof badge === 'string' || typeof badge === 'number') {
		return (
			<Badge>
				{locked && <LockIcon />}
				{badge}
			</Badge>
		);
	}
	return badge;
};

export const MatrixHeader = ({
	groups,
	master,
	flat,
	stickyHeader,
	stickyFirstColumn,
	masterLeftOffset,
	expandedGroups,
	onToggleGroup,
	labels,
	renderHeader,
	rowHeaderLabel,
	selection,
	rowHeaderLeftOffset = '0',
}: MatrixHeaderProps) => {
	const leafHeader = (
		group: MatrixColumnGroup,
		col: MatrixColumn,
		index: number,
		top?: string,
	) => {
		const locked = !!(col.disabled || group.disabled);
		const single = group.selection === 'single';
		const content = renderHeader ? renderHeader(col) : col.label;
		const badge = renderBadge(col.badge, locked);
		return (
			<HeaderCell
				key={flat ? col.id : `${group.id}::${col.id}`}
				scope="col"
				$sticky={stickyHeader}
				$top={top}
				$align="center"
				aria-description={col.description}
				title={locked ? col.description : undefined}
				data-locked={locked || undefined}
				data-selection={single ? 'single' : undefined}
				data-group-start={(single && index === 0) || undefined}
			>
				{badge ? (
					<HeaderStack>
						<span>{content}</span>
						{badge}
					</HeaderStack>
				) : (
					content
				)}
			</HeaderCell>
		);
	};

	const selectHeader = (rowSpan?: number) =>
		selection ? (
			<HeaderCell
				scope="col"
				rowSpan={rowSpan}
				$sticky={stickyHeader}
				$leftSticky={stickyFirstColumn}
				$leftOffset="0"
				$align="center"
			>
				<CellControlWrap>
					<CheckboxControl
						__nextHasNoMarginBottom
						label=""
						checked={selection.checked}
						indeterminate={selection.indeterminate}
						aria-label={labels.selectAllRows}
						onChange={selection.onChange}
					/>
				</CellControlWrap>
			</HeaderCell>
		) : null;

	// Flat / single-row header.
	if (flat) {
		const group = groups[0]!;
		const cols = group?.columns ?? [];
		return (
			<thead>
				<tr>
					{selectHeader()}
					<HeaderCell
						scope="col"
						$sticky={stickyHeader}
						$leftSticky={stickyFirstColumn}
						$leftOffset={rowHeaderLeftOffset}
					>
						{rowHeaderLabel ?? ''}
					</HeaderCell>
					{master && (
						<HeaderCell
							scope="col"
							$sticky={stickyHeader}
							$leftSticky={stickyFirstColumn}
							$leftOffset={masterLeftOffset}
							$align="center"
						>
							{master.label}
						</HeaderCell>
					)}
					{cols.map((col, i) => leafHeader(group, col, i))}
					<FillerHeaderCell aria-hidden $sticky={stickyHeader} />
				</tr>
			</thead>
		);
	}

	// Grouped — two header rows.
	const TOP_ROW_HEIGHT = '36px';

	return (
		<thead>
			<tr>
				{selectHeader(2)}
				<HeaderCell
					scope="col"
					rowSpan={2}
					$sticky={stickyHeader}
					$leftSticky={stickyFirstColumn}
					$leftOffset={rowHeaderLeftOffset}
				>
					{rowHeaderLabel ?? ''}
				</HeaderCell>
				{master && (
					<HeaderCell
						scope="col"
						rowSpan={2}
						$sticky={stickyHeader}
						$leftSticky={stickyFirstColumn}
						$leftOffset={masterLeftOffset}
						$align="center"
					>
						{master.label}
					</HeaderCell>
				)}
				{groups.map((group) => {
					const open = isExpanded(group, expandedGroups);
					const span = open ? visibleColumnsOf(group, labels.noneOption).length : 1;
					const collapsible = group.collapsible !== false;
					const locked = !!group.disabled;
					const single = group.selection === 'single';
					const badge = renderBadge(group.badge, locked);
					const label = badge ? (
						<HeaderLabelWrap $muted={locked}>
							{group.label}
							{badge}
						</HeaderLabelWrap>
					) : (
						group.label
					);
					return (
						<HeaderCell
							key={group.id}
							scope="colgroup"
							colSpan={span}
							rowSpan={open ? 1 : 2}
							$sticky={stickyHeader}
							$align="center"
							aria-description={group.description}
							title={locked ? group.description : undefined}
							data-locked={locked || undefined}
							data-selection={single ? 'single' : undefined}
							data-group-start={single || undefined}
						>
							{collapsible ? (
								<GroupHeaderButton
									type="button"
									aria-expanded={open}
									aria-label={open ? labels.collapseGroup : labels.expandGroup}
									onClick={() => onToggleGroup(group.id)}
								>
									<Caret $open={open} aria-hidden />
									{label}
								</GroupHeaderButton>
							) : (
								<span>{label}</span>
							)}
						</HeaderCell>
					);
				})}
				<FillerHeaderCell aria-hidden rowSpan={2} $sticky={stickyHeader} />
			</tr>
			<tr>
				{groups.map((group) => {
					const open = isExpanded(group, expandedGroups);
					if (!open) return null;
					return visibleColumnsOf(group, labels.noneOption).map((col, i) =>
						leafHeader(group, col, i, TOP_ROW_HEIGHT),
					);
				})}
			</tr>
		</thead>
	);
};
