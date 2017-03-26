/* global describe, it */
import findTemplates from '../src/findTemplates';
import parse from '../src/ast';
import chai from 'chai';
const assert = chai.assert;

describe('find templates', () => {

	function getTemplates(source, tag = '$') {
		return findTemplates(parse(source), tag);
	}

	describe('find', () => {

		it('tagged templates', () => {
			
			const templates = getTemplates(`
				import { html as $ } from 'diamond';
				const template = (foo, bar) => $\`<span class-foo=\${foo}>hello \${place}</span>\`;
			`);


			assert.equal(templates.length, 1);
			const { html, bindings, scope, node } = templates[0];
			assert.ok(html);
			assert.ok(scope);
			assert.ok(bindings);
			assert.ok(node);

		});

		it('ignores nested templates', () => {
			
			const templates = getTemplates`
				import { html as $ } from 'diamond';
				const template = items => $\`
					<ul>
						\${ items.map(item => $\`
							<li>\${ item }</li>
						\`)}
					</ul>
				\`;
				export default template;
			`;

			assert.equal(templates.length, 1);
		});

		it('sibling templates', () => {
			
			const templates = getTemplates`
				import { html as $ } from 'diamond';
				const template1 = foo => $\`\${foo}\`;
				const template2 = foo => $\`\${foo}\`;
			`;

			assert.equal(templates.length, 2);
		});

	});

	describe('parse', () => {

		it('orphan text value', () => {
			const templates = getTemplates(`
				const template = foo => $\`\*\${foo}\`;
			`)

			const { html, bindings, scope, node } = templates[0];
			assert.equal(html, '<text-node></text-node>');
			assert.equal(node.type, 'TaggedTemplateExpression');
			
			assert.deepEqual(bindings, [{
				elIndex: 0,
				index: 0,
				observable: true,
				ref: 'foo',
				type: 'orphan-text'
			}]);
		});

		it('child text value', () => {
			const templates = getTemplates(`
				const template = place => $\`<span>hello *\${place}</span>\`;
			`)

			const { html, bindings, scope, node } = templates[0];
			assert.equal(html, '<span data-bind>hello <text-node></text-node></span>');
			assert.equal(node.type, 'TaggedTemplateExpression');
			
			assert.deepEqual(bindings, [{
				elIndex: 0,
				index: 1,
				observable: true,
				ref: 'place',
				type: 'child-text'
			}]);
		});

		it('block value', () => {
			
			const templates = getTemplates(`
				const template = place => $\`<div>#\${$\`<span>*\${foo}</span>\`}</div>\`;
			`)

			const { html, bindings, scope, node } = templates[0];
			
			assert.equal(html, '<div data-bind><section-node></section-node></div>');
			
			delete bindings[0].template.node;

			assert.deepEqual(bindings, [{
				elIndex: 0,
				index: 0,
				type: 'section',
				template: {
					html: '<span data-bind><text-node></text-node></span>',
					bindings: [{
						elIndex: 0,
						index: 0,
						observable: true,
						ref: 'foo',
						type: 'child-text'
					}],
					scope: void 0
				}
			}]);
		});
	})
});