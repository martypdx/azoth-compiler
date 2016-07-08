import parseTaggedTemplate from './parseTaggedTemplate';
import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign( base, { TaggedTemplateExpression(){} } );

export default function findTemplates( ast, tag ) {
	const templates = [];
	ancestor( ast, {
		TaggedTemplateExpression( node, ancestors ) {
			if( node.tag.name !== tag ) return;
			const { html, bindings } = parseTaggedTemplate( node.quasi );
			const scope = getFnScope( ancestors );
			templates.push( { html, bindings, scope, node } );
		}
	}, noNestedTTE );
	return templates;
}

const isFn = /function/i;

function getFnScope( ancestors ) {
	// current child node is in stack, so -2
	let i = ancestors.length - 2;
	let node = null;
	while( node = ancestors[i--] ) {
		if ( isFn.test( node.type ) ) return node;
	}
}

