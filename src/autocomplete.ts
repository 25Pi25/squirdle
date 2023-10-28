import { getPkmnName } from "./i18n.js";
import { globals, pokedex } from './pokedex.js';
import { PokemonInfo, PokemonFilters, PokemonSearchFilter, PokemonProperty } from './types.js';
let currentFocus = 0;

export function autocomplete(input: HTMLInputElement, pokemonList: string[]) {
  input.addEventListener("input", event => openAutocomplete(input, event as InputEvent, pokemonList));
  input.addEventListener("keydown", e => {
    const autocompleteList = document
      .getElementById(`${input.id}autocomplete-list`)
      ?.getElementsByTagName("div");
    if (!autocompleteList) return;
    if (e.key == "ArrowDown") {
      currentFocus++;
      addActive(autocompleteList);
    } else if (e.key == "ArrowUp") {
      currentFocus--;
      addActive(autocompleteList);
    } else if (e.key == "Enter") {
      e.preventDefault();
      if (currentFocus > -1) autocompleteList[currentFocus].click();
    }
  });
  document.addEventListener("click", e => closeAllLists(input, e.target));
}

function addActive(collection: HTMLCollectionOf<HTMLDivElement>) {
  removeActive(collection);
  if (currentFocus >= collection.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = collection.length - 1;
  collection[currentFocus].classList.add("autocomplete-active");
}

function removeActive(collection: HTMLCollectionOf<HTMLDivElement>) {
  for (const item of collection) {
    item.classList.remove("autocomplete-active");
  }
}

function closeAllLists(input: HTMLInputElement, target: EventTarget | null) {
  if (!target) return;
  const autocompleteList = document.getElementsByClassName("autocomplete-items");
  for (const autocompleteItem of autocompleteList) {
    if (target != autocompleteItem && target != input) continue;
    autocompleteItem.parentNode?.removeChild(autocompleteItem);
  }
}

function isFilterable({ generation: gen, type1, type2, height, weight }: PokemonInfo, filters: PokemonFilters[]): boolean {
  const pokeStats: Record<PokemonProperty, string | number> = { gen, type1, type2, height, weight };
  for (const { property, equality, value } of filters) {
    switch (equality) {
      case ":":
        if (pokeStats[property] != value) return false;
        break;
      case "!":
        if (pokeStats[property] == value) return false;
        break;
      case "<":
        if (pokeStats[property] >= value) return false;
        break;
      case ">":
        if (pokeStats[property] <= value) return false;
        break;
    }
  }
  return true;
}

function openAutocomplete(input: HTMLInputElement, e: InputEvent, pokemonList: string[]) {
  const { value } = input;
  closeAllLists(input, e.target);
  if (!value) return;
  currentFocus = -1;
  const autocompleteList = document.createElement("DIV");
  autocompleteList.setAttribute("id", `${input.id}autocomplete-list`);
  autocompleteList.setAttribute("class", "autocomplete-items");
  input.parentNode?.appendChild(autocompleteList);
  const { fullName, filters } = value.split(" ")
    .reduce((a, b) => {
      if (!/(gen|type1|type2|height|weight)([:!<>])(.+)/.test(b)) {
        a.fullName.push(b)
      } else {
        const [_, property, equality, value] = /(gen|type1|type2|height|weight)([:!<>])(.+)/.exec(b) ?? [];
        a.filters.push({ property, equality, value } as PokemonFilters)
      }
      return a;
    }, ({ fullName: [], filters: [] }) as PokemonSearchFilter);
  const searchedName = fullName.join(" ");

  for (const pokemon of pokemonList) {
    const pokemonName = getPkmnName(pokemon)
    const pokeInfo = pokedex[pokemon];

    const highlightedIndex = pokemonName.toLowerCase().indexOf(searchedName.toLowerCase());
    const allowed = (highlightedIndex != -1 || !searchedName) && isFilterable(pokeInfo, filters);
    if (!allowed) continue;

    // Add the item to the autocomplete
    autocompleteList.appendChild(getAutocompleteItem(input, e.target, pokemonName, highlightedIndex, searchedName, pokeInfo));
  }
}

function getAutocompleteItem(
  input: HTMLInputElement,
  target: EventTarget | null,
  pokemonName: string,
  highlightedIndex: number,
  searchedName: string,
  pokeInfo: PokemonInfo
): Node {
  const autocompleteItem = document.createElement("DIV");
  if (highlightedIndex != -1) {
    autocompleteItem.innerHTML = pokemonName.substring(0, highlightedIndex);
    autocompleteItem.innerHTML += `<strong>${pokemonName.substring(highlightedIndex, highlightedIndex + searchedName.length)}</strong>`;
    autocompleteItem.innerHTML += pokemonName.substring(highlightedIndex + searchedName.length);
  } else {
    autocompleteItem.innerHTML = pokemonName
  }
  if (globals.game.hintsEnabled) {
    const { generation: gen, type1, type2, height: h, weight: w } = pokeInfo;
    autocompleteItem.innerHTML += `<br><span class=\"dropinfo\"> Gen ${gen}, ${type1}/` +
      `${type2 || "None"}, ${h}m, ${w}kg</span>`;
  }
  const inputValue = pokemonName.replace("'", "&#39;")
  autocompleteItem.innerHTML += `<input type='hidden' value='${inputValue}'>`;
  autocompleteItem.addEventListener("click", () => {
    input.value = inputValue;
    closeAllLists(input, target);
  });
  return autocompleteItem;
}