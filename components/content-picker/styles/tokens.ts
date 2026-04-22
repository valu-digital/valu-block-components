/**
 * Design tokens — CSS custom-property passthroughs with fallbacks.
 *
 * The picker is designed to render inside the WP admin where these
 * variables are defined by core (Gutenberg/@wordpress/components). When
 * rendered outside WP (tests, Storybook), the fallbacks keep it usable.
 *
 * Variable mapping:
 * - `accent`        — primary action / focus ring / highlighted option edge
 * - `accentHover`   — translucent accent for hover rows (matches core's
 *                    4% color-mix recipe used on tertiary buttons)
 * - `accentActive`  — translucent accent for active/highlighted rows
 *                    (matches core's 8% color-mix recipe, e.g.
 *                    `.components-button.is-tertiary:active`)
 * - `gray300`       — input / popover borders
 * - `gray600`       — secondary text (URL, meta)
 * - `gray900`       — primary text
 * - `danger*`       — trash / missing states
 */
export const tokens = {
	accent: 'var(--wp-admin-theme-color, #3858e9)',
	accentHover:
		'color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 4%, transparent)',
	accentActive:
		'color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 8%, transparent)',
	bg: 'var(--wp-components-color-background, #ffffff)',
	fg: 'var(--wp-components-color-foreground, #1e1e1e)',
	gray100: 'var(--wp-components-color-gray-100, #f0f0f0)',
	gray200: 'var(--wp-components-color-gray-200, #ebebeb)',
	gray300: 'var(--wp-components-color-gray-300, #dcdcde)',
	gray600: 'var(--wp-components-color-gray-600, #757575)',
	gray900: 'var(--wp-components-color-gray-900, #1e1e1e)',
	danger: '#cc1818',
	dangerSoft: '#fef7f7',
	dangerLine: '#f0b7b7',
	success: '#007017',
	warning: '#bd8600',

	radiusSm: '2px',
	radiusMd: '4px',
	radiusLg: '6px',

	rowMinHeight: '40px',
	suggestionMinHeight: '44px',
	thumbXs: '20px',
	thumbSm: '24px',
	thumbMd: '32px',
	thumbLg: '40px',

	shadowPopover: '0 6px 24px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
	shadowRow: '0 1px 0 rgba(0, 0, 0, 0.04)',

	spaceXs: '4px',
	spaceSm: '8px',
	spaceMd: '12px',
	spaceLg: '16px',

	transitionFast: '120ms ease-out',
	transitionMed: '200ms ease-out',

	fontSizeBody: '13px',
	fontSizeSmall: '11px',
	fontWeightRegular: 400,
	fontWeightMedium: 500,
	fontWeightBold: 600,
} as const;

export type Tokens = typeof tokens;
