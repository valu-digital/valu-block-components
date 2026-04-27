/**
 * Design tokens — CSS custom-property passthroughs with fallbacks.
 *
 * These mirror the ContentPicker tokens so the Matrix bundle stays
 * self-contained (no cross-component import). They map to the same
 * WordPress admin variables (`--wp-admin-theme-color`, `--wp-components-color-*`).
 */
export const tokens = {
	accent: 'var(--wp-admin-theme-color, #3858e9)',
	accentHover:
		'color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 4%, transparent)',
	accentActive:
		'color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 8%, transparent)',
	bg: 'var(--wp-components-color-background, #ffffff)',
	bgMuted: 'var(--wp-components-color-gray-100, #f0f0f0)',
	fg: 'var(--wp-components-color-foreground, #1e1e1e)',
	gray100: 'var(--wp-components-color-gray-100, #f0f0f0)',
	gray200: 'var(--wp-components-color-gray-200, #ebebeb)',
	gray300: 'var(--wp-components-color-gray-300, #dcdcde)',
	gray600: 'var(--wp-components-color-gray-600, #757575)',
	gray900: 'var(--wp-components-color-gray-900, #1e1e1e)',

	radiusSm: '2px',
	radiusMd: '4px',

	rowMinHeight: '44px',

	shadowStickyTop: 'inset 0 -1px 0 rgba(0, 0, 0, 0.08)',
	shadowStickyLeft: 'inset -1px 0 0 rgba(0, 0, 0, 0.08)',

	spaceXs: '4px',
	spaceSm: '8px',
	spaceMd: '12px',
	spaceLg: '16px',

	transitionFast: '120ms ease-out',

	fontSizeBody: '13px',
	fontSizeSmall: '11px',
	fontWeightRegular: 400,
	fontWeightMedium: 500,
	fontWeightBold: 600,

	/** Sticky z-index layering. Row-header > master > top headers > leaf cells. */
	zRowHeader: 4,
	zMaster: 3,
	zHeader: 3,
	zCell: 1,
} as const;

export type Tokens = typeof tokens;
