import { AT, NONE, STAR } from '../parse/sigil-types';
import { COMBINE, COMBINE_FIRST, FIRST, MAP, MAP_FIRST, SUBSCRIBE, VALUE } from './binding-types';
import matchObservables from './match-observables';

export default class Binder {

    constructor({ sigil = NONE, ast = null } = {}, target) {        
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
        const isTrueMap = sigil === STAR;

        if(sigil === AT) return SUBSCRIBE;
        if(!count) return VALUE;
        if(isIdentifier) return isTrueMap ? SUBSCRIBE : FIRST;
        if(count === 1) return isTrueMap ? MAP : MAP_FIRST;
        return isTrueMap ? COMBINE : COMBINE_FIRST;
    }
}