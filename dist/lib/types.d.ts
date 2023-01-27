export type Canon = {
    zone?: string;
    base?: string;
    name: string;
};
export type EntityState = {
    when: number;
    instance: any;
    canon: Canon;
    canonstr: string;
    transaction?: any;
};
