import { Entity } from './lib/make_entity';
declare function entity(this: any, _options: any): {
    name: string;
};
declare namespace entity {
    var defaults: {
        mem_store: boolean;
        generate_id: typeof generate_id;
        pattern_fix: {
            sys: string;
        };
        jsonic: {
            depth: number;
            maxitems: number;
            maxchars: number;
        };
        log: {
            active: boolean;
        };
        meta: {
            provide: boolean;
        };
    };
    var preload: (this: any, context: any) => {
        name: string;
        exports: {
            store: {
                cmds: string[];
                init: (instance: any, store_opts: any, store: any, cb: any) => {
                    tag: any;
                    desc: string;
                } | undefined;
            };
            init: (instance: any, store_opts: any, store: any, cb: any) => {
                tag: any;
                desc: string;
            } | undefined;
            generate_id: any;
        };
    };
}
declare function generate_id(this: any, msg: any, reply: any): any;
export type { Entity };
export default entity;
