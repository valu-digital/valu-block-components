import styled from '@emotion/styled';

import { tokens as t } from '../styles/tokens';
import type { ContentKind } from '../types';
import { humanizeType } from '../utils';

const Pill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 1px 6px;
	background: transparent;
	color: ${t.gray600};
	border: 1px solid ${t.gray300};
	border-radius: 999px;
	font-size: 10px;
	font-weight: ${t.fontWeightBold};
	letter-spacing: 0.04em;
	text-transform: uppercase;
	white-space: nowrap;
	line-height: 1.6;
`;

export interface TypeBadgeProps {
	type: string;
	kind: ContentKind;
	/** Override the displayed label (e.g. from renderItemType). */
	label?: string;
}

export const TypeBadge = ({ type, kind, label }: TypeBadgeProps) => (
	<Pill>{label ?? humanizeType(type, kind)}</Pill>
);
