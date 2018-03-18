import { InlineRenderer } from './fragment-renderers';
import parse from '../parse/template';
import { blockToFunction, makeTemplateStatements } from '../transformers/template';
import { addStatementsTo, replaceStatements } from '../transformers/common';

export class Module {
    constructor(imports, htmlRenderer = new InlineRenderer()) {
        this.imports = imports;
        this.htmlRenderer = htmlRenderer;
        if(imports) imports.addName(htmlRenderer.rendererImport);

        // track scope and current function
        this.scope = this.functionScope = Object.create(null);
        this.currentFn = null;
        this.currentReturnStmt = null;

        // buffer added statements that will get flushed to node
        this.statements = null;
    }

    get templateTag() {
        return this.imports.templateTag;
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
        body.splice(0, 0, ...this.htmlRenderer.declarations);
    }

    // only used privately from makeTemplate
    _addBinder(binder) {
        if(binder.childTemplate) {
            if(binder.ast) throw new Error('Binders with child templates not expected to have ast');
            const statements = this.addTemplate(binder.childTemplate);
            binder.ast = blockToFunction(statements);
        }

        binder.matchObservables(this.scope);
        this.imports.addBinder(binder);
        binder.properties.forEach(p => this._addBinder(p));
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
        const index = this.htmlRenderer.add(html);
        binders.forEach(b => this._addBinder(b));
        
        const statements = makeTemplateStatements({ binders, index });
        statements.forEach(node => node.subtemplate = true);
        
        return statements;
    }
}