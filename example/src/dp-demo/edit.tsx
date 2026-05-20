import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	DocumentPicker,
	type DocumentItem,
} from '@valu/block-components/components/document-picker';

type Attributes = {
	variant: 'popover' | 'inline';
	documentsMulti: DocumentItem[];
	documentSingle: DocumentItem[];
	documentsInline: DocumentItem[];
};

type EditProps = {
	attributes: Attributes;
	setAttributes: (next: Partial<Attributes>) => void;
};

export function Edit({ attributes, setAttributes }: EditProps) {
	const blockProps = useBlockProps({
		style: { display: 'flex', flexDirection: 'column', gap: 32 },
	});

	return (
		<div {...blockProps}>
			<InspectorControls>
				<PanelBody title={__('Variant for the in-content picker', 'valu-cp-demo')}>
					<RadioControl
						label={__('Search interaction', 'valu-cp-demo')}
						selected={attributes.variant}
						options={[
							{ label: __('Popover (default)', 'valu-cp-demo'), value: 'popover' },
							{ label: __('Inline list', 'valu-cp-demo'), value: 'inline' },
						]}
						onChange={(value) =>
							setAttributes({ variant: value as Attributes['variant'] })
						}
					/>
				</PanelBody>

				<PanelBody
					title={__('Sidebar: single document', 'valu-cp-demo')}
					initialOpen={false}
				>
					<DocumentPicker
						label={__('Featured PDF', 'valu-cp-demo')}
						help={__('One document. Replace via Media Library.', 'valu-cp-demo')}
						maxItems={1}
						value={attributes.documentSingle}
						onChange={(documentSingle) => setAttributes({ documentSingle })}
					/>
				</PanelBody>
			</InspectorControls>

			<section>
				<h3 style={{ marginTop: 0 }}>{__('Documents — multi-select, ordered', 'valu-cp-demo')}</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__(
						'Pick up to 5 documents. Drag to reorder, use the chevrons, or open the Media Library modal to browse / upload.',
						'valu-cp-demo',
					)}
				</p>
				<DocumentPicker
					label={__('Documents', 'valu-cp-demo')}
					hideLabelFromVision
					variant={attributes.variant}
					maxItems={5}
					orderable
					fetchOnOpen
					showModifiedDate
					value={attributes.documentsMulti}
					onChange={(documentsMulti) => setAttributes({ documentsMulti })}
				/>
			</section>

			<section>
				<h3 style={{ marginTop: 0 }}>{__('Documents — inline variant', 'valu-cp-demo')}</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__(
						'Same component, inline variant — suggestions are always visible below the input.',
						'valu-cp-demo',
					)}
				</p>
				<DocumentPicker
					label={__('Inline documents', 'valu-cp-demo')}
					hideLabelFromVision
					variant="inline"
					maxItems={Infinity}
					orderable
					fetchOnOpen
					value={attributes.documentsInline}
					onChange={(documentsInline) => setAttributes({ documentsInline })}
				/>
			</section>
		</div>
	);
}
