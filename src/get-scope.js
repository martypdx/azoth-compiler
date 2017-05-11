
const isFn = /function/i;

export default function getScope(ancestors, { identifiers = new Set() } = {}) {

    let i = ancestors.length - 1;
    let node = null;
    while(node = ancestors[i--]) {
        if(isFn.test(node.type)) {
            const { params } = node;
            const newIdentifiers = getIdentifiers(params);
            return {
                identifiers: new Set([...identifiers].concat(newIdentifiers)),
                params
            };
        }
    }

    return { 
        identifiers: new Set(identifiers),
        params: []
    };
}

export function getIdentifiers(params) {
    const identifiers = [];

    const types = {
        Identifier: value => identifiers.push(value.name),
        Property: value => getByType(value.value),
        ObjectPattern: value => getProperties(value.properties)
    };
    const getProperties = list => list.forEach(getByType);
    const getByType = value => types[value.type](value);

    getProperties(params);
    
    return identifiers;
}


