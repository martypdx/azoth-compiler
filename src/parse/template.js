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

const makeTemplate = ({ fragment, html }) => {
    const binders = fragment.childBinders.reduce((all, binders, i) => {
        binders.forEach(b => b.elIndex = i);
        all.push(...binders);
        return all;
    }, []);

    return { 
        // TODO: trim?
        html: html.join(''),
        binders: fragment.binders.concat(binders)
    };
};

export default function parseTemplate({ expressions, quasis }) {

    const getTemplate = () => {
        const root = getEl();
        return {
            fragment: root,
            html: [],
            stack: [],
            currentEl: root,
            inAttributes: false,
            //TODO: default should be ''
            currentAttr: null,
            allBinders: null
        };
    };

    const templateStack = [];
    let template = getTemplate();
    
    const handler = {
        onopentagname(name) {
            const el = template.currentEl;
            if(el.component) throw new Error('text/html children for components should spawn child template');
            
            const childIndex = ++el.childIndex;
            template.stack.push(el);

            template.currentEl = getEl(name);
            if(template.currentEl.component = name === '#:') template.currentEl.childIndex = childIndex;
            template.inAttributes = true;
        },
        oncomment(comment) {
            template.html.push(`<!--${comment}-->`);
            if(template.currentEl) template.currentEl.childIndex++;
        },
        onattribute(name, value) {
            template.currentAttr = name;
            if(name==='oninit') return;
            template.currentEl.attributes[name] = value;
        },
        onopentag(name) {
            const el = template.currentEl;
            el.opened = true;
            const { attributes } = el;
            const entries = Object.entries(attributes);

            template.currentAttr = null;
            template.inAttributes = false;

            if(el.component) {
                el.binder.properties = entries.map(([key, value]) => {
                    return typeof value === 'string' ? literalProperty(key, value) : value;
                });
                template.html.push(`<!-- component start -->`);

                templateStack.push(template);
                template = getTemplate();
            }
            else {                
                // NOTE: html spec and htmlparser2 implementation treat 
                // empty string and valueless attribute as equivalent
                const attrsText = entries.reduce((text, [key, value]) => {
                    return `${text} ${key}="${value}"`;
                },'');

                el.htmlIndex = -2 + template.html.push(
                    `<${name}${attrsText}`,
                    '',
                    `>`
                );
            }
        },
        ontext(text) {
            const el = template.currentEl;
            if(el.component) {
                if(text.trim()) throw new Error('text/html children for components should spawn child template');
            }
            else {
                template.html.push(text);
                if(el) el.childIndex++;
            }
        },
        add(binder) { 
            const el = template.currentEl;
            // this works for components, but is misleading
            // because child index in other cases is relative
            // to current el, but for components really is el
            // index of parent el (set in onopentagname)
            binder.init(el, template.currentAttr || binder.name);

            if(el.component && !el.binder) {
                template.stack[template.stack.length - 1].binders.push(binder);
                el.binder = binder;
            }
            else if(el.component) {
                if(template.inAttributes) {
                    if(!binder.name) throw new Error('Expected binder to have name');
                    this.onattribute(binder.name, binder);
                }
                else {
                    el.binder.properties.push(binder);
                }
            }
            else {
                el.binders.push(binder);
            }
        },
        onclosetag(name) {
            let el = template.currentEl;
            let parentEl = template.stack.pop();
            
            // (Child) template complete!
            if(!parentEl) {
                const parentTemplate = templateStack.pop();
                
                const childTemplate = makeTemplate(template);
                let binder = null;

                if(childTemplate.html) {
                    binder = getBinder({
                        target: property,
                        name: 'content',
                        childTemplate: makeTemplate(template)
                    });
                }
                
                el = parentTemplate.currentEl;
                template = parentTemplate;
                parentEl = template.stack.pop();

                if(binder) this.add(binder);
            }

            if(!el.component && !voidElements[name] && el.opened) template.html.push(`</${name}>`);
            else if(el.component) {
                template.html.push('<!-- component end -->');
                parentEl.childIndex++;
            }

            template.currentEl = parentEl;

            //Notice array of arrays. 
            //Binders from each el are being pushed.
            //Order matters as well because this is how we get 
            //element binding index in right order.
            if(el.binders.length > 0) {
                const target = el.htmlIndex > -1 ? el : template.currentEl;
                template.html[target.htmlIndex] = ` data-bind`;
                template.currentEl.childBinders.push(el.binders);
            }

            if (el.childBinders.length > 0) {
                template.currentEl.childBinders.push(...el.childBinders);
            }
        }
    };

    var parser = new htmlparser.Parser(handler, { recognizeSelfClosing: true });

    quasis.forEach((quasi, i) => {
        // quasis length is one more than expressions
        if(i === expressions.length) return parser.write(quasi.value.raw);

        const { sigil, text } = getBindingType(quasi.value.raw);

        if(text) parser.write(text);

        let block = false;
        // look ahead, block sigil # after ${}
        if(i < quasis.length) {
            const value = quasis[i + 1].value;
            const result = getBlock(value.raw);
            value.raw = result.text;
            block = result.block;
        }
        
        const binder = getBinder({
            block,
            sigil,
            inAttributes: template.inAttributes,
            component: template.currentEl.component,
            ast: expressions[i]
        });

        if(!template.currentEl.component || template.inAttributes) parser.write(binder.html);
        handler.add(binder);
    });

    parser.end();

    return makeTemplate(template);
}