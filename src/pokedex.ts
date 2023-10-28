import { getPkmnName } from "./i18n.js";
import { PokemonInfo } from './types.js';
import pokedexData from "./data/pokedex.json";

export const types = ["Normal", "Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dark", "Dragon", "Steel", "Fairy", ""];
export const pokedex = pokedexData as Record<string, PokemonInfo>;
export const globals = {
  game: {
    hintsEnabled: true,
    dailyPoke: ""
  }
}

export function getPokemonFromId(id: number): string {
  return getPkmnName(Object.keys(pokedex)[id]);
}

export function getIdFromPokemon(pokemon: string): number {
  return Object.keys(pokedex).indexOf(pokemon);
}

export function getRandomPokemon(mingen: number, maxgen: number): [number, string[]] {
  const entries = Object.entries<PokemonInfo>(pokedex);
  const filteredPokemon = entries.filter(([_, { generation }]) => generation >= mingen && generation <= maxgen);
  const [chosen] = filteredPokemon[Math.floor(Math.random() * filteredPokemon.length)];
  return [getIdFromPokemon(chosen), filteredPokemon.map(([pokemonName]) => pokemonName)];
}