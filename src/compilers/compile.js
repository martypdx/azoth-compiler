import { recursive } from 'acorn/dist/walk.es';
import { Module } from '../state/module';
import { parse, generate } from '../ast';
import * as templates from './templates';
import createHandler from './observables';

export default function compile(source) {
    const ast = parse(source);
    astTransform(ast);
    return generate(ast);
}


export function astTransform(ast) {

    let ref = 0;
    const getRef = () => `__ref${ref++}`;
    const observables = createHandler({ getRef });
    const handlers = Object.assign({}, templates, observables);

    recursive(ast, new Module(), handlers);
}