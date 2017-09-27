import test from 'ava';
import { fromSource } from './_macros';
import compile from '../../src/compilers/compile.js';

test('oninit', fromSource, () => {
    const template = () => _`<span oninit=${node => node.innerText= 'Foo'}></span>`;
});