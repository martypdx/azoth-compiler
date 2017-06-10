import findImport from '../parse/find-import';
import parse from '../parse/parse';
import MagicString from 'magic-string';
import parseAst from '../ast';
import UniqueStrings from './unique-strings';
// import astring from 'astring';

export default function compile(source) {
    return new Module(source).code;
}

const bindingImport = {
    'text-node': 'textBinder',
    'block': 'blockBinder'
};

class Module {
    constructor(source) {
        const s = this.source = new MagicString(source);
        const ast = parseAst(source);

        const specifier = findImport(ast);
        const tag = specifier ? specifier.local.name : '_';
        const templates = parse(ast, { tag });

        const imports = this.imports = new UniqueStrings();
        const binders = this.binders = new UniqueStrings();
        const fragments = this.fragments = new UniqueStrings();
        
        templates.forEach(t => this.compile(t));

        if (specifier) {
            const importsToAdd = ['renderer', 'makeFragment', ...Array.from(imports).map(imp => `__${imp}`)];
            s.overwrite(specifier.start, specifier.end, importsToAdd.join());
        }
        
        const renderers = fragments.map((html, i) => 
            `const render_${i} = renderer(makeFragment(\`${html}\`));`
        );
        const bindingDeclarations =  binders.map((b, i) =>
            `const __bind${i} = __${bindingImport[b.type]}(${b.index});`
        );
        const toPrepend = renderers.join('\n') + '\n' + bindingDeclarations.join('\n') + '\n' ;

        s.prepend(toPrepend);
    }

    compile(template) {
        const code = this.generateCode(template); 
        const codeGen = `(() => {
            return ${code};
        })()`;

        const { scope } = template;
        this.source.overwrite(scope.start, scope.end, codeGen);
    }

    get code() {
        return this.source.toString();
    }

    addGlobals(html, bindings) {
        const index = this.fragments.push(html) - 1;
        bindings.forEach(b => b.declaredIndex = this.bindings.add(b));
        return index;
    }

    generateCode({ html, bindings, scope = { plucks: [], params: [] } }) {
        const i = this.addGlobals(html, bindings);
        const bind = this.bind.bind(this);
        const { plucks, params } = scope;

        return `(${Object.keys(params)}) => {
            const __nodes = render_${i}();
            ${plucks && plucks.length ? '\n' + plucks.map(pluck).join('\n') : ''}
            
            ${bindings.map(bind).join('\n')}
            
            const __fragment = __nodes[__nodes.length];
            __fragment.unsubscribe = () => {
                ${bindings.map(unsubscribe).join('')}
            };
            return __fragment;
        }`;

        

    }

    bind(b, i) {
        let binding = '';
        if(b.type === 'block') {
            const templates = b.templates.map(t => this.generateCode(t));
            binding = templates.map((code, i) => {
                return `const t${i} = ${code};` + '\n';
            }).join('');
        }

        if (b.ref) binding += bindReference(b, i);
        else if (b.expr) binding += bindExpression(b, i);
        else if(b.type === 'block') {
            binding += '\n';
            binding += bindToNodeWithValue(b, 't0');
        }
        else binding += bindToNode(b);

        return binding;	
    }

}
