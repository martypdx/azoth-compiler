
const isFn = /function/i;

export default function getFnScope(ancestors) {
    let i = ancestors.length - 1;
    let node = null;
    // TODO: I think we need to look for parent scope's function
    // and stop there, because params already accounted for.
    while(node = ancestors[i--]) {
        if (isFn.test(node.type)) return makeScope(node);
    }
    return null;
}

function makeScope(node) {
   
    return node.params.reduce((scope, param /*, i*/) => {
        if (param.type === 'Identifier') scope.params.push(param.name);
        // else if (param.type === 'ObjectPattern') {
        //     // TODO: add rest of destructuring
        //     // currently only handles ObjectPattern 1 level deep
        //     param.properties.forEach(p => {
        //         const pluck = { key: p.key.name, index: i };
        //         scope.plucks.push(pluck);
        //         hash[ `__ref${i}` ] = true;
        //     });
        // }
        return scope;
    }, {
        params: [],
        plucks: [],
        start: node.start,
        end: node.end
    });
}

