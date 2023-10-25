import { Canon, CanonSpec } from '../types';
declare function entargs(this: any, ent: Entity, args: any): any;
declare class Entity implements Record<string, any> {
    entity$: string;
    mark$?: string;
    private$: {
        canon: any;
        promise: boolean;
        get_instance: () => any;
        entargs: typeof entargs;
        options: any;
    };
    constructor(canon: any, seneca: any, options: any);
    make$(...args: any[]): any;
    /** Save the entity.
     *  param {object} [data] - Subset of entity field values.
     *  param {callback~save$} done - Callback function providing saved entity.
     */
    save$(data: any, done?: any): this | Promise<unknown> | null;
    /** Callback for Entity.save$.
     *  @callback callback~save$
     *  @param {error} error - Error object, if any.
     *  @param {Entity} entity - Saved Entity object containing updated data fields (in particular, `id`, if auto-generated).
     */
    native$(done?: any): this | Promise<unknown> | null;
    /** Load the entity.
     *  param {object|string|number} [query] - Either a entity id, or a query object with field values that must match.
     *  param {callback~load$} done - Callback function providing loaded entity, if found.
     */
    load$(query: any, done?: any): this | Promise<unknown> | null;
    /** Callback for Entity.load$.
     *  @callback callback~load$
     *  @param {error} error - Error object, if any.
     *  @param {Entity} entity - Matching `Entity` object, if found.
     */
    /** Load the entity.
     *  param {object|string|number} [query] - A query object with field values that must match, can be empty.
     *  param {callback~list$} done - Callback function providing list of matching `Entity` objects, if any.
     */
    list$(query: any, done?: any): this | Promise<unknown> | null;
    /** Callback for Entity.list$.
     *  @callback callback~list$
     *  @param {error} error - Error object, if any.
     *  @param {Entity} entity - Array of `Entity` objects matching query.
     */
    /** Remove the `Entity`.
     *  param {object|string|number} [query] - Either a entity id, or a query object with field values that must match.
     *  param {callback~remove$} done - Callback function to confirm removal.
     */
    remove$(query: any, done?: any): this | Promise<unknown> | null;
    delete$(query: any, done?: any): this | Promise<unknown> | null;
    /** Callback for Entity.remove$.
     *  @callback callback~remove$
     *  @param {error} error - Error object, if any.
     */
    fields$(): Extract<keyof this, string>[];
    close$(done?: any): any;
    is$(canonspec: any): boolean;
    canon$(opt?: any): any;
    data$(data?: any, canonkind?: any): any;
    clone$(): any;
    custom$(_props: any): any;
    directive$(this: any, _directiveMap: Record<string, any>): any;
}
declare function MakeEntity(canon: any, seneca: any, opts: any): Entity;
declare namespace MakeEntity {
    var parsecanon: (str: CanonSpec) => any;
    var canonstr: (canon: Canon) => string;
}
export { MakeEntity, Entity };
