import { useCallback, useState } from 'react';

/**
 * Controlled / uncontrolled expanded-group state.
 *
 * - Pass `expanded` to make it controlled. `onChange` fires on every toggle.
 * - Otherwise pass `defaultExpanded` for the initial state.
 */
export interface UseExpandedGroupsOptions {
	expanded?: ReadonlySet<string>;
	defaultExpanded?: ReadonlySet<string>;
	onChange?: (next: ReadonlySet<string>) => void;
}

export interface UseExpandedGroupsResult {
	expanded: ReadonlySet<string>;
	isExpanded: (groupId: string) => boolean;
	toggle: (groupId: string) => void;
	expand: (groupId: string) => void;
	collapse: (groupId: string) => void;
}

export const useExpandedGroups = ({
	expanded: controlled,
	defaultExpanded,
	onChange,
}: UseExpandedGroupsOptions): UseExpandedGroupsResult => {
	const [uncontrolled, setUncontrolled] = useState<ReadonlySet<string>>(
		() => defaultExpanded ?? new Set<string>(),
	);
	const isControlled = controlled !== undefined;
	const expanded = isControlled ? controlled : uncontrolled;

	const apply = useCallback(
		(next: ReadonlySet<string>) => {
			if (!isControlled) setUncontrolled(next);
			onChange?.(next);
		},
		[isControlled, onChange],
	);

	const isExpanded = useCallback((groupId: string) => expanded.has(groupId), [expanded]);

	const toggle = useCallback(
		(groupId: string) => {
			const next = new Set(expanded);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			apply(next);
		},
		[apply, expanded],
	);

	const expand = useCallback(
		(groupId: string) => {
			if (expanded.has(groupId)) return;
			const next = new Set(expanded);
			next.add(groupId);
			apply(next);
		},
		[apply, expanded],
	);

	const collapse = useCallback(
		(groupId: string) => {
			if (!expanded.has(groupId)) return;
			const next = new Set(expanded);
			next.delete(groupId);
			apply(next);
		},
		[apply, expanded],
	);

	return { expanded, isExpanded, toggle, expand, collapse };
};
