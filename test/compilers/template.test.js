/*eslint no-undef: off */
import { schema, bindings, unsubscribes } from '../../src/compilers/template';
import Binder from '../../src/binders/binder';
import chai from 'chai';
const assert = chai.assert;

describe('compile template', () => {

    describe('schema', () => {

        it('all', () => {
            const binders = ['binder1', 'binder2'];
            const params = {
                params: ['param1', 'param2'],
                destructure: ['destructure1', 'destructure2']
            };
            const render = 'render0';
            const bindings = ['bindings1', 'bindings2'];
            const unsubscribes = ['unsubscribe1', 'unsubscribe1'];

            assert.strictEqual(schema({ binders, params, render, bindings, unsubscribes }),
`(() => {
    binder1
    binder2
    return (param1,param2) => {
        destructure1
        destructure2
        const __nodes = render0;
        bindings1
        bindings2
        const __fragment = __nodes[__nodes.length];
        __fragment.unsubscribe = () => {
            unsubscribe1
            unsubscribe1
        };
        return __fragment;
    };
})();
`);
        });

        it('no destructure or unsubscribe', () => {
            const binders = ['binder1', 'binder2'];
            const params = {
                params: ['param1', 'param2'],
                destructure: []
            };
            const render = 'render0';
            const bindings = ['bindings1', 'bindings2'];
            const unsubscribes = [];

            assert.strictEqual(schema({ binders, params, render, bindings, unsubscribes }),
`(() => {
    binder1
    binder2
    return (param1,param2) => {
        const __nodes = render0;
        bindings1
        bindings2
        return __nodes[__nodes.length];
    };
})();
`);
        });

        it('minimal', () => {
            const binders = [];
            const params = {
                params: [],
                destructure: []
            };
            const render = 'render0';
            const bindings = [];
            const unsubscribes = [];

            assert.strictEqual(schema({ binders, params, render, bindings, unsubscribes }),
`(() => {
    return () => {
        const __nodes = render0;
        return __nodes[__nodes.length];
    };
})();
`);
        });
    });

    describe('binders', () => {
        function getBinder(options, params, elIndex = 0) {
            const binder = new Binder(options);
            binder.params = params;
            binder.elIndex = elIndex;
            return binder;
        }    

        const binders =  [
            getBinder((() => foo).toOptions({ type: 'observer' }), ['foo']),
            getBinder((() => non).toOptions({ type: 'observable' }), []),
            getBinder((() => bar).toOptions({ type: 'value' }), ['bar']),
            getBinder((() => qux).toOptions({ type: 'observable' }), ['qux']),
        ];

        it('bindings', () => {
            assert.deepEqual(bindings(binders), [
                `const __sub0 = foo.subscribe(__bind0(__nodes[0]));`,
                `__bind1(__nodes[0])(non);`,
                `const __sub2 = bar.first().subscribe(__bind2(__nodes[0]));`,
                `const __sub3 = qux.subscribe(__bind3(__nodes[0]));`,
            ]);
        });

        it('unsubscribes', () => {
            assert.deepEqual(unsubscribes(binders), [
                `__sub0.unsubscribe();`,
                `__sub2.unsubscribe();`,
                `__sub3.unsubscribe();`,
            ]);
        });
    });


});