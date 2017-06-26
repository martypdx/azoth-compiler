import { recursive } from 'acorn/dist/walk.es';
import { State } from './state';
import parse from '../ast';
import { generate } from 'astring';
import * as templates from './templates';
import * as observables from './observables';

export default function compile(source) {
    const ast = parse(source);

    const handlers = Object.assign({}, templates, observables);

    recursive(ast, new State(), handlers);

    return generate(ast);
}