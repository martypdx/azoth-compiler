import astring from 'astring';
import { VALUE, /*MAP,*/ SUBSCRIBE } from './binding-types';


export default class Binder {

    constructor({ type = VALUE, ast = null } = {}, writer) {        
        this.type = type;
        this.params = null;
        this.ast = ast;
        this.elIndex = -1;
        this.templates = null;
        
        this.writer = writer;

        this.index = -1;
        this.name = '';        
    }

    init(el, attr) {
        this.index = el.childIndex;
        this.name = attr;
    }

    writeHtml() {
        return this.writer.html;
    }

    writeInit() {
        return this.writer.init(this);
    }

    writeImport() {
        return { name: this.writer.import };
    }

    get isSubscriber() {
        return (!!this.params && this.params.length > 0);
    }

    writeBinding(observer) { 
        const { ast, params, type } = this;
        const isIdentifier = ast.type === 'Identifier';

        const expr = isIdentifier ? ast.name : astring(ast);
        if (!params.length) {
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