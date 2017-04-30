

export default function getPlucks(param) {
    if (param.type !== 'ObjectPattern') return [];

    // TODO: add rest of destructuring
    // currently only handles ObjectPattern 1 level deep
    param.properties.forEach(p => {
        const pluck = { key: p.key.name, index: i };
        scope.plucks.push(pluck);
        hash[ `__ref${i}` ] = true;
    });

}

