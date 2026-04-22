import { forwardRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Icon, VisuallyHidden } from '@wordpress/components';
import { search, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import { Input, InputShell, SearchIconWrap } from './styles';
import { aria } from './utils';
import type { ContentPickerLabels } from './types';

export interface SearchComboboxProps {
	rootId: string;
	value: string;
	onChange: (value: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onKeyDown: (event: KeyboardEvent) => void;
	placeholder?: string;
	label: string;
	hideLabelFromVision: boolean;
	help?: string;
	disabled?: boolean;
	open: boolean;
	listboxId: string;
	activeOptionId?: string;
	labels: ContentPickerLabels;
}

export const SearchCombobox = forwardRef<HTMLInputElement, SearchComboboxProps>(
	(
		{
			rootId,
			value,
			onChange,
			onFocus,
			onBlur,
			onKeyDown,
			placeholder,
			label,
			hideLabelFromVision,
			help,
			disabled,
			open,
			listboxId,
			activeOptionId,
			labels,
		},
		ref,
	) => {
		const inputId = aria(rootId, 'input');
		const helpId = help ? aria(rootId, 'help') : undefined;

		return (
			<div>
				{hideLabelFromVision ? (
					<VisuallyHidden as="label" htmlFor={inputId}>
						{label}
					</VisuallyHidden>
				) : (
					<label htmlFor={inputId} style={{ display: 'block', marginBottom: 4 }}>
						{label}
					</label>
				)}
				<InputShell aria-disabled={disabled || undefined}>
					<SearchIconWrap aria-hidden="true">
						<Icon icon={search} size={20} />
					</SearchIconWrap>
					<Input
						ref={ref}
						id={inputId}
						type="text"
						role="combobox"
						aria-expanded={open}
						aria-controls={listboxId}
						aria-autocomplete="list"
						aria-activedescendant={activeOptionId}
						aria-describedby={helpId}
						aria-label={hideLabelFromVision ? label : undefined}
						value={value}
						placeholder={placeholder ?? labels.input ?? __('Search', 'valu-block-components')}
						disabled={disabled}
						autoComplete="off"
						spellCheck={false}
						onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
						onFocus={onFocus}
						onBlur={onBlur}
						onKeyDown={onKeyDown}
					/>
					{value.length > 0 && !disabled ? (
						<button
							type="button"
							onClick={() => onChange('')}
							aria-label={__('Clear search', 'valu-block-components')}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: 'transparent',
								border: 0,
								padding: 2,
								cursor: 'pointer',
								borderRadius: 2,
								color: 'currentColor',
								opacity: 0.6,
							}}
						>
							<Icon icon={closeSmall} size={18} />
						</button>
					) : null}
				</InputShell>
				{help ? (
					<p id={helpId} style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.7 }}>
						{help}
					</p>
				) : null}
			</div>
		);
	},
);

SearchCombobox.displayName = 'SearchCombobox';
