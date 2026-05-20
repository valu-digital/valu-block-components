<?php
/**
 * Server-side render for the Content Picker Demo block.
 *
 * @package Valu\CpDemo
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (unused).
 * @var WP_Block $block      Block instance.
 */

declare( strict_types=1 );

$related  = is_array( $attributes['related'] ?? null ) ? $attributes['related'] : [];
$featured = is_array( $attributes['featured'] ?? null ) ? $attributes['featured'] : [];
$author   = is_array( $attributes['author'] ?? null ) ? $attributes['author'] : [];

if ( empty( $related ) && empty( $featured ) && empty( $author ) ) {
	return;
}

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'valu-cp-demo-output',
	]
);

echo '<section ' . $wrapper_attributes . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

if ( ! empty( $featured ) ) {
	$term    = reset( $featured );
	$term_id = isset( $term['id'] ) ? absint( $term['id'] ) : 0;
	if ( $term_id ) {
		$term_obj = get_term( $term_id );
		if ( $term_obj && ! is_wp_error( $term_obj ) ) {
			printf(
				'<p class="valu-cp-demo-output__featured"><strong>%1$s:</strong> <a href="%2$s">%3$s</a></p>',
				esc_html__( 'Featured category', 'valu-cp-demo' ),
				esc_url( get_term_link( $term_obj ) ),
				esc_html( $term_obj->name )
			);
		}
	}
}

if ( ! empty( $author ) ) {
	$user    = reset( $author );
	$user_id = isset( $user['id'] ) ? absint( $user['id'] ) : 0;
	if ( $user_id ) {
		$user_obj = get_userdata( $user_id );
		if ( $user_obj ) {
			printf(
				'<p class="valu-cp-demo-output__author"><strong>%1$s:</strong> %2$s</p>',
				esc_html__( 'Primary author', 'valu-cp-demo' ),
				esc_html( $user_obj->display_name )
			);
		}
	}
}

if ( ! empty( $related ) ) {
	echo '<h3>' . esc_html__( 'Related', 'valu-cp-demo' ) . '</h3>';
	echo '<ul class="valu-cp-demo-output__list">';
	foreach ( $related as $item ) {
		$post_id = isset( $item['id'] ) ? absint( $item['id'] ) : 0;
		if ( ! $post_id ) {
			continue;
		}
		$post_obj = get_post( $post_id );
		if ( ! $post_obj || 'publish' !== $post_obj->post_status ) {
			continue;
		}
		printf(
			'<li><a href="%1$s">%2$s</a></li>',
			esc_url( get_permalink( $post_obj ) ),
			esc_html( get_the_title( $post_obj ) )
		);
	}
	echo '</ul>';
}

echo '</section>';
