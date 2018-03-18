import { SUBSCRIBE_SIGIL, ONCE_SIGIL, NO_SIGIL, MAP_SIGIL } from '../parse/sigil-types';
import { text } from './targets';
import { COMBINE, COMBINE_FIRST, FIRST, MAP, MAP_FIRST, SUBSCRIBE, VALUE } from './binding-types';
import matchObservables from './match-observables';

export default class Binder {

    constructor({ sigil = NO_SIGIL, ast = null, target = text, name = '', childTemplate = null } = {}) {        
        this.sigil = sigil;
        this.ast = ast;
        this.target = target;
        
        this.observables = [];
        this.elIndex = -1;
        this.moduleIndex = -1;
        
        this.index = -1;
        this.name = name;
        
        this.properties = [];
        this.childTemplate = childTemplate;
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    get html() {
        return this.target.html;
    }

    get isChildIndex() {
        return this.target.childIndex;
    }

    get childIndex() {
        return this.index + this.target.indexAdjustment;
    }

    get binderName() {
        return this.target.name;
    }

    get declaration() {
        return this.target.init(this);
    }
    
    get declarations() {
        const declarations = [this.declaration];
        if(this.properties) {
            declarations.push(...this.properties.map(p => p.declaration));
        }
        return declarations;
    }

    matchObservables(scope) {
        this.observables = matchObservables(this.ast, scope);
    }

    get type() {
        const { sigil, ast, observables } = this;
        const isIdentifier = ast.type === 'Identifier';
        const count = observables.length;

        if(sigil === SUBSCRIBE_SIGIL) return SUBSCRIBE;
        if(sigil === NO_SIGIL || count === 0) return VALUE;
        if(sigil === ONCE_SIGIL) {
            if(isIdentifier) return FIRST;
            return (count === 1) ? MAP_FIRST : COMBINE_FIRST;
        }
        if(sigil === MAP_SIGIL) {
            if(isIdentifier) return SUBSCRIBE;
            return (count === 1) ? MAP : COMBINE;
        }
    }
}