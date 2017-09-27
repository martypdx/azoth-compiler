import test from 'ava';
import compile from '../../src/compilers/compile.js';

test('nested templates', t => {
    const source = () => {
        const template = name => _`<span class=${name}>Hello World</span>`;
    };

    t.snapshot(compile(source));
});