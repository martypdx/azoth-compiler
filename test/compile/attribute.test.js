import test from 'ava';
import { fromString } from './_macros';

test('simple attribute', fromString, `
    import { html as _ } from 'azoth';
    const template = name => _\`<span class=\${name}>Hello World</span>\`;
`);