import { useMemo } from 'react';
import type { Announcements, ScreenReaderInstructions, UniqueIdentifier } from '@dnd-kit/core';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Screen reader texts for dragging selected rows. dnd-kit's defaults are in
 * English and name a row by its key, which means nothing to the user.
 */
export const useSortableAnnouncements = (
	keys: string[],
	nameOf: (key: string) => string,
): { announcements: Announcements; screenReaderInstructions: ScreenReaderInstructions } =>
	useMemo(() => {
		const name = (id: UniqueIdentifier) => nameOf(String(id));
		const position = (id: UniqueIdentifier) => keys.indexOf(String(id)) + 1;

		return {
			announcements: {
				onDragStart: ({ active }) =>
					sprintf(
						/* translators: 1: item title, 2: position, 3: total */
						__('Picked up %1$s at position %2$d of %3$d.', 'valu-block-components'),
						name(active.id),
						position(active.id),
						keys.length,
					),
				onDragOver: ({ active, over }) =>
					over
						? sprintf(
								/* translators: 1: item title, 2: position, 3: total */
								__('%1$s is over position %2$d of %3$d.', 'valu-block-components'),
								name(active.id),
								position(over.id),
								keys.length,
							)
						: undefined,
				onDragEnd: ({ active, over }) =>
					over
						? sprintf(
								/* translators: 1: item title, 2: position, 3: total */
								__(
									'Dropped %1$s at position %2$d of %3$d.',
									'valu-block-components',
								),
								name(active.id),
								position(over.id),
								keys.length,
							)
						: sprintf(
								/* translators: %s: item title */
								__('Dropped %s.', 'valu-block-components'),
								name(active.id),
							),
				onDragCancel: ({ active }) =>
					sprintf(
						/* translators: %s: item title */
						__('Moving %s was cancelled.', 'valu-block-components'),
						name(active.id),
					),
			},
			screenReaderInstructions: {
				draggable: __(
					'To pick up an item, press space or enter. Use the arrow keys to move it. Press space or enter again to drop it in its new position, or escape to cancel.',
					'valu-block-components',
				),
			},
		};
	}, [keys, nameOf]);
