import htmlparser from 'htmlparser2';
import { getBindingType, getBlock } from './sigil'; 
import getBinder from '../binders/binder-factory';
import { property } from '../binders/targets';

import voidElements from './void-elements';
import { literal } from '../transformers/common';

const getEl = (name = 'root') => ({
    name, 
    attributes: {}, 
    binders: [],
    childBinders: [],
    childIndex: -1,
    htmlIndex: -1,
    opened: false,
    component: false,
    binder: null
});

const literalProperty = (name, value) => getBinder({
    name,
    inAttributes: true,
    component: true,
    ast: literal({ value })
});

export default function parseTemplate({ expressions, quasis }) {

    const fragment = getEl();
    const html = [];
    const stack = [];

    let currentEl = fragment;
    let inAttributes = false;
    let currentAttr = null;

    let allBinders = null;
    
    const handler = {
        onopentagname(name) {
            const el = currentEl;
            if(el.component) throw new Error('text/html children not yet supported for components');
            
            const childIndex = ++el.childIndex;
            stack.push(el);

            currentEl = getEl(name);
            if(currentEl.component = name === '#:') currentEl.childIndex = childIndex;
            inAttributes = true;
        },
        oncomment(comment) {
            html.push(`<!--${comment}-->`);
            if(currentEl) currentEl.childIndex++;
        },
        onattribute(name, value) {
            currentAttr = name;
            if(name==='oninit') return;
            currentEl.attributes[name] = value;
        },
        onopentag(name) {
            const el = currentEl;
            el.opened = true;
            const { attributes } = el;
            const entries = Object.entries(attributes);

            if(el.component) {
                el.binder.properties = entries.map(([key, value]) => {
                    return typeof value === 'string' ? literalProperty(key, value) : value;
                });
                html.push(`<!-- component start -->`);
            }
            else {                
                // NOTE: html spec and htmlparser2 implementation treat 
                // empty string and valueless attribute as equivalent
                const attrsText = entries.reduce((text, [key, value]) => {
                    return `${text} ${key}="${value}"`;
                },'');

                el.htmlIndex = -2 + html.push(
                    `<${name}${attrsText}`,
                    '',
                    `>`
                );
            }

            currentAttr = null;
            inAttributes = false;
        },
        ontext(text) {
            const el = currentEl;
            if(el.component) {
                if(text.trim()) throw new Error('text/html children not yet supported for components');
            }
            else {
                html.push(text);
                if(el) el.childIndex++;
            }
        },
        add(binder) { 
            const el = currentEl;
            // this works for components, but is misleading
            // because child index in other cases is relative
            // to current el, but for components really is el
            // index of parent el (set in onopentagname)
            binder.init(el, currentAttr || '');

            if(el.component && !el.binder) {
                stack[stack.length - 1].binders.push(binder);
                el.binder = binder;
            }
            else if(el.component) {
                if(inAttributes) {
                    if(!binder.name) throw new Error('Expected binder to have name');
                    this.onattribute(binder.name, binder);
                }
                else {
                    binder.target = property;
                    binder.init(el, 'children');
                    el.binder.properties.push(binder);
                }
            }
            else {
                el.binders.push(binder);
            }
        },
        onclosetag(name) {
            const el = currentEl;
            if(!el.component && !voidElements[name] && el.opened) html.push(`</${name}>`);
            else if(el.component) {
                html.push('<!-- component end -->');
                stack[stack.length - 1].childIndex++;
            }

            currentEl = stack.pop();

            //Notice array of arrays. 
            //Binders from each el are being pushed.
            //Order matters as well because this is how we get 
            //element binding index in right order.

            if(el.binders.length > 0) {
                const target = el.htmlIndex > -1 ? el : currentEl;
                html[target.htmlIndex] = ` data-bind`;
                currentEl.childBinders.push(el.binders);
            }

            if (el.childBinders.length > 0) {
                currentEl.childBinders.push(...el.childBinders);
            }
        },
        onend() {
            // fragment is indexed at the end of the nodes array,
            // which is why its binders go _after_ its child binders
            allBinders = [...fragment.childBinders, fragment.binders];
        }
    };

    var parser = new htmlparser.Parser(handler, { recognizeSelfClosing: true });

    quasis.forEach((quasi, i) => {
        // quasis length is one more than expressions
        if(i === expressions.length) return parser.write(quasi.value.raw);

        const { sigil, text } = getBindingType(quasi.value.raw);

        if(text) parser.write(text);

        let block = false;
        if(i < quasis.length) {
            const value = quasis[i + 1].value;
            const result = getBlock(value.raw);
            value.raw = result.text;
            block = result.block;
        }
        
        const binder = getBinder({
            block,
            sigil,
            inAttributes,
            component: currentEl.component,
            ast: expressions[i]
        });

        if(!currentEl.component || inAttributes) parser.write(binder.html);
        handler.add(binder);
    });

    parser.end();

    const binders = allBinders.reduce((all, binders, i) => {
        binders.forEach(b => b.elIndex = i);
        all.push(...binders);
        return all;
    }, []);

    return { 
        html: html.join(''),
        binders
    };
}