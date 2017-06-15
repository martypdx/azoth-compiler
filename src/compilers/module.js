import findImport from '../parse/find-import';
import parse from '../parse/parse';
import MagicString from 'magic-string';
import parseAst from '../ast';
import { Globals } from './globals';
import compiler from './template';

export default function compile(source) {
    const s = new MagicString(source);
    const ast = parseAst(source);

    const specifier = findImport(ast);
    const options = specifier ? { tag: specifier.local.name } : {};

    const templates = parse(ast, options);
    console.log('TEMPLATES', templates.length);

    const globals = new Globals();
    templates.forEach(template => {
        const compiled = compiler(template, globals);
        const { start, end } = template.position;
        s.overwrite(start, end, compiled);
    });

    const { imports, fragments, binders } = globals;

    if (specifier) {
        const allImports = ['renderer', 'makeFragment', ...imports];
        s.overwrite(specifier.start, specifier.end, allImports.join());
    }
    
    const initRenderers = fragments.map((html, i) => 
        `const __render${i} = renderer(makeFragment(\`${html}\`));`
    );

    const initBinders =  binders.map((binder, i) => {
        return `const __bind${i} = ${binder};`;
    });

    const toPrepend = [...initRenderers, ...initBinders].join('\n') + '\n' ;

    s.prepend(toPrepend);

    return s.toString();
}