<?php
/**
 * Server-side render for the Document Picker Demo block.
 *
 * @package Valu\CpDemo
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (unused).
 * @var WP_Block $block      Block instance.
 */

declare( strict_types=1 );

$multi  = is_array( $attributes['documentsMulti'] ?? null ) ? $attributes['documentsMulti'] : [];
$single = is_array( $attributes['documentSingle'] ?? null ) ? $attributes['documentSingle'] : [];
$inline = is_array( $attributes['documentsInline'] ?? null ) ? $attributes['documentsInline'] : [];

if ( empty( $multi ) && empty( $single ) && empty( $inline ) ) {
	return;
}

$render_doc = static function ( array $item ): string {
	$id = isset( $item['id'] ) ? absint( $item['id'] ) : 0;
	if ( ! $id ) {
		return '';
	}
	$url = wp_get_attachment_url( $id );
	if ( ! $url ) {
		return '';
	}
	$title = get_the_title( $id );
	if ( '' === $title ) {
		$title = basename( $url );
	}
	$ext = strtoupper( pathinfo( wp_parse_url( $url, PHP_URL_PATH ) ?? '', PATHINFO_EXTENSION ) );
	return sprintf(
		'<li><span class="valu-dp-demo__ext">%1$s</span><a href="%2$s">%3$s</a></li>',
		esc_html( $ext ),
		esc_url( $url ),
		esc_html( $title )
	);
};

$render_list = static function ( array $items, string $heading ) use ( $render_doc ): void {
	$rows = array_filter( array_map( $render_doc, $items ) );
	if ( empty( $rows ) ) {
		return;
	}
	printf( '<h3>%s</h3>', esc_html( $heading ) );
	echo '<ul class="valu-dp-demo__list">';
	foreach ( $rows as $row ) {
		echo $row; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
	echo '</ul>';
};

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'valu-dp-demo-output' ] );
echo '<section ' . $wrapper_attributes . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

$render_list( $multi, __( 'Selected documents', 'valu-cp-demo' ) );
$render_list( $single, __( 'Featured PDF', 'valu-cp-demo' ) );
$render_list( $inline, __( 'Inline-picked documents', 'valu-cp-demo' ) );

echo '</section>';
