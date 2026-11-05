<?php
/**
 * Server-side render for the Matrix Demo block: lists the stored cell keys.
 *
 * @package Valu\CpDemo
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (unused).
 * @var WP_Block $block      Block instance.
 */

declare( strict_types=1 );

$value = is_array( $attributes['value'] ?? null ) ? $attributes['value'] : [];
if ( empty( $value ) ) {
	return;
}

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'valu-mx-demo-output' ] );
echo '<section ' . $wrapper_attributes . '><ul>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
foreach ( $value as $key ) {
	printf( '<li><code>%s</code></li>', esc_html( (string) $key ) );
}
echo '</ul></section>';
