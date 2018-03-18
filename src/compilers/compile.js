import { recursive } from 'acorn/dist/walk.es';
import { Module } from '../state/module';
import { Imports } from '../state/imports';
import { InlineRenderer } from '../state/fragment-renderers';
import { parse, generate } from '../ast';
import * as templates from './templates';
import createHandler from './observables';
import createRefCounter from './ref-counter';

export default function compile(source, options = {}) {
    const ast = parse(source);
    astTransform(ast, options.htmlRenderer || InlineRenderer);
    return generate(ast);
}

export function astTransform(ast, htmlRenderer) {
    const imports = new Imports(ast);
    const module = new Module(imports, htmlRenderer.create());
    const refCounter = createRefCounter();
    const observables = createHandler(refCounter, imports.observableTag);
    const handlers = Object.assign({}, templates, observables);

    recursive(ast, module, handlers);
}