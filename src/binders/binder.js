import astring from 'astring';
import { VALUE, /*MAP,*/ SUBSCRIBE } from './binding-types';


export default class Binder {

    constructor({ type = VALUE, ast = null } = {}, target) {        
        this.type = type;
        this.params = null;
        this.ast = ast;
        this.elIndex = -1;
        this.templates = null;
        
        this.moduleIndex = -1;
        this.target = target;

        this.index = -1;
        this.name = '';        
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    writeHtml() {
        return this.target.html;
    }

    writeInit() {
        return this.target.init(this);
    }

    writeImport() {
        return this.target.import;
    }

    get isSubscriber() {
        const { type, params } = this;
        return (type === SUBSCRIBE || (!!params && params.length > 0));
    }

    writeBinding(observer) { 
        const { ast, params, type } = this;
        const isIdentifier = ast.type === 'Identifier';

        const expr = isIdentifier ? ast.name : astring(ast);
        if ((!params || !params.length) && type !== SUBSCRIBE) {
            return `${observer}(${expr})`;
        }

        let observable = '';

        if(isIdentifier) {
            observable = expr;
        }
        else {
            if (type === SUBSCRIBE) {
                observable = `(${expr})`;
            }
            else {
                observable = params.join();
                const map = `(${observable}) => (${expr})`;

                if (params.length > 1) {
                    observable = `combineLatest(${observable}, ${map})`;
                }
                else {
                    observable += `.map(${map})`;
                }
            }
        }

        if(type === VALUE) observable += `.first()`;

        return this.addSubscribe(observable, observer);
    }

    addSubscribe(observable, observer) {
        return `${observable}.subscribe(${observer})`;
    }

    // [sub templates]

    // unsubscribe?
}