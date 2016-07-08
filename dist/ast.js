'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = ast;

var _acorn = require('acorn');

const options = {
	ecmaVersion: 7,
	preserveParens: true,
	sourceType: 'module'
};

function ast(source) {
	return (0, _acorn.parse)(source, options);
}
//# sourceMappingURL=ast.js.map
