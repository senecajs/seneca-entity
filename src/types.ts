/* Copyright (c) 2023 Richard Rodger and other contributors, MIT License */



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
}

