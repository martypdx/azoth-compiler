import { UniqueStrings } from './unique-strings';
import { Imports } from './imports';
import { renderer } from '../transformers/fragment';
import { initBinder } from '../transformers/binding';
import parse from '../parse/template';
import { templateToFunction } from '../transformers/template';

const TAG = '_';
const MODULE_NAME = 'diamond-ui';

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
        this.fn = null;
        this.returnStatement = null;
        
        // all purpose module-wide 
        // ref counter for destructuring
        let ref = 0;
        this.getRef = () => `__ref${ref++}`;
    }

    addDeclarations(body) {
        const { fragments, binders } = this;

        body.splice(0, 0, 
            // TODO: rename: all --> keys
            ...fragments.all.map(renderer), 
            ...binders.values.map(initBinder)
        );
    }

    addFragment(html) {
        return this.fragments.add(html);
    }

    addBinder(binder) {
        this.imports.addBinder(binder);

        const { declaration } = binder;
        const unique = JSON.stringify(declaration);
        return this.binders.add(unique, declaration);
    }

    makeTemplate(node) {
        const { html, binders } = parse(node.quasi);

        const index = this.addFragment(html);
        binders.forEach(b => {
            b.matchObservables(this.scope);
            b.moduleIndex = this.addBinder(b);
        });
        
        // TODO: fn gets set by the observables handlers,
        // which makes this cross those set of handlers.
        // Probably should combine into one set.
        templateToFunction(node, { 
            binders, 
            index,
            fn: this.fn,
            returnStatement: this.returnStatement
        });
    }
}