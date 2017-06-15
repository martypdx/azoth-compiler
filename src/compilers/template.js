import MagicString from 'magic-string';
import { Globals } from './globals';

export default function compile({ html, binders: b, params: p }, globals = new Globals()) {
    const renderIndex = globals.addFragment(html);
    b.forEach(binder => {
        binder.moduleIndex = globals.addBinder(binder);
    });

    // const recurse = template => compile(template, globals);

    return schema({
        // params: params(p),
        render: render(renderIndex),
        // subtemplates: subtemplates(b, recurse),
        bindings: bindings(b),
        unsubscribes: unsubscribes(b)
    });
}

const indent = '    ';

export function schema({ render, bindings, unsubscribes, subtemplates = [] }) {
    const template = (
`((() => {
    const __nodes = ${render};${
    subtemplates.length ? `
    ${subtemplates
        .map(template => {
            const firstLineIndex = template.indexOf('\n');
            return new MagicString(template)
                .indent(indent.repeat(2), { 
                    exclude: [0 , firstLineIndex]
                })
                .toString();
        })
        .join('\n' + indent.repeat(2))}`
    : ''}${
    bindings.length ? `
    ${bindings.join('\n' + indent.repeat(2))}`
    : ''}${
    unsubscribes.length ? `
    const __fragment = __nodes[__nodes.length];
    __fragment.unsubscribe = () => {
        ${unsubscribes.join('\n' + indent.repeat(3))}
    };
    return __fragment;`
    : `
    return __nodes[__nodes.length];`}
})())`);

    return template;
}

export function render(index) {
    return `__render${index}()`;
}

export function params(params) {
    return { 
        params: params.map(p => p.name),
        destructure: []
    };
}


export function binders(binders) {
    return binders.map(binder => {
        return `const __bind${binder.moduleIndex} = ${binder.writeInit()};`;
    });
}

export function bindings(binders) {
    return binders.map((binder, i) => {
        const subscriber = binder.isSubscriber ? `const __sub${i} = ` : '';
        const observer = `__bind${binder.moduleIndex}(__nodes[${binder.elIndex}])`;
        return `${subscriber}${binder.writeBinding(observer)};`;
    });
}

export function subtemplates(binders, compile) {
    return binders.reduce((templates, binder, iBinder) => {
        return templates.concat(binder.templates.map((template, i) => {
            return `const __t${iBinder}_${i} = ${compile(template)}`;
        }));
    }, []);
}

export function unsubscribes(binders) {
    return binders
        // map first because we need to preserve original index
        .map((binder, i) => {
            if (!binder.isSubscriber) return;
            return `__sub${i}.unsubscribe();`;
        })
        .filter(unsub => unsub);
}