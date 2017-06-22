import Binder from '../../src/binders/binder';

export default function getBinder(options, { module = 0, element = 0 } = {}) {
    const binder = new Binder(options);
    binder.elIndex = element;
    binder.moduleIndex = module;
    return binder;
}
