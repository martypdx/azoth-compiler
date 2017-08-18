import { UniqueStrings } from './unique-strings';
import { Imports } from './imports';
import { renderer } from '../transformers/fragment';
import { initBinder } from '../transformers/binding';
import parse from '../parse/template';
import { 
    templateToFunction, 
    makeTemplateStatements } from '../transformers/template';
import { 
    addStatementsTo,
    replaceStatements } from '../transformers/common';

const TAG = '_';
const OTAG = '$';
const MODULE_NAME = 'azoth';

export class Module {
    constructor({ tag = TAG, oTag = OTAG } = {}) {
        this.name = MODULE_NAME;
        // imports may modify tag and oTag based on found imports
        this.imports = new Imports({ tag, oTag });
        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        // track scope and current function
        this.scope = this.functionScope = Object.create(null);
        this.currentFn = null;
        this.currentReturnStmt = null;

        //track added statements
        this.statements = null;
        
        // all purpose module-wide 
        // ref counter for destructuring
        let ref = 0;
        this.getRef = () => `__ref${ref++}`;
    }

    get tag() {
        return this.imports.tag;
    }

    get oTag() {
        return this.imports.oTag;
    }

    addStatements(statements, index = 0) {
        if(!this.statements) this.statements = [];
        this.statements.push({ statements, index });
    }

    flushStatements(node, options) {
        if(!this.statements) return;
        addStatementsTo(node, this.statements, options);
        this.statements = null;
    }

    addDeclarations(body) {
        const { fragments, binders } = this;

        body.splice(0, 0, 
            // TODO: rename: all --> keys
            ...fragments.all.map(renderer), 
            ...binders.values.map(initBinder)
        );
    }

    // only used privately from makeTemplate
    addBinder(binder) {

        binder.matchObservables(this.scope);
        this.imports.addBinder(binder);

        const { declarations } = binder;
        let index = -1;
        declarations.forEach((d, i) => {
            const unique = JSON.stringify(d);
            const at = this.binders.add(unique, d);
            if(i === 0) index = at;
        });
        binder.moduleIndex = index;
        binder.properties.forEach(p => this.addBinder(p));
    }

    makeTemplate(node) {
        const { html, binders } = parse(node.quasi);
        const index = this.fragments.add(html);
         
        binders.forEach(b => this.addBinder(b));
        
        const statements = makeTemplateStatements({ binders, index });
        statements.forEach(node => node.subtemplate = true);
        
        // TODO: this.currentFn gets set by the observables handlers
        // (currentReturnStmt gets set by templates handlers),
        // which means this is coupled those set of handlers.
        const { currentFn, currentReturnStmt } = this;
        if(currentFn) {
            if(currentFn.body === node) {
                addStatementsTo(currentFn, [{ statements, index: 0 }]);
                currentFn.subtemplate = true;
            }
            else if(currentReturnStmt && currentReturnStmt.argument === node) {
                replaceStatements(currentFn.body.body, currentReturnStmt, statements);
            }
        } 
        
        if(!currentFn.subtemplate) node.subtemplate = true;

        templateToFunction(node, statements);
    }
}