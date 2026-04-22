import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
import { postList, page, category } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import {
	ContentPicker,
	type ContentItem,
	type ContentPickerIconMap,
} from '@valu/block-components/components/content-picker';

const postIcons: ContentPickerIconMap = {
	post: postList,
	page,
};

const termIcons: ContentPickerIconMap = {
	category,
};

type Attributes = {
	variant: 'popover' | 'inline';
	related: ContentItem[];
	relatedSidebar: ContentItem[];
	featured: ContentItem[];
	author: ContentItem[];
};

type EditProps = {
	attributes: Attributes;
	setAttributes: (next: Partial<Attributes>) => void;
};

export function Edit({ attributes, setAttributes }: EditProps) {
	const blockProps = useBlockProps({
		style: { display: 'flex', flexDirection: 'column', gap: 24 },
	});

	return (
		<div {...blockProps}>
			<InspectorControls>
				<PanelBody title={__('Variant', 'valu-cp-demo')}>
					<RadioControl
						label={__('Search interaction', 'valu-cp-demo')}
						selected={attributes.variant}
						options={[
							{ label: __('Popover (LinkControl-style)', 'valu-cp-demo'), value: 'popover' },
							{ label: __('Inline suggestion panel', 'valu-cp-demo'), value: 'inline' },
						]}
						onChange={(value) =>
							setAttributes({ variant: value as Attributes['variant'] })
						}
					/>
				</PanelBody>

				<PanelBody title={__('Related (sidebar, multi-select)', 'valu-cp-demo')} initialOpen={false}>
					<ContentPicker
						label={__('Related posts in sidebar', 'valu-cp-demo')}
						hideLabelFromVision
						variant={attributes.variant}
						kind="post"
						types={['post', 'page']}
						maxItems={5}
						orderable
						fetchOnOpen
						showTypeBadge={false}
						showUrl={false}
						value={attributes.relatedSidebar}
						onChange={(items) => setAttributes({ relatedSidebar: items })}
					/>
				</PanelBody>

				<PanelBody title={__('Featured (single select, term)', 'valu-cp-demo')} initialOpen={false}>
					<ContentPicker
						label={__('Featured category', 'valu-cp-demo')}
						variant={attributes.variant}
						kind="term"
						types={['category']}
						maxItems={1}
						fetchOnOpen
						icons={termIcons}
						value={attributes.featured}
						onChange={(items) => setAttributes({ featured: items })}
					/>
				</PanelBody>

				<PanelBody title={__('Author (user picker)', 'valu-cp-demo')} initialOpen={false}>
					<ContentPicker
						label={__('Primary author', 'valu-cp-demo')}
						variant={attributes.variant}
						kind="user"
						maxItems={1}
						fetchOnOpen
						value={attributes.author}
						onChange={(items) => setAttributes({ author: items })}
					/>
				</PanelBody>
			</InspectorControls>

			<section>
				<h3 style={{ marginTop: 0 }}>
					{__('Related posts', 'valu-cp-demo')}
				</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__(
						'Pick up to five posts or pages. Drag to reorder. Uses the variant selected in the sidebar.',
						'valu-cp-demo',
					)}
				</p>
				<ContentPicker
					label={__('Related content', 'valu-cp-demo')}
					hideLabelFromVision
					variant={attributes.variant}
					kind="post"
					types={['post', 'page']}
					maxItems={5}
					orderable
					fetchOnOpen
					icons={postIcons}
					value={attributes.related}
					onChange={(items) => setAttributes({ related: items })}
				/>
			</section>
		</div>
	);
}
