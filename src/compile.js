import findImport from './findImport';
import findTemplates from './findTemplates';
import MagicString from 'magic-string';
import astring from 'astring';
import parse from './ast';

export default function compileAll(source) {
	const s = new MagicString(source);
	const ast = parse(source);

	const specifier = findImport(ast);
	const tag = specifier ? specifier.local.name : '$';
	const templates = findTemplates(ast, tag);

	const codes = new Set();
	const compile = compiler(s, codes);
	templates.map(compile);

	if (specifier) {
		s.overwrite(specifier.start, specifier.end, `renderer,makeFragment,${Array.from(codes.keys()).map(c => `__${c}`).join()}`);
	}
	
	return s.toString();
}

const bindingCode = {
	'orphan-text': 'otb',
	'child-text': 'ctb'
}



function compiler(s, codes) {


	return function compile({ html, bindings, scope, node }) {
		bindings.forEach(b => codes.add(bindingCode[b.type]));

		let code = 
`(() => {
	const render = renderer(makeFragment(\`${html}\`));
${bindings.map(declareBinding).join('\n')}
	return (${Object.keys(scope.params)}) => {
		const nodes = render();${scope.plucks.length ? '\n' + scope.plucks.map(pluck).join('\n') : ''}
${bindings.map(bind).join('\n')}
		const __fragment = nodes[nodes.length];
		__fragment.unsubscribe = () => {
${bindings.map(unsubscribe).join('')}
		};
		return __fragment;
	};
})()`;

		s.overwrite(scope.start, scope.end, code);
	}

}

function declareBinding(b, i) {
	return `	const __${bindingCode[b.type]}${i} = __${bindingCode[b.type]}(${b.index});`;
}

function bind(b, i) {
	return b.ref ? bindReference(b, i) : bindExpression(b, i);
}

function bindReference(b, i) {
	return b.observable ? bindObservable(b, i) : bindStatic(b, i);
}

function bindObservable(b, i) {
	return `		const __s${i} = ${b.ref}.subscribe(__${bindingCode[b.type]}${i}(nodes[${b.elIndex}]));`
}

function bindStatic(b, i) {
	return `		__${bindingCode[b.type]}${i}(nodes[${b.elIndex}])(${b.ref}.value);`
}

function bindExpression(b, i) {
	b.ref = `__e${i}`;
	const expr = `		const ${b.ref} = combineLatest(${b.params},(${b.params})=>(${b.expr}));`
	return expr + '\n' + bindObservable(b, i);
}

function unsubscribe(b, i, arr) {
	if (!b.observable) return;
	return `			__s${i}.unsubscribe();${ i === arr.length - 1 ? '' : '\n' }`;
}

function pluck(pluck) {
	return `		const ${pluck.key} = __ref${pluck.index}.pluck('${pluck.key}').distinctUntilChanged();`;
}
