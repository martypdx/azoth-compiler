import { UniqueStrings } from './unique-strings';
import { Imports } from './imports';
import { renderer } from '../transformers/fragment';
import { initBinder } from '../transformers/binding';
import parseTemplate from '../parse/parse-template';
import { templateToFunction } from '../transformers/template';

const TAG = '_';
const MODULE_NAME = 'diamond';

export class Module {
    constructor({ tag = TAG } = {}) {
        this.name = MODULE_NAME;
        // TODO: tag comes back from imports
        // because may be aliased
        this.tag = tag;
        this.imports = new Imports({ tag });

        this.fragments = new UniqueStrings();
        this.binders = new UniqueStrings();
        
        this.scope = null;
        this.functionScope = null;
        
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
        const { html, binders } = parseTemplate(node.quasi);

        const index = this.addFragment(html);
        binders.forEach(b => {
            b.matchObservables(this.scope);
            b.moduleIndex = this.addBinder(b);
        });
        
        templateToFunction(node, { binders, index });
    }
}