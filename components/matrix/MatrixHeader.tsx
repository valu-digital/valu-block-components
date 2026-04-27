import { GroupHeaderButton, Caret, FillerHeaderCell, HeaderCell } from './styles';
import type {
	MatrixColumn,
	MatrixColumnGroup,
	MatrixLabels,
	MatrixMasterColumn,
} from './types';

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
}

const isExpanded = (group: MatrixColumnGroup, expanded: ReadonlySet<string>): boolean =>
	group.collapsible === false ? true : expanded.has(group.id);

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
}: MatrixHeaderProps) => {
	// Flat / single-row header.
	if (flat) {
		const cols = groups[0]?.columns ?? [];
		return (
			<thead>
				<tr>
					<HeaderCell
						scope="col"
						$sticky={stickyHeader}
						$leftSticky={stickyFirstColumn}
						$leftOffset="0"
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
					{cols.map((col) => (
						<HeaderCell
							key={col.id}
							scope="col"
							$sticky={stickyHeader}
							$align="center"
							aria-description={col.description}
						>
							{renderHeader ? renderHeader(col) : col.label}
						</HeaderCell>
					))}
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
				<HeaderCell
					scope="col"
					rowSpan={2}
					$sticky={stickyHeader}
					$leftSticky={stickyFirstColumn}
					$leftOffset="0"
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
					const span = open ? group.columns.length : 1;
					const collapsible = group.collapsible !== false;
					return (
						<HeaderCell
							key={group.id}
							scope="colgroup"
							colSpan={span}
							rowSpan={open ? 1 : 2}
							$sticky={stickyHeader}
							$align="center"
						>
							{collapsible ? (
								<GroupHeaderButton
									type="button"
									aria-expanded={open}
									aria-label={open ? labels.collapseGroup : labels.expandGroup}
									onClick={() => onToggleGroup(group.id)}
								>
									<Caret $open={open} aria-hidden />
									{group.label}
								</GroupHeaderButton>
							) : (
								<span>{group.label}</span>
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
					return group.columns.map((col) => (
						<HeaderCell
							key={`${group.id}::${col.id}`}
							scope="col"
							$sticky={stickyHeader}
							$top={TOP_ROW_HEIGHT}
							$align="center"
							aria-description={col.description}
						>
							{renderHeader ? renderHeader(col) : col.label}
						</HeaderCell>
					));
				})}
			</tr>
		</thead>
	);
};
