import { AT, DOLLAR, NONE, STAR } from '../parse/sigil-types';
import { text } from './targets';
import { COMBINE, COMBINE_FIRST, FIRST, MAP, MAP_FIRST, SUBSCRIBE, VALUE } from './binding-types';
import matchObservables from './match-observables';

export default class Binder {

    constructor({ sigil = NONE, ast = null, target = text } = {}) {        
        this.sigil = sigil;
        this.ast = ast;
        this.target = target;
        
        this.observables = [];
        this.elIndex = -1;
        this.moduleIndex = -1;
        
        this.index = -1;
        this.name = '';        
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    get html() {
        return this.target.html;
    }

    get declaration() {
        return this.target.init(this);
    }

    matchObservables(scope) {
        this.observables = matchObservables(this.ast, scope);
    }

    get type() {
        const { sigil, ast, observables } = this;
        const isIdentifier = ast.type === 'Identifier';
        const count = observables.length;

        if(sigil === AT) return SUBSCRIBE;
        if(sigil === NONE || count === 0) return VALUE;
        if(sigil === DOLLAR) {
            if(isIdentifier) return FIRST;
            return (count === 1) ? MAP_FIRST : COMBINE_FIRST;
        }
        if(sigil === STAR) {
            if(isIdentifier) return SUBSCRIBE;
            return (count === 1) ? MAP : COMBINE;
        }
    }
}