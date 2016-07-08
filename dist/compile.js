'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = compileAll;

var _findImport = require('./findImport');

var _findImport2 = _interopRequireDefault(_findImport);

var _findTemplates = require('./findTemplates');

var _findTemplates2 = _interopRequireDefault(_findTemplates);

var _magicString = require('magic-string');

var _magicString2 = _interopRequireDefault(_magicString);

var _astring = require('astring');

var _astring2 = _interopRequireDefault(_astring);

var _ast = require('./ast');

var _ast2 = _interopRequireDefault(_ast);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function compileAll(source) {
	const s = new _magicString2.default(source);
	const ast = (0, _ast2.default)(source);

	const specifier = (0, _findImport2.default)(ast);
	const tag = specifier ? specifier.local.name : '$';
	const templates = (0, _findTemplates2.default)(ast, tag);

	const codes = new Set();
	const compile = compiler(s, codes);
	templates.map(compile);

	if (specifier) {
		s.overwrite(specifier.start, specifier.end, `renderer,makeFragment,${ Array.from(codes.keys()).map(c => `__${ c }`).join() }`);
	}

	return s.toString();
}

const bindingCode = {
	'orphan-text': 'tb',
	'child-text': 'tb'
};

function declareBinding(b, i) {
	return `	const __${ bindingCode[b.type] }${ i } = __${ bindingCode[b.type] }(${ b.index });`;
}
function bindObservable(b, i) {
	return `		const __s${ i } = ${ b.ref }.subscribe(__${ bindingCode[b.type] }${ i }(nodes[${ b.elIndex }]));`;
}

function bindStatic(b, i) {
	return `		__${ bindingCode[b.type] }${ i }(nodes[${ b.elIndex }])(${ b.ref }.value);`;
}

function unsubscribe(b, i, arr) {
	if (!b.observable) return;
	return `			__s${ i }.unsubscribe();${ i === arr.length - 1 ? '' : '\n' }`;
}

function compiler(magicString, codes) {

	const s = magicString;

	function compile({ html, bindings, scope, node }) {
		bindings.forEach(b => codes.add(bindingCode[b.type]));

		let code = `(() => {
	const render = renderer(makeFragment(\`${ html }\`));
${ bindings.map(declareBinding).join('\n') }
	return (${ scope.params.map(_astring2.default) }) => {
		const nodes = render();
${ bindings.map((b, i) => b.observable ? bindObservable(b, i) : bindStatic(b, i)).join('\n') }
		const __fragment = nodes[nodes.length];
		__fragment.unsubscribe = () => {
${ bindings.map(unsubscribe).join('') }
		};
		return __fragment;
	};
})()`;

		s.overwrite(scope.start, scope.end, code);
	}

	return compile;
}
//# sourceMappingURL=compile.js.map
