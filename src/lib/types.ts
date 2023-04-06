export type Canon = {
  zone?: string
  base?: string
  name: string
}

export type CanonSpec = Canon | string | string[]

export type EntityState = {
  when: number
  instance: any // Seneca
  canon: Canon
  canonstr: string
  transaction?: Transaction | null
}

export type Transaction = {
  id: string
  sid: string
  did: string
  start: number
  finish?: number
  begin?: any
  result?: any
  canon: Canon
  handle: any
  trace: any[]
}

export type EntityAPI = (() => any) & {
  // TODO: Seneca types!
  instance: () => any
  state: (canonspec: CanonSpec) => EntityState
  transaction: (canonspec: CanonSpec, extra: any) => null | Promise<any>
  commit: (canonspec: CanonSpec, extra: any) => Promise<null | Transaction>
  rollback: (canonspec: CanonSpec, extra: any) => Promise<null | Transaction>
  adopt: (
    handle: any,
    canonspec: CanonSpec,
    extra: any
  ) => Promise<null | Transaction>
}
