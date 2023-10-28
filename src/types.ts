export interface GuessV2 {
  hints: string[]
  name: number
  info: string
  mosaic: string
}
export type GuessesV2 = GuessV2[]
export interface PokemonInfo {
  generation: number
  type1: string
  type2: string
  height: number
  weight: number
}

export type PokemonProperty = "gen" | "type1" | "type2" | "height" | "weight"
export interface PokemonFilters {
  property: PokemonProperty
  equality: string
  value: string
}
export interface PokemonSearchFilter {
  fullName: string[],
  filters: PokemonFilters[]
}