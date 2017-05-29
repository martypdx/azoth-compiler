/*eslint no-undef: off */
import { bindings } from '../../src/compilers/template';
import Binder from '../../src/binders/binder';
import chai from 'chai';
const assert = chai.assert;

describe.only('binders', () => {

    function getBinder(options, params, elIndex = 0) {
        const binder = new Binder(options);
        binder.params = params;
        binder.elIndex = elIndex;
        return binder;
    }    

    it('collates observer identifier binders', () => {
        const binders = [
            getBinder((() => foo).toOptions({ type: 'observer' }), ['foo']),
            getBinder((() => bar).toOptions({ type: 'value' }), ['bar']),
            getBinder((() => qux).toOptions({ type: 'observable' }), ['qux']),
            getBinder((() => not).toOptions({ type: 'observable' }), []),
        ];

        assert.deepEqual(bindings(binders), [
            `const __sub0 = foo.subscribe(__bind0(__nodes[0]));`,
            `const __sub1 = bar.first().subscribe(__bind1(__nodes[0]));`,
            `const __sub2 = qux.subscribe(__bind2(__nodes[0]));`,
            `__bind3(__nodes[0])(not);`
        ]);


    });
});