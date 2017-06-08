
export default function compile({ html, binders: b, params: p, node, position }) {
    return schema({
        binders: binders(b),
        params: params(p),
        render: '__render0()',
        subtemplates: subtemplates(b),
        bindings: bindings(b),
        unsubscribes: unsubscribes(b)
    });
}

const indent = '    ';

export function schema({ binders, params, render, bindings, unsubscribes, subtemplates = [] }) {
    return (
`(() => {${
    binders.length ? `
    ${binders.join('\n' + indent)}`
    : '' }
    return (${params.params}) => {${
        params.destructure.length ? `
        ${params.destructure.join('\n' + indent.repeat(2))}`
        : ''}
        const __nodes = ${render};${
        subtemplates.length ? `
        ${subtemplates.join('\n' + indent.repeat(2))}`
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
    };
})();`);
}

export function params(params) {
    return { 
        params: params.map(p => p.name),
        destructure: []
    };
}


export function binders(binders) {
    return binders.map((binder, i) => {
        return `const __bind${i} = ${binder.writeInit()};`;
    });
}

export function bindings(binders) {
    return binders.map((binder, i) => {
        const subscriber = binder.isSubscriber ? `const __sub${i} = ` : '';
        const observer = `__bind${i}(__nodes[${binder.elIndex}])`;
        return `${subscriber}${binder.writeBinding(observer)};`;
    });
}

export function subtemplates(binders) {
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