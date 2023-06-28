declare function Store(plugin_opts: any): {
    cmds: string[];
    init: (instance: any, store_opts: any, store: any, cb: any) => {
        tag: any;
        desc: string;
    } | undefined;
};
declare const Intern: any;
export { Intern, Store };
