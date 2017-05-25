// import astring from 'astring';

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
}