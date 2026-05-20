import { VisuallyHidden } from '@wordpress/components';

import { ExtensionPill } from '../styles';
import { extensionA11yLabel } from '../utils';

const toneFor = (extension: string): 'red' | 'blue' | 'green' | 'orange' | 'gray' => {
	const ext = extension.toUpperCase();
	if (ext === 'PDF') return 'red';
	if (ext === 'DOC' || ext === 'DOCX' || ext === 'RTF' || ext === 'ODT') return 'blue';
	if (ext === 'XLS' || ext === 'XLSX' || ext === 'CSV' || ext === 'ODS') return 'green';
	if (ext === 'PPT' || ext === 'PPTX' || ext === 'ODP') return 'orange';
	return 'gray';
};

export interface ExtensionBadgeProps {
	extension: string;
	/** Override of the visible label (defaults to the uppercase extension). */
	label?: string;
}

export const ExtensionBadge = ({ extension, label }: ExtensionBadgeProps) => {
	const visible = label ?? (extension || '?');
	return (
		<>
			<ExtensionPill tone={toneFor(extension)} aria-hidden="true">
				{visible}
			</ExtensionPill>
			<VisuallyHidden>{extensionA11yLabel(extension)}</VisuallyHidden>
		</>
	);
};
