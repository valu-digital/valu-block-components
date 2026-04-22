import { registerBlockVariation } from '@wordpress/blocks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import {
	ContentPicker,
	type ContentItem,
} from '@valu/block-components/components/content-picker';

import { contactIcon } from '../icons/contact-icon';

const VARIATION = 'valu/contacts-query';

registerBlockVariation('core/query', {
	name: VARIATION,
	title: __('Contacts query', 'valu-cp-demo'),
	description: __(
		'Query Loop pre-configured for contacts, with a picker in the sidebar.',
		'valu-cp-demo',
	),
	icon: contactIcon,
	scope: ['inserter'],
	attributes: {
		namespace: VARIATION,
		query: {
			perPage: 6,
			postType: 'valu_contact',
			valu_post_in: [],
			inherit: false,
		},
	},
	// `namespace` is a built-in attribute Gutenberg uses to pin variation
	// identity — set on insertion, stable across attribute edits.
	isActive: ['namespace'],
});

type ContactRecord = {
	id: number;
	link?: string;
	title?: { rendered?: string } | string;
};

type BlockEditProps = {
	name: string;
	attributes: {
		namespace?: string;
		query?: {
			postType?: string;
			valu_post_in?: number[];
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	setAttributes: (next: Record<string, unknown>) => void;
};

const withContactsInspector = createHigherOrderComponent(
	(BlockEdit: React.ComponentType<BlockEditProps>) => (props: BlockEditProps) => {
		const isOurs =
			props.name === 'core/query' && props.attributes?.namespace === VARIATION;

		if (!isOurs) {
			return <BlockEdit {...props} />;
		}

		const ids: number[] = props.attributes?.query?.valu_post_in ?? [];
		const idsKey = ids.join(',');

		const records = useSelect(
			(select) =>
				ids.length > 0
					? (select(coreStore).getEntityRecords(
							'postType',
							'valu_contact',
							{
								include: ids,
								per_page: ids.length,
							},
						) as ContactRecord[] | null)
					: null,
			[idsKey],
		);

		const pickerValue = useMemo<ContentItem[]>(() => {
			if (ids.length === 0 || !records) return [];
			const byId = new Map(records.map((r) => [r.id, r]));
			return ids
				.map((id) => byId.get(id))
				.filter((r): r is ContactRecord => Boolean(r))
				.map((r) => {
					const rendered =
						typeof r.title === 'object' ? (r.title?.rendered ?? '') : (r.title ?? '');
					return {
						key: String(r.id),
						id: r.id,
						type: 'valu_contact',
						kind: 'post' as const,
						title: rendered,
						url: r.link,
					};
				});
		}, [ids, records]);

		const handleChange = (items: ContentItem[]) => {
			props.setAttributes({
				query: {
					...(props.attributes.query ?? {}),
					valu_post_in: items.map((item) => item.id),
				},
			});
		};

		return (
			<>
				<BlockEdit {...props} />
				<InspectorControls>
					<PanelBody title={__('Pick contacts', 'valu-cp-demo')}>
						<ContentPicker
							label={__('Contacts', 'valu-cp-demo')}
							hideLabelFromVision
							variant="inline"
							kind="post"
							types={['valu_contact']}
							maxItems={12}
							orderable
							fetchOnOpen
							showTypeBadge={false}
							disableTypeFilter
							icons={{ valu_contact: contactIcon }}
							value={pickerValue}
							onChange={handleChange}
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'withContactsInspector',
);

addFilter('editor.BlockEdit', 'valu/cp-demo/contacts-inspector', withContactsInspector);
