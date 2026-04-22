import { Icon } from '@wordpress/components';
import { dragHandle } from '@wordpress/icons';

import { ChipTitle, ChipWrap } from './styles';

export interface DragChipProps {
	title: string;
}

export const DragChip = ({ title }: DragChipProps) => (
	<ChipWrap>
		<Icon icon={dragHandle} size={16} />
		<ChipTitle>{title}</ChipTitle>
	</ChipWrap>
);
