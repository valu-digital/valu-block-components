import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ContentPickerPopover } from './ContentPickerPopover';
import { ContentPickerInline } from './ContentPickerInline';
import { SelectedList } from './SelectedList';
import { EmotionCacheProvider } from './styles/emotionCache';
import { Root } from './styles';
import type {
	ContentItem,
	ContentPickerLabels,
	ContentPickerProps,
} from './types';

const DEFAULT_LABELS: ContentPickerLabels = {};

const defaultTypesFor = (kind: NonNullable<ContentPickerProps['kind']>): string[] => {
	if (kind === 'post') return ['post', 'page'];
	if (kind === 'term') return ['category', 'post_tag'];
	return [];
};

const makeQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: 1, refetchOnWindowFocus: false },
		},
	});

/**
 * `<ContentPicker />` — search for and attach WordPress posts, pages,
 * custom post types, taxonomy terms, or users to a block.
 *
 * The component is **controlled** when `value` is defined, and
 * **uncontrolled** (with optional `defaultValue`) otherwise. In both modes
 * `onChange` fires with the full next array.
 *
 * @example
 * <ContentPicker
 *     label="Related posts"
 *     variant="popover"
 *     kind="post"
 *     types={['post', 'page']}
 *     maxItems={5}
 *     orderable
 *     value={related}
 *     onChange={setRelated}
 * />
 */
export const ContentPicker = ({
	label,
	hideLabelFromVision = false,
	help,
	kind = 'post',
	types,
	variant = 'popover',
	value: controlledValue,
	defaultValue,
	onChange,
	maxItems = Infinity,
	orderable,
	placeholder,
	perPage,
	inputDelayMs = 250,
	fetchOnOpen = false,
	excludeCurrentPost = true,
	uniqueItems = true,
	groupByType,
	showTypeBadge,
	icons,
	disableTypeFilter,
	showUrl,
	filter,
	request,
	renderSuggestion,
	renderSelected,
	renderGroupHeading,
	labels = DEFAULT_LABELS,
	className,
	id,
}: ContentPickerProps) => {
	const reactId = useId();
	const rootId = id ?? `valu-cp-${reactId.replace(/:/g, '')}`;

	const [uncontrolled, setUncontrolled] = useState<ContentItem[]>(defaultValue ?? []);
	const isControlled = controlledValue !== undefined;
	const value = isControlled ? controlledValue : uncontrolled;

	const handleChange = useCallback(
		(next: ContentItem[]) => {
			if (!isControlled) setUncontrolled(next);
			onChange?.(next);
		},
		[isControlled, onChange],
	);

	const effectiveTypes = types ?? defaultTypesFor(kind);
	const effectivePerPage = perPage ?? (variant === 'popover' ? 10 : 20);
	const effectiveOrderable = orderable ?? (Number.isFinite(maxItems) ? maxItems > 1 : true);
	const effectiveGroupByType = groupByType ?? effectiveTypes.length > 1;
	const effectiveShowTypeBadge = showTypeBadge ?? effectiveTypes.length > 1;

	const queryClientRef = useRef<QueryClient | null>(null);
	if (!queryClientRef.current) queryClientRef.current = makeQueryClient();

	const showInput = !(Number.isFinite(maxItems) && value.length >= maxItems);

	const variantProps = useMemo(
		() => ({
			rootId,
			label,
			hideLabelFromVision,
			help,
			placeholder,
			kind,
			types: effectiveTypes,
			perPage: effectivePerPage,
			inputDelayMs,
			excludeCurrentPost,
			uniqueItems,
			maxItems,
			groupByType: effectiveGroupByType,
			fetchOnOpen,
			filter,
			request,
			renderSuggestion,
			renderGroupHeading,
			icons,
			disableTypeFilter,
			showUrl,
			value,
			onChange: handleChange,
			labels,
		}),
		[
			rootId,
			label,
			hideLabelFromVision,
			help,
			placeholder,
			kind,
			effectiveTypes,
			effectivePerPage,
			inputDelayMs,
			excludeCurrentPost,
			uniqueItems,
			maxItems,
			effectiveGroupByType,
			fetchOnOpen,
			filter,
			request,
			renderSuggestion,
			renderGroupHeading,
			icons,
			disableTypeFilter,
			showUrl,
			value,
			handleChange,
			labels,
		],
	);

	return (
		<EmotionCacheProvider>
			<QueryClientProvider client={queryClientRef.current}>
				<Root id={rootId} className={className}>
					{showInput ? (
						variant === 'popover' ? (
							<ContentPickerPopover {...variantProps} />
						) : (
							<ContentPickerInline {...variantProps} />
						)
					) : null}
					<SelectedList
						value={value}
						orderable={effectiveOrderable && value.length > 1}
						maxItems={maxItems}
						labels={labels}
						onChange={handleChange}
						renderSelected={renderSelected}
						showHeader={value.length > 0}
						showTypeBadge={effectiveShowTypeBadge}
						icons={icons}
					/>
				</Root>
			</QueryClientProvider>
		</EmotionCacheProvider>
	);
};
