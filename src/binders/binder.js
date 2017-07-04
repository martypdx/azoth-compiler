import { generate } from 'astring';
import { VALUE, MAP, SUBSCRIBE } from './binding-types';
import matchObservables from './match-observables';

export default class Binder {

    constructor({ type = VALUE, ast = null } = {}, target) {        
        this.type = type;
        this.ast = ast;
        this.undeclareds = null;
        this.observables = [];

        this.elIndex = -1;
        this.templates = null;
        
        this.moduleIndex = -1;
        this.target = target;

        this.index = -1;
        this.name = '';        
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    matchObservables(scope) {
        if(this.type === SUBSCRIBE) return;
        this.observables = matchObservables(this.ast, scope);
    }

    get html() {
        return this.target.html;
    }

    get declaration() {
        return this.target.init(this);
    }

    get typeImport() {
        if(this.type !== MAP || this.ast.type === 'Identifier') return;
        
        switch(this.observables.length) {
            case 0:
                return;
            case 1:
                return '__map';
            default:
                return '__combine';
        }
    }

    get isSubscriber() {
        const { type, observables } = this;
        return (type === SUBSCRIBE || (!!observables && observables.length > 0));
    }

    writeBinding(observer) { 
        const { ast, observables, type } = this;
        const isIdentifier = ast.type === 'Identifier';

        const expr = isIdentifier ? ast.name : generate(ast);
        if ((!observables || !observables.length) && type !== SUBSCRIBE) {
            return `${observer}(${expr})`;
        }

        let observable = '';

        if(isIdentifier) {
            observable = expr;
        }
        else {
            if (type === SUBSCRIBE) {
                observable = `(${expr})`;
            }
            else {
                observable = observables.join();
                const map = `(${observable}) => (${expr})`;

                if (observables.length > 1) {
                    observable = `combineLatest(${observable}, ${map})`;
                }
                else {
                    observable += `.map(${map})`;
                }
            }
        }

        if(type === VALUE) observable += `.first()`;

        return this.addSubscribe(observable, observer);
    }


}