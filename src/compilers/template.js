
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

export function bindings(binders) {

    return binders.map((binder, i) => {
        const subscriber = binder.isSubscriber ? `const __sub${i} = ` : '';
        return `${subscriber}${binder.writeBinding(i)};`;
    });
        
}