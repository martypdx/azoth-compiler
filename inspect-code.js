(() => {
    const render_0 = renderer(makeFragment('<span data-bind><text-node></text-node></span>'));
    const __bind0 = __ctb(0);

    (() => {
        return (x, y) => {
            const __nodes = render_0();


            const __e0 = combineLatest(x, y, (x, y) => (x + y));
            const __s0 = __e0.subscribe(__bind0(__nodes[0]));

            const __fragment = __nodes[__nodes.length];
            __fragment.unsubscribe = () => {
                __s0.unsubscribe();
            };
            return __fragment;
        };
    })();
})();