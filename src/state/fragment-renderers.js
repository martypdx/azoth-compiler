import revHash from 'rev-hash';
import { declareRender } from '../transformers/fragment';
import smartTrim from '../transformers/smart-trim';
import { 
    MAKE_RENDERER_IMPORT,
    GET_RENDERER_IMPORT } from '../transformers/identifiers';

// rollup bug. TODO: try upgrade
revHash('ftw');

export class InlineRenderer {
    constructor() {
        this.map = new Map();
    }

    add(html) {
        html = smartTrim(html);
        const { map } = this;
        if(map.has(html)) return map.get(html).index;

        const value = {};
        const index = value.index = map.size;
        map.set(html, value);
        return index;
    }

    get rendererImport() {
        return MAKE_RENDERER_IMPORT;
    }

    get declarations() {
        return [...this.map.keys()].map((html, index) =>{
            return declareRender(index, MAKE_RENDERER_IMPORT, {
                value: html,
                raw: `\`${html}\``
            });
        });
    }
}

InlineRenderer.create = () => new InlineRenderer();

export class ByIdRenderer {
    constructor() {
        this.map = new Map();
    }

    create() {
        return new ModuleByIdRenderer(this.map);
    }
}

class ModuleByIdRenderer {
    constructor(map) {
        this.map = map;
        this.set = new Set();
    }

    add(html) {
        const { map, set } = this;

        html = smartTrim(html);
        const hash = revHash(html);

        if(!map.has(hash)) {
            map.set(hash, html);
        }
        set.add(hash);

        return hash;
    }

    get rendererImport() {
        return GET_RENDERER_IMPORT;
    }

    get declarations() {
        return [...this.set].map((hash) =>{
            return declareRender(hash, GET_RENDERER_IMPORT, {
                value: hash,
                raw: `'${hash}'`
            });
        });
    }
}

