<?php
/**
 * Plugin Name: Valu Content Picker Demo
 * Description: Demo of @valu/block-components ContentPicker in the block editor.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * License: GPL-2.0-or-later
 *
 * @package Valu\CpDemo
 */

declare( strict_types=1 );

namespace Valu\CpDemo;

defined( 'ABSPATH' ) || exit;

/**
 * Register the demo block from build/.
 *
 * The block.json in build/ points at the compiled index.js and uses
 * render.php for the frontend output.
 */
function register_blocks(): void {
	$build_dir = __DIR__ . '/build';

	if ( ! file_exists( $build_dir . '/block.json' ) ) {
		add_action( 'admin_notices', __NAMESPACE__ . '\\missing_build_notice' );
		return;
	}

	register_block_type( $build_dir );
}
add_action( 'init', __NAMESPACE__ . '\\register_blocks' );

/**
 * Show an admin notice when the build is missing.
 */
function missing_build_notice(): void {
	echo '<div class="notice notice-warning"><p>';
	echo esc_html__(
		'Valu Content Picker Demo: run `npm run build` inside the example/ directory to compile the block.',
		'valu-cp-demo'
	);
	echo '</p></div>';
}

/**
 * Register the `valu_contact` custom post type that the demo Query Loop
 * variation scopes to. Exposed via REST so ContentPicker can search it.
 */
function register_contact_cpt(): void {
	register_post_type(
		'valu_contact',
		[
			'labels'       => [
				'name'          => __( 'Contacts', 'valu-cp-demo' ),
				'singular_name' => __( 'Contact', 'valu-cp-demo' ),
				'add_new_item'  => __( 'Add new contact', 'valu-cp-demo' ),
				'edit_item'     => __( 'Edit contact', 'valu-cp-demo' ),
			],
			'public'       => true,
			'show_in_rest' => true,
			'menu_icon'    => 'dashicons-id',
			'has_archive'  => true,
			'rewrite'      => [ 'slug' => 'contacts' ],
			'supports'     => [ 'title', 'editor', 'thumbnail', 'custom-fields' ],
		]
	);
}
add_action( 'init', __NAMESPACE__ . '\\register_contact_cpt' );

/**
 * Frontend: when the Query Loop carries `query.valu_post_in`, restrict the
 * WP_Query to those IDs in picker-chosen order. Mirrors the contract
 * established by the `valu-post-picker-to-query-loop` plugin so the two
 * are drop-in compatible.
 *
 * @param array    $query Vars about to be passed to WP_Query.
 * @param WP_Block $block The core/query block instance.
 * @return array Modified vars.
 */
function filter_query_loop_vars( array $query, $block ): array {
	$ids = $block->context['query']['valu_post_in'] ?? null;
	if ( ! is_array( $ids ) || count( $ids ) === 0 ) {
		return $query;
	}

	$normalized = array_values( array_unique( array_map( 'intval', $ids ) ) );
	if ( count( $normalized ) === 0 ) {
		return $query;
	}

	$query['post__in']       = $normalized;
	$query['orderby']        = 'post__in';
	$query['posts_per_page'] = count( $normalized );

	return $query;
}
add_filter( 'query_loop_block_query_vars', __NAMESPACE__ . '\\filter_query_loop_vars', 10, 2 );

/**
 * Editor preview parity: the Query block's inline preview hits the REST
 * contacts endpoint to render results. Honour `valu_post_in` there too so
 * the editor preview matches the frontend.
 *
 * @param array           $args    WP_Query args derived from the REST request.
 * @param WP_REST_Request $request The originating request.
 * @return array Modified args.
 */
function rest_support_valu_post_in( array $args, $request ): array {
	$ids = $request->get_param( 'valu_post_in' );
	if ( is_array( $ids ) && count( $ids ) > 0 ) {
		$args['post__in'] = array_map( 'intval', $ids );
		$args['orderby']  = 'post__in';
	}
	return $args;
}
add_filter( 'rest_valu_contact_query', __NAMESPACE__ . '\\rest_support_valu_post_in', 10, 2 );
