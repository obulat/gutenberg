/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useRef } from '@wordpress/element';
import {
	Button,
	ButtonGroup,
	Dropdown,
	KeyboardShortcuts,
	PanelBody,
	RangeControl,
	TextControl,
	ToolbarButton,
	ToolbarItem,
} from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import {
	BlockControls,
	InspectorControls,
	InspectorAdvancedControls,
	RichText,
	useBlockProps,
	__experimentalLinkControl as LinkControl,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';
import { link, linkOff } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import getColorAndStyleProps from './color-props';

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_BORDER_RADIUS_POSITION = 5;

const EMPTY_ARRAY = [];

function BorderPanel( { borderRadius = '', setAttributes } ) {
	const initialBorderRadius = borderRadius;
	const setBorderRadius = useCallback(
		( newBorderRadius ) => {
			if ( newBorderRadius === undefined )
				setAttributes( {
					borderRadius: initialBorderRadius,
				} );
			else setAttributes( { borderRadius: newBorderRadius } );
		},
		[ setAttributes ]
	);
	return (
		<PanelBody title={ __( 'Border settings' ) }>
			<RangeControl
				value={ borderRadius }
				label={ __( 'Border radius' ) }
				min={ MIN_BORDER_RADIUS_VALUE }
				max={ MAX_BORDER_RADIUS_VALUE }
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				allowReset
				onChange={ setBorderRadius }
			/>
		</PanelBody>
	);
}

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		const width = selectedWidth === newWidth ? undefined : newWidth;

		// Update attributes
		setAttributes( { width } );
	}

	return (
		<PanelBody title={ __( 'Width settings' ) }>
			<ButtonGroup aria-label={ __( 'Button width' ) }>
				{ [ 25, 50, 75, 100 ].map( ( widthValue ) => {
					return (
						<Button
							key={ widthValue }
							isSmall
							isPrimary={ widthValue === selectedWidth }
							onClick={ () => handleChange( widthValue ) }
						>
							{ widthValue }%
						</Button>
					);
				} ) }
			</ButtonGroup>
		</PanelBody>
	);
}

function URLPicker( {
	isSelected,
	url,
	setAttributes,
	opensInNewTab,
	onToggleOpenInNewTab,
	anchorRef,
} ) {
	const urlIsSet = !! url;
	const urlIsSetandSelected = urlIsSet && isSelected;

	const renderToolbarItem = ( {
		ref: toolbarItemRef,
		...toolbarItemProps
	} ) => {
		const useToggle = ( { ref: toggleRef, onToggle, onClose } ) => {
			const onRemove = ( { type } ) => {
				setAttributes( {
					url: undefined,
					linkTarget: undefined,
					rel: undefined,
				} );
				if ( type === 'keydown' ) {
					onClose();
				}
			};
			const ref = useMergeRefs( [ toolbarItemRef, toggleRef ] );
			const toggleProps = {
				ref,
				name: 'link',
				...toolbarItemProps,
				...( ! urlIsSet
					? {
							icon: link,
							title: __( 'Link' ),
							shortcut: displayShortcut.primary( 'k' ),
					  }
					: {
							icon: linkOff,
							title: __( 'Unlink' ),
							shortcut: displayShortcut.primaryShift( 'k' ),
							isActive: true,
							onClick: onRemove,
					  } ),
			};
			return (
				<>
					<ToolbarButton name="link" { ...toggleProps } />
					<KeyboardShortcuts
						bindGlobal
						shortcuts={ {
							[ rawShortcut.primary( 'k' ) ]: onToggle,
							[ rawShortcut.primaryShift( 'k' ) ]: onRemove,
						} }
					/>
				</>
			);
		};
		return (
			<Dropdown
				autoClose={ false }
				openOnMount={ urlIsSetandSelected }
				position="bottom center"
				popoverProps={ { anchorRef: anchorRef?.current } }
				renderToggle={ useToggle }
				renderContent={ () => (
					<LinkControl
						className="wp-block-navigation-link__inline-link-input"
						value={ { url, opensInNewTab } }
						onChange={ ( {
							url: newURL = '',
							opensInNewTab: newOpensInNewTab,
						} ) => {
							setAttributes( { url: newURL } );

							if ( opensInNewTab !== newOpensInNewTab ) {
								onToggleOpenInNewTab( newOpensInNewTab );
							}
						} }
					/>
				) }
			/>
		);
	};
	return (
		<>
			<BlockControls group="block">
				<ToolbarItem>{ renderToolbarItem }</ToolbarItem>
			</BlockControls>
		</>
	);
}

function ButtonEdit( props ) {
	const {
		attributes,
		setAttributes,
		className,
		isSelected,
		onReplace,
		mergeBlocks,
	} = props;
	const {
		borderRadius,
		linkTarget,
		placeholder,
		rel,
		text,
		url,
		width,
	} = attributes;
	const onSetLinkRel = useCallback(
		( value ) => {
			setAttributes( { rel: value } );
		},
		[ setAttributes ]
	);
	const colors = useEditorFeature( 'color.palette' ) || EMPTY_ARRAY;

	const onToggleOpenInNewTab = useCallback(
		( value ) => {
			const newLinkTarget = value ? '_blank' : undefined;

			let updatedRel = rel;
			if ( newLinkTarget && ! rel ) {
				updatedRel = NEW_TAB_REL;
			} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
				updatedRel = undefined;
			}

			setAttributes( {
				linkTarget: newLinkTarget,
				rel: updatedRel,
			} );
		},
		[ rel, setAttributes ]
	);

	const setButtonText = ( newText ) => {
		// Remove anchor tags from button text content.
		setAttributes( { text: newText.replace( /<\/?a[^>]*>/g, '' ) } );
	};

	const colorProps = getColorAndStyleProps( attributes, colors, true );
	const ref = useRef();
	const blockProps = useBlockProps( { ref } );

	return (
		<>
			<div
				{ ...blockProps }
				className={ classnames( blockProps.className, {
					[ `has-custom-width wp-block-button__width-${ width }` ]: width,
				} ) }
			>
				<RichText
					aria-label={ __( 'Button text' ) }
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setButtonText( value ) }
					withoutInteractiveFormatting
					className={ classnames(
						className,
						'wp-block-button__link',
						colorProps.className,
						{
							'no-border-radius': borderRadius === 0,
						}
					) }
					style={ {
						borderRadius: borderRadius
							? borderRadius + 'px'
							: undefined,
						...colorProps.style,
					} }
					onSplit={ ( value ) =>
						createBlock( 'core/button', {
							...attributes,
							text: value,
						} )
					}
					onReplace={ onReplace }
					onMerge={ mergeBlocks }
					identifier="text"
				/>
			</div>
			<URLPicker
				url={ url }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
				opensInNewTab={ linkTarget === '_blank' }
				onToggleOpenInNewTab={ onToggleOpenInNewTab }
				anchorRef={ ref }
			/>
			<InspectorControls>
				<BorderPanel
					borderRadius={ borderRadius }
					setAttributes={ setAttributes }
				/>
				<WidthPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					label={ __( 'Link rel' ) }
					value={ rel || '' }
					onChange={ onSetLinkRel }
				/>
			</InspectorAdvancedControls>
		</>
	);
}

export default ButtonEdit;
