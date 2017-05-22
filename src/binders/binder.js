import astring from 'astring';

// const isParam = name => identifiers.has(name);

// const getParams = (expr) => Array
//     .from(undeclared(expr).values())
//     .filter(isParam);

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

    bind() {
        // const { ast } = this.ast;
        // this.expr = ast.type === 'Identifier' ? ast.name : astring(ast);
    }
}