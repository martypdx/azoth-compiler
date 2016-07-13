/* global describe, it */
import compile from '../src/compile';
import chai from 'chai';
const assert = chai.assert;

describe( 'compiler', () => {

	it( 'compiles template with various text nodes', () => {
		console.time('compile');
		const code = compile(
`import { html as $ } from 'diamond';
const template = (foo, place) => $\`*\${foo}<span>hello *\${place}</span>\${place}\``);
		console.timeEnd('compile');
		assert.equal( code, 
`import { renderer,makeFragment,__otb,__ctb } from 'diamond';
const template = (() => {
	const render = renderer(makeFragment(\`<text-node></text-node><span data-bind>hello <text-node></text-node></span><text-node></text-node>\`));
	const __otb0 = __otb(0);
	const __otb1 = __otb(2);
	const __ctb2 = __ctb(1);
	return (foo,place) => {
		const nodes = render();
		const __s0 = foo.subscribe(__otb0(nodes[1]));
		__otb1(nodes[1])(place.value);
		const __s2 = place.subscribe(__ctb2(nodes[0]));
		const __fragment = nodes[nodes.length];
		__fragment.unsubscribe = () => {
			__s0.unsubscribe();
			__s2.unsubscribe();
		};
		return __fragment;
	};
})()`);
	
	});


	it( 'compiles expression', () => {
		
		const code = compile(`(x, y) => $\`<span>*\${x + y}</span>\``);
		
		assert.equal( code, 
`(() => {
	const render = renderer(makeFragment(\`<span data-bind><text-node></text-node></span>\`));
	const __ctb0 = __ctb(0);
	return (x,y) => {
		const nodes = render();
		const __e0 = combineLatest(x,y,(x,y)=>(x + y));
		const __s0 = __e0.subscribe(__ctb0(nodes[0]));
		const __fragment = nodes[nodes.length];
		__fragment.unsubscribe = () => {
			__s0.unsubscribe();
		};
		return __fragment;
	};
})()`);
	
	});

});