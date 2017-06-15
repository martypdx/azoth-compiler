

export default function TTEtoAFE(node, AFE) {
    node.type = 'CallExpression',
    node.callee = AFE;
    delete node.tag;
    delete node.quasi;
    delete node.start;
    delete node.end;
}
