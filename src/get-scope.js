
const isFn = /function/i;

export default function getScope(ancestors, { 
    params = new Set(),
    destructured = new Map()
} = {}) {

    let i = ancestors.length - 1;
    let node = null;
    while(node = ancestors[i--]) {
        if(isFn.test(node.type)) {
            const newParams = makeScope(node, destructured);
            return {
                params: new Set([...params].concat(newParams)),
                destructured
            };
        }
    }
    return { 
        params: new Set(...params),
        destructured
    };
}

function makeScope(node, destructured) {
    return node.params.reduce((params, param, index) => {
        if (param.type === 'Identifier') params.push(param.name);

        else if (param.type === 'ObjectPattern') {
            // TODO: add rest of destructuring
            // currently only handles ObjectPattern 1 prop, 1 level deep
            const destructure = new Map();
            param.properties.forEach(p => {
                const key = p.key.name;
                params.push(key);
                if(destructure.has(index)) {
                    destructure.get(index).plucks.push(key);
                }
                else {
                    destructure.set(index, [ key ]);
                }
            });

            destructured.set(node, destructure);
        }

        return params;
    }, []);
}

