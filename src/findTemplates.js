import parseTaggedTemplate from './parseTaggedTemplate';
import { ancestor, base } from 'acorn/dist/walk';

const noNestedTTE = Object.assign( base, { TaggedTemplateExpression(){} } );

export default function findTemplates( ast, tag ) {
	const templates = [];
	ancestor( ast, {
		TaggedTemplateExpression( node, ancestors ) {
			if( node.tag.name !== tag ) return;
			const scope = getFnScope( ancestors );
			const { html, bindings } = parseTaggedTemplate( node.quasi, scope.params );
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
		if ( isFn.test( node.type ) ) return makeScope( node );
	}
}

function makeScope( scope ) {
	const result = {
		params: Object.create( null ),
		plucks: [],
		start: scope.start,
		end: scope.end
	}
	scope.params.reduce( ( hash, param, i ) => {
		if ( param.type === 'Identifier' ) hash[ param.name ] = true;
		else if( param.type === 'ObjectPattern' ) {
			param.properties.forEach( p => {
				console.log( p );
				const pluck = { key: p.key.name, index: i };
				result.plucks.push( pluck );
				hash[ `__ref${i}` ] = true;
			});
		}
		return hash;
	}, result.params );

	return result;
}

