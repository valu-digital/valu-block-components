import styled from '@emotion/styled';
import { __ } from '@wordpress/i18n';

import { tokens as t } from '../styles/tokens';
import type { ContentStatus } from '../types';
import { humanizeStatus } from '../utils';

type Tone = 'neutral' | 'warn' | 'danger' | 'success';

const tones: Record<Tone, { bg: string; fg: string; border: string }> = {
	neutral: { bg: t.gray100, fg: t.gray900, border: t.gray300 },
	warn: { bg: '#fef3d0', fg: t.warning, border: '#f3d782' },
	danger: { bg: t.dangerSoft, fg: t.danger, border: t.dangerLine },
	success: { bg: '#e6f4ea', fg: t.success, border: '#a7d5b3' },
};

const toneFor = (status: ContentStatus): Tone => {
	if (status === 'trash') return 'danger';
	if (status === 'draft' || status === 'pending' || status === 'future') return 'warn';
	if (status === 'private') return 'neutral';
	return 'neutral';
};

const Pill = styled.span<{ tone: Tone }>`
	display: inline-flex;
	align-items: center;
	padding: 1px 6px;
	background: ${({ tone }) => tones[tone].bg};
	color: ${({ tone }) => tones[tone].fg};
	border: 1px solid ${({ tone }) => tones[tone].border};
	border-radius: 999px;
	font-size: 10px;
	font-weight: ${t.fontWeightBold};
	letter-spacing: 0.04em;
	text-transform: uppercase;
	white-space: nowrap;
	line-height: 1.6;
`;

export interface StatusBadgeProps {
	status: ContentStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
	const label = humanizeStatus(status);
	if (!label) return null;
	const translated =
		status === 'draft'
			? __('Draft', 'valu-block-components')
			: status === 'pending'
				? __('Pending', 'valu-block-components')
				: status === 'private'
					? __('Private', 'valu-block-components')
					: status === 'future'
						? __('Scheduled', 'valu-block-components')
						: status === 'trash'
							? __('Trash', 'valu-block-components')
							: label;
	return <Pill tone={toneFor(status)}>{translated}</Pill>;
};
