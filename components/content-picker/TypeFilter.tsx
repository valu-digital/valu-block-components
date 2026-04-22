import styled from '@emotion/styled';
import { __ } from '@wordpress/i18n';

import { tokens as t } from './styles/tokens';
import { humanizeType } from './utils';
import type { ContentKind } from './types';

const Row = styled.div`
	display: flex;
	align-items: center;
	gap: ${t.spaceXs};
	padding: 6px ${t.spaceMd};
	overflow-x: auto;
	border-bottom: 1px solid ${t.gray200};
	background: ${t.bg};

	&::-webkit-scrollbar {
		height: 4px;
	}
	&::-webkit-scrollbar-thumb {
		background: ${t.gray300};
		border-radius: 2px;
	}
`;

const Chip = styled.button<{ active?: boolean }>`
	flex: 0 0 auto;
	padding: 2px 10px;
	font-size: ${t.fontSizeSmall};
	font-weight: ${t.fontWeightMedium};
	line-height: 1.6;
	border-radius: 999px;
	border: 1px solid ${({ active }) => (active ? t.accent : t.gray300)};
	background: ${({ active }) => (active ? t.accent : 'transparent')};
	color: ${({ active }) => (active ? '#fff' : t.gray900)};
	cursor: pointer;
	white-space: nowrap;
	transition: background ${t.transitionFast}, border-color ${t.transitionFast};

	&:hover {
		border-color: ${t.accent};
	}

	&:focus-visible {
		outline: 2px solid ${t.accent};
		outline-offset: 1px;
	}
`;

export interface TypeFilterProps {
	types: string[];
	kind: ContentKind;
	active: string | null;
	onChange: (type: string | null) => void;
	allLabel?: string;
}

export const TypeFilter = ({ types, kind, active, onChange, allLabel }: TypeFilterProps) => {
	if (types.length < 2) return null;

	return (
		<Row role="toolbar" aria-label={__('Filter by type', 'valu-block-components')}>
			<Chip
				type="button"
				active={active === null}
				aria-pressed={active === null}
				onClick={() => onChange(null)}
				onMouseDown={(e) => e.preventDefault()}
			>
				{allLabel ?? __('All', 'valu-block-components')}
			</Chip>
			{types.map((type) => (
				<Chip
					key={type}
					type="button"
					active={active === type}
					aria-pressed={active === type}
					onClick={() => onChange(active === type ? null : type)}
					onMouseDown={(e) => e.preventDefault()}
				>
					{humanizeType(type, kind)}
				</Chip>
			))}
		</Row>
	);
};
