import { useState } from 'react';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
import { postList, page, category } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import {
	ContentPicker,
	type ContentItem,
	type ContentPickerIconMap,
} from '@valu/block-components/components/content-picker';
import { Matrix } from '@valu/block-components/components/matrix';

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

			<MatrixDemo />
		</div>
	);
}

/** Initials avatar — colored circle, no external image. */
function InitialsAvatar({ name, color }: { name: string; color: string }) {
	const initials = name
		.split(' ')
		.map((p) => p[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();
	return (
		<span
			aria-hidden
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 32,
				height: 32,
				borderRadius: '50%',
				background: color,
				color: '#fff',
				fontSize: 12,
				fontWeight: 600,
				flexShrink: 0,
			}}
		>
			{initials}
		</span>
	);
}

const demoUsers = [
	{
		id: 'u1',
		label: 'Alice Adams',
		sublabel: 'alice@example.com',
		avatar: <InitialsAvatar name="Alice Adams" color="#3858e9" />,
	},
	{
		id: 'u2',
		label: 'Bob Brown',
		sublabel: 'bob@example.com',
		avatar: <InitialsAvatar name="Bob Brown" color="#007017" />,
	},
	{
		id: 'u3',
		label: 'Carol Cohen',
		sublabel: 'carol@example.com',
		avatar: <InitialsAvatar name="Carol Cohen" color="#bd8600" />,
	},
];

const demoFeatures = [
	{ id: 'posts', label: 'Posts', sublabel: 'Blog content' },
	{ id: 'pages', label: 'Pages' },
	{ id: 'media', label: 'Media library' },
	{ id: 'users', label: 'User management' },
];

function MatrixDemo() {
	const [flat, setFlat] = useState<ReadonlySet<string>>(new Set());
	const [grouped, setGrouped] = useState<ReadonlySet<string>>(new Set());
	const [master, setMaster] = useState<ReadonlySet<string>>(
		new Set(['u1::enabled', 'u2::enabled']),
	);
	const [features, setFeatures] = useState<ReadonlySet<string>>(
		new Set(['posts::read', 'pages::read', 'media::read', 'media::write']),
	);

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
			<div>
				<h3 style={{ marginTop: 0 }}>{__('Matrix — flat columns', 'valu-cp-demo')}</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__('Notification preferences: rows × columns, no grouping.', 'valu-cp-demo')}
				</p>
				<Matrix
					caption={__('Notification preferences', 'valu-cp-demo')}
					rows={demoUsers}
					columns={[
						{ id: 'email', label: __('Email', 'valu-cp-demo') },
						{ id: 'push', label: __('Push', 'valu-cp-demo') },
						{ id: 'sms', label: __('SMS', 'valu-cp-demo') },
					]}
					value={flat}
					onChange={(next) => setFlat(next)}
					maxHeight={320}
				/>
			</div>

			<div>
				<h3 style={{ marginTop: 0 }}>
					{__('Matrix — grouped, collapsible', 'valu-cp-demo')}
				</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__(
						'Capability matrix grouped by category. Click a header to expand.',
						'valu-cp-demo',
					)}
				</p>
				<Matrix
					caption={__('Capabilities', 'valu-cp-demo')}
					rows={demoUsers}
					groups={[
						{
							id: 'posts',
							label: __('Posts', 'valu-cp-demo'),
							columns: [
								{ id: 'create', label: __('Create', 'valu-cp-demo') },
								{ id: 'edit', label: __('Edit', 'valu-cp-demo') },
								{ id: 'delete', label: __('Delete', 'valu-cp-demo') },
							],
						},
						{
							id: 'media',
							label: __('Media', 'valu-cp-demo'),
							columns: [
								{ id: 'upload', label: __('Upload', 'valu-cp-demo') },
								{ id: 'delete', label: __('Delete', 'valu-cp-demo') },
							],
							defaultExpanded: true,
						},
					]}
					value={grouped}
					onChange={(next) => setGrouped(next)}
					maxHeight={320}
				/>
			</div>

			<div>
				<h3 style={{ marginTop: 0 }}>{__('Matrix — with master column', 'valu-cp-demo')}</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__(
						'Toggle the master column off to disable a row. Carol starts disabled.',
						'valu-cp-demo',
					)}
				</p>
				<Matrix
					caption={__('Permissions', 'valu-cp-demo')}
					rows={demoUsers}
					master={{ id: 'enabled', label: __('Enabled', 'valu-cp-demo') }}
					columns={[
						{ id: 'read', label: __('Read', 'valu-cp-demo') },
						{ id: 'write', label: __('Write', 'valu-cp-demo') },
						{ id: 'admin', label: __('Admin', 'valu-cp-demo') },
					]}
					value={master}
					onChange={(next) => setMaster(next)}
					variant="toggle"
					maxHeight={320}
				/>
			</div>

			<div>
				<h3 style={{ marginTop: 0 }}>{__('Matrix — rows are not users', 'valu-cp-demo')}</h3>
				<p style={{ marginTop: 0, color: '#757575' }}>
					{__(
						'API permissions: features × read/write. Same component, no avatar/sublabel needed.',
						'valu-cp-demo',
					)}
				</p>
				<Matrix
					caption={__('API permissions', 'valu-cp-demo')}
					rows={demoFeatures}
					columns={[
						{ id: 'read', label: __('Read', 'valu-cp-demo') },
						{ id: 'write', label: __('Write', 'valu-cp-demo') },
					]}
					value={features}
					onChange={(next) => setFeatures(next)}
					maxHeight={320}
				/>
			</div>
		</section>
	);
}
