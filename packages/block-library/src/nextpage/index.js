/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pageBreak as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Page Break' ),
	description: __( 'Separate your content into a multi-page experience.' ),
	icon,
	keywords: [ __( 'next page' ), __( 'pagination' ) ],
	example: {},
	transforms,
	edit,
	save,
};
