import htmlparser from 'htmlparser2';
import { getBindingType, getBlock } from './sigil'; 
import getBinder from '../binders/binder-factory';
import voidElements from './void-elements';

const getEl = (name = 'root') => ({
    name, 
    attributes: {}, 
    binders: [],
    childBinders: [],
    childIndex: -1
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
            currentEl.childIndex++;
            stack.push(currentEl);
            currentEl = getEl(name);
            inAttributes = true;
        },
        onattribute(name, value) {
            currentEl.attributes[currentAttr = name] = value;
        },
        onopentag(name) {
            const el = currentEl;
            const { attributes } = el;
            // TODO: Switch to Object.values, but needs node.js version 7.x - wait for 8.x?
            const attrsText = Object.keys(attributes)
                .reduce((text, key) => {
                    // NOTE: currently not distinguishing between empty string and valueless attribute.
                    // htmlparser2 does not distinguish and html spec says empty string 
                    // and boolean are equivalent
                    const value = attributes[key];
                    return `${text} ${key}="${value}"`;
                },'');

            el.htmlIndex = -2 + html.push(
                `<${name}${attrsText}`,
                '',
                `>`
            );

            currentAttr = null;
            inAttributes = false;
        },
        ontext(text) {
            html.push(text);
            if(currentEl) currentEl.childIndex++;
        },
        add(binder) { 
            const el = currentEl;
            binder.init(el, currentAttr);
            el.binders.push(binder);
        },
        onclosetag(name) {
            if(!voidElements[name]) html.push(`</${name}>`);
            const el = currentEl;
            currentEl = stack.pop();

            if(el.binders.length > 0) {
                html[el.htmlIndex] = ` data-bind`;
                currentEl.childBinders.push(el.binders);
            }

            if (el.childBinders.length > 0) {
                currentEl.childBinders.push(...el.childBinders);
            }
        },
        onend() {
            allBinders = [...fragment.childBinders, fragment.binders];
        }
    };

    var parser = new htmlparser.Parser(handler);

    quasis.forEach((quasi, i) => {
        // quasi is one more than expression
        if(i === expressions.length) return parser.write(quasi.value.raw);

        const { type, text } = getBindingType(quasi.value.raw);

        parser.write(text);

        let block = false;
        if(i < quasis.length) {
            const value = quasis[i + 1].value;
            const result = getBlock(value.raw);
            value.raw = result.text;
            block = result.block;
        }
        
        const binder = getBinder({
            block,
            type,
            inAttributes,
            ast: expressions[i]
        });

        parser.write(binder.writeHtml());
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