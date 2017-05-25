// import astring from 'astring';
import getObservables from './get-observables';

export default class Binder {
    constructor({ type = 'value', ast = null } = {}) {        
        this.type = type;
        this.params = null;
        this.ast = ast;
        this.elIndex = -1;
        this.templates = null;
        
        // this.index = -1;
        // this.expr = '';
        
    }

    calculate({ identifiers, recurse }) {
        this.templates = recurse(this.ast);
        this.params = getObservables(this.ast, identifiers);
    }
}