
export default function compileTemplate(template) {
    //  return `(${Object.keys(params)}) => {
    //         const __nodes = render_${i}();
    //         ${plucks && plucks.length ? '\n' + plucks.map(pluck).join('\n') : ''}
            
    //         ${bindings.map(bind).join('\n')}
            
    //         const __fragment = __nodes[__nodes.length];
    //         __fragment.unsubscribe = () => {
    //             ${bindings.map(unsubscribe).join('')}
    //         };
    //         return __fragment;
    //     }`;


}

const indent = '    ';

export function schema({ binders, params, render, bindings, unsubscribes }) {
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
})();
`);
}

export function bindings(binders) {
    return binders.map((binder, i) => {
        const subscriber = binder.isSubscriber ? `const __sub${i} = ` : '';
        return `${subscriber}${binder.writeBinding(i)};`;
    });
}

export function unsubscribes(binders) {
    return binders
        .map((binder, i) => {
            if (!binder.isSubscriber) return;
            return `__sub${i}.unsubscribe();`;
        })
        .filter(unsub => unsub);
}