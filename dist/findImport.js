'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = findImport;

var _walk = require('acorn/dist/walk');

const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

function findImport(ast) {
	let specifier = null;
	(0, _walk.recursive)(ast, {}, {
		ImportDeclaration(node, state, c) {
			// TODO: expose as config so we don't have this weakish test
			// if( node.source.value !== MODULE_NAME ) return;
			if (!node.source.value.endsWith(MODULE_NAME)) return;
			specifier = node.specifiers.find(s => s.imported.name === SPECIFIER_NAME);
		}
	});
	return specifier;
}
//# sourceMappingURL=findImport.js.map
