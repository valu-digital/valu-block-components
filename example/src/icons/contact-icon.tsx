import { SVG, Path } from '@wordpress/primitives';

/**
 * Custom id-card icon for the Contact CPT. Returned as a JSX element so
 * it plugs into both `registerBlockVariation({ icon })` and the
 * ContentPicker `icons` map (value type matches `<Icon icon={…}>`).
 */
export const contactIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12zM9 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 1.5c-1.54 0-4 .84-4 2.5v.5h8V16c0-1.66-2.46-2.5-4-2.5zM13 9h6v1h-6V9zm0 2h5v1h-5v-1zm0 2h4v1h-4v-1z" />
	</SVG>
);
