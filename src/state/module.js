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
const MODULE_NAME = 'azoth';

export class Module {
    constructor({ tag = TAG } = {}) {
        this.name = MODULE_NAME;
        // TODO: tag comes back from imports
        // and may be aliased so this needs
        // to account for that
        this.tag = tag;
        this.imports = new Imports({ tag });
        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        // track scope and current function
        this.scope = this.functionScope = Object.create(null);
        this.currentFn = null;
        this.returnStatement = null;

        //track added statements
        this.statements = null;
        
        // all purpose module-wide 
        // ref counter for destructuring
        let ref = 0;
        this.getRef = () => `__ref${ref++}`;
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

    addBinder(binder) {
        this.imports.addBinder(binder);

        const { declaration } = binder;
        const unique = JSON.stringify(declaration);
        return this.binders.add(unique, declaration);
    }

    makeTemplate(node) {
        const { html, binders } = parse(node.quasi);

        const index = this.fragments.add(html);
        binders.forEach(b => {
            b.matchObservables(this.scope);
            b.moduleIndex = this.addBinder(b);
        });
        
        const statements = makeTemplateStatements({ binders, index });
        
        // TODO: this.currentFn gets set by the observables handlers,
        // which means this is coupled those set of handlers.
        const { currentFn, returnStatement } = this;
        if(currentFn) {
            if(currentFn.body === node) addStatementsTo(currentFn, [{ statements, index: 0 }]);
            else if(returnStatement && returnStatement.argument === node) {
                replaceStatements(currentFn.body.body, returnStatement, statements);
            }
        }

        templateToFunction(node, statements);
    }
}