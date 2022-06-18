declare function Store(): {
    cmds: string[];
    init: (instance: any, opts: any, store: any, cb: any) => {
        tag: any;
        desc: string;
    } | undefined;
};
declare const Intern: any;
export { Intern, Store };
