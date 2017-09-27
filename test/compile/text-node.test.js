/*eslint no-unused-vars: off */
import test from 'ava';
import compile from '../../src/compilers/compile.js';

test('hello world', t => {
    const source = `
        import { html as _ } from 'azoth';
        const template = (greeting, name) => _\`<span>\${greeting} \${name}</span>\`;
    `;

    t.snapshot(compile(source));
}); 
