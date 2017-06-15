const walk = require('acorn/dist/walk');
const { parse } = require('acorn');
const { simple, base } = walk;
const { generate } = require('astring');

const templates = [];

const options = {
    ecmaVersion: 8,
    sourceType: 'module'
};

const ast = parse('foo => _`<span>${ _`nested` }</span>`', options);

simple(ast, {
    TaggedTemplateExpression(node, st) {
        st.push(node);
        // console.log('TTE'); //JSON.stringify(node, true, 2));
        // base.TaggedTemplateExpression(node, st, c);
    },

}, base, templates);

// console.log(templates.length);

// console.log(JSON.stringify(parse('const __sub0 = foo.subscribe(__bind0(__nodes[0]));').body[0], true, 4));

// parse(`	const __fragment = __nodes[__nodes.length - 1];
// 	__fragment.unsubscribe = () => {};
// 	return __fragment;`, {
//     ecmaVersion: 8,
//     sourceType: 'script',
//     allowReturnOutsideFunction: true
// });

const quick = parse('const template = _``;', options);

// const fragment = parse(`
//     const __fragment = __nodes[__nodes.length - 1];
//     __fragment.unsubscribe = () => {

//     };
//     return __fragment;
// `, { allowReturnOutsideFunction: true }).body;

// const template = parse(`(() => {
    
// })()`, { allowReturnOutsideFunction: true }).body;

console.log(JSON.stringify(quick, true, 2));