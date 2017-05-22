import ChildNodeBinder from './child-node-binder';

export default class BlockChildNodeBinder extends ChildNodeBinder {

    write() {
        return '<block-node></block-node>';
    }

    // bind() {

    //     const isExpression = expr.type !== 'TaggedTemplateExpression'; 

    //     binding.templates = recurse(expr);
            
    //     super.bind();

    // }
}
