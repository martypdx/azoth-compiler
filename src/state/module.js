import { UniqueStrings } from './unique-strings';
import { Imports } from './imports';
import { renderer } from '../transformers/fragment';
import parse from '../parse/template';
import { 
    blockToFunction, 
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
        const { fragments } = this;

        body.splice(0, 0, ...fragments.keys.map(renderer));
    }

    // only used privately from makeTemplate
    addBinder(binder) {
        if(binder.childTemplate) {
            if(binder.ast) throw new Error('Binders with child templates not expected to have ast');
            const statements = this.addTemplate(binder.childTemplate);
            binder.ast = blockToFunction(statements);
        }

        binder.matchObservables(this.scope);
        this.imports.addBinder(binder);
        binder.properties.forEach(p => this.addBinder(p));
    }

    makeTemplate(node) {
        const statements = this.addTemplate(parse(node.quasi));

        // TODO: this.currentFn gets set by the observables handlers
        // (currentReturnStmt gets set by templates handlers),
        // which means its use makes this coupled those set of handlers.
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

        blockToFunction(statements, node);
    }

    addTemplate({ html, binders }) {
        const index = this.fragments.add(html);
        binders.forEach(b => this.addBinder(b));
        
        const statements = makeTemplateStatements({ binders, index });
        statements.forEach(node => node.subtemplate = true);
        
        return statements;
    }
}