import type { ComponentType, ReactNode } from 'react';
import { Button } from '@wordpress/components';
import { MediaUpload as RawMediaUpload } from '@wordpress/media-utils';
import { upload } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import { mapMediaToDocumentItem, matchesAllowed } from './utils';
import type { DocumentItem, DocumentPickerLabels } from './types';

interface RawMedia {
	id: number;
	[key: string]: unknown;
}

interface MediaUploadProps {
	allowedTypes?: string[];
	multiple?: boolean;
	gallery?: boolean;
	value?: number | number[];
	onSelect: (value: RawMedia | RawMedia[]) => void;
	render: (props: { open: () => void }) => ReactNode;
}

// The class exported by @wordpress/media-utils doesn't ship a typed props
// interface. Cast it once here and use the typed alias everywhere.
const MediaUpload = RawMediaUpload as unknown as ComponentType<MediaUploadProps>;

export interface MediaLibraryButtonProps {
	allowedMimeTypes: string[];
	allowedExtensions?: string[];
	multiple: boolean;
	value: DocumentItem[];
	onSelect: (items: DocumentItem[]) => void;
	labels: DocumentPickerLabels;
	disabled?: boolean;
	variant?: 'primary' | 'secondary' | 'tertiary';
	label?: string;
}

const normalize = (
	raw: RawMedia | RawMedia[],
	allowedMimeTypes: string[],
	allowedExtensions: string[] | undefined,
): DocumentItem[] => {
	const list = Array.isArray(raw) ? raw : [raw];
	return list
		.map((r) => mapMediaToDocumentItem(r as Parameters<typeof mapMediaToDocumentItem>[0]))
		.filter((item) => matchesAllowed(item, allowedMimeTypes, allowedExtensions));
};

export const MediaLibraryButton = ({
	allowedMimeTypes,
	allowedExtensions,
	multiple,
	value,
	onSelect,
	labels,
	disabled,
	variant = 'secondary',
	label,
}: MediaLibraryButtonProps) => {
	const selectedIds = multiple ? value.map((v) => v.id) : value[0]?.id;
	const buttonLabel =
		label ?? labels.browseMediaLibrary ?? __('Browse Media Library', 'valu-block-components');

	return (
		<MediaUpload
			allowedTypes={allowedMimeTypes}
			multiple={multiple}
			gallery={false}
			{...(selectedIds !== undefined ? { value: selectedIds } : {})}
			onSelect={(selection) => {
				const items = normalize(selection, allowedMimeTypes, allowedExtensions);
				if (items.length > 0) onSelect(items);
			}}
			render={({ open }) => (
				<Button variant={variant} icon={upload} onClick={open} disabled={disabled}>
					{buttonLabel}
				</Button>
			)}
		/>
	);
};
