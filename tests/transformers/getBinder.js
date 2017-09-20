import Binder from '../../src/binders/binder';

export default function getBinder(options, { 
    module = 0, 
    element = 0, 
    name = '', 
    observables =[] 
} = {}) {
    const binder = new Binder(options);
    binder.elIndex = element;
    binder.moduleIndex = module;
    binder.name = name;
    binder.observables = observables;
    return binder;
}
