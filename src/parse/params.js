const isFn = /function/i;

export function findParams(ancestors) {

    let i = ancestors.length - 1;
    let node = null;
    while(node = ancestors[i--]) {
        if(isFn.test(node.type)) {
            const { params } = node;
            const identifiers = getIdentifiers(params);
            return {
                identifiers,
                params
            };
        }
    }

    return { 
        identifiers: [],
        params: []
    };
}

//TODO: Can I use acorn walker for this?
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


