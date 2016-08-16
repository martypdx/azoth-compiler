import htmlparser from 'htmlparser2';
import undeclared from 'undeclared';
import astring from 'astring';

const attrPattern = /\s*?([a-zA-Z0-9\-]+?)=$/;
const specials = {
	on: 'event',
	class: 'class'
};

export default function parse( { expressions, quasis }, scopeParams = {}, recurse ){

	const getEl = ( name = 'root' ) => ({
		name, 
		attributes: {}, 
		bindings: [],
		childBindings: [],
		childCurrentIndex: -1
	});

	const fragment = getEl();
	const html = [];
	const stack = [];
	let currentEl = fragment;
	let inElTag = false;
	let currentAttr = null;

	const handler = {
		onopentagname( name ) {
			currentEl.childCurrentIndex++;
			stack.push( currentEl );
			
			currentEl = getEl( name );
			inElTag = true;
		},
		onattribute( name, value ) {
			currentEl.attributes[ currentAttr = name ] = value;
		},
		bindAttr( expr, binding ){
			const name = binding.name = currentAttr;
			// specialized binding type
			const parts = name.split( '-' );
			let type = '';
			if( parts.length > 1 && ( type = specials[ parts[0] ] ) ) {
				delete currentEl.attributes[ name ];
			}
			binding.type = type || 'attr';

			this.bind( expr, binding );
		},
		onopentag( name ) {
			const el = currentEl;
			const attrs = el.attributes;
			const attrsText = Object.keys( el.attributes ).map( key => {
				const val = attrs[key];
				return val == null ? key : `${key}="${val}"`;
			}).join(' ');

			el.htmlIndex = -2 + html.push(
				`<${name}${attrsText ? ' ' + attrsText : ''}`,
				'',
				`>`
			);
			delete el.attributes;
			currentAttr = null;
			inElTag = false;
		},
		ontext( text ) {
			html.push( text );
			if( currentEl ) currentEl.childCurrentIndex++;
		},
		bind( expr, binding ){
			const el = binding.el = currentEl;
			el.bound = true;

			if ( el === fragment ) {
				binding.type = 'orphan-text';
			}
			if ( binding.index === -1 ) binding.index = el.childCurrentIndex;
			
			if ( expr.type === 'Identifier' ) binding.ref = expr.name
			else {
				binding.expr = astring( expr );
				const params = Array
					.from( undeclared( expr ).values() )
					.filter( v => scopeParams[v] );
				binding.params = params;
			}

			el.bindings.push( binding );
		},
		unwrite( count = 1 ) {
			const index = html.length - 1;
			const current = html[ index ];
			html[ index ] = current.slice( 0, -count );
			if ( !html[ index ] ) currentEl.childCurrentIndex--;
		},
		bindSection( expr ){
			const el = currentEl;
			el.bound = true;

			if ( expr.type !== 'TaggedTemplateExpression' ) throw new Error( 'expected TTE' );

			el.bindings.push({  
				el, 
				type: 'section',
				// TODO [0] seems like big assumption
				template: recurse( expr )[0],
				index: el.childCurrentIndex
			});
		},
		onclosetag( name ) {
			html.push( `</${name}>` );
			const el = currentEl;
			currentEl = stack.pop();

			if( el.bound ) {
				html[ el.htmlIndex ] = ` data-bind`;
				currentEl.childBindings = currentEl.childBindings.concat( el.bindings );
			}
			if ( el.childBindings ) {
				currentEl.childBindings = currentEl.childBindings.concat( el.childBindings );
			}
		},
		onend() {
			if( fragment.childBindings.length ) {
				fragment.bindings = fragment.bindings.concat( fragment.childBindings );
			}
		}
	};

	var parser = new htmlparser.Parser( handler );

	quasis.forEach( ( quasi, i ) => {
		const raw =  quasi.value.raw;
		parser.write( raw );
		// TDOO extract to strategy for attr, text, etc. 
		// move behavior in handler into those
		const binding = {};

		function testObservable( at = 1 ) {
			const observable = raw[ raw.length - at ] === '*';
			if ( observable ) {
				handler.unwrite(1);
				binding.observable = observable;
			}
		}

		testObservable();

		if( currentAttr ) {
			if ( !attrPattern.test( raw ) ) throw 'unexpected ${...} in attributes';
			// finish the attr
			parser.write( '""' );
			binding.type = 'attr';
			handler.bindAttr( expressions[i], binding );
		}
		else if ( i < expressions.length && !inElTag ) {
			if( raw[ raw.length - 1 ] === '#' ) {
				handler.unwrite();
				// testObservable(2);
				parser.write( '<section-node></section-node>' );
				handler.bindSection( expressions[i] );
			}
			else {
				parser.write( '<text-node></text-node>' );
				binding.type = 'child-text';
				binding.index = -1 // auto-fill
				handler.bind( expressions[i], binding );
			}
		}
	});

	parser.end();

	let count = 0;
	const map = new Map();
	
	const orphans = [];
	fragment.bindings.forEach( b => {
		if ( b.el === fragment ) orphans.push( b );
		else {
			let index;
			if ( map.has( b.el ) ) {
				index = map.get( b.el );	
			}
			else {
				index = count++;
				map.set( b.el, index );
			}
			b.elIndex = index;
		}
		delete b.el;
	});

	orphans.forEach( b => b.elIndex = map.size );
	
	return { 
		html: html.join( '' ),
		bindings: fragment.bindings
	};
}