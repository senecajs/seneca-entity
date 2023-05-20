import { Entity } from './lib/make_entity';
/** Define the `entity` plugin. */
declare function entity(): {
    name: string;
};
declare namespace entity {
    var preload: (this: any, context: any) => {
        name: string;
        exports: {
            store: {
                cmds: string[];
                init: (instance: any, opts: any, store: any, cb: any) => {
                    tag: any;
                    desc: string;
                } | undefined;
            };
            init: (instance: any, opts: any, store: any, cb: any) => {
                tag: any;
                desc: string;
            } | undefined;
            generate_id: any;
        };
    };
}
export type { Entity };
export default entity;
