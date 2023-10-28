import { getCookie, setCookie } from "./utils.js";
import { getRevPkmnName } from "./i18n.js";
import { getPokemonFromId, pokedex } from "./pokedex.js";
import { GuessesV2 } from './types.js';

const trainerTitles = new Map([
  [0, "Novice Trainer"],
  [3, "Pokémon Trainer"],
  [7, "Ace Trainer"],
  [10, "Pokémon Collector"],
  [15, "Pokémaniac"],
  [25, "Pokémon Professor"],
  [35, "Gym Leader"],
  [45, "Elite Four"],
  [60, "Pokémon Champion"],
  [75, "Pokémon Master"]
])

function getTitle(streak: number): string {
  for (const [minimum, title] of trainerTitles.entries()) {
    if (streak >= minimum) return title;
  }
  return "Novice Trainer"
}

function parseJSON(input: string): unknown[] {
  try {
    return JSON.parse(input)
  } catch {
    return [];
  }
}

export function showState(isDaily = false) {
  const enabled = getCookie("hintsenabled", false)
  document.getElementById("toggleinfo")!.innerHTML = `📋 Pokémon Info ${enabled == "0" ? "OFF" : "ON"}`;

  const guesses = parseJSON(getCookie("guessesv2", isDaily)) as GuessesV2;
  const attempts = parseInt(getCookie("t_attempts", isDaily))

  const guessesCont = document.getElementById("guesses")!
  const hintTitles = document.getElementById("hinttitles")!

  if (guesses.length > 0) {
    guessesCont.style.display = "block";
    window.getComputedStyle(hintTitles).opacity;
    hintTitles.className += ' in';
  } else {
    guessesCont.style.display = "none"
    hintTitles.className = 'row';
  }
  let lastAttempt = ""
  for (const [index, guess] of guesses.entries()) {
    if (document.getElementById(`guess${index}`)) continue;
    lastAttempt = getPokemonFromId(guess.name)

    const rowElement = createElement("div", { classList: ['row'] }, { id: `guess${index}` })

    for (const hint of guess.hints) {
      const colElement = createElement("div", {
        classList: ['column'], childNodes: [
          createElement<HTMLImageElement>("img", { classList: ['emoji'] }, { src: hint })
        ]
      })
      rowElement.appendChild(colElement)
    }
    const colElement = createElement("div", {
      classList: ['column'], childNodes: [
        createElement("div", {
          classList: ['tooltip'], childNodes: [
            createElement("p", { classList: ['guess'] }, { innerHTML: lastAttempt }),
            createElement("span", { classList: ['tooltiptext'] }, { innerHTML: guess.info })
          ]
        })
      ]
    })
    rowElement.appendChild(colElement)
    guessesCont.appendChild(rowElement);
    window.getComputedStyle(rowElement).opacity;
    rowElement.className += ' in';

    const guessedPoke = pokedex[getRevPkmnName(lastAttempt)]
    const type1correct = guess.mosaic[1] == "1" || guess.mosaic[1] == "4"
    const type2correct = guess.mosaic[2] == "1" || guess.mosaic[2] == "4"

    const type1elem = document.getElementById(`type_${guessedPoke.type1}`)!
    const type2elem = document.getElementById(`type_${guessedPoke.type2}`)!
    type1elem.style.opacity = type1correct ? "1" : "0.12";
    type1elem.style.borderStyle = type1correct ? "solid" : "none";
    type2elem.style.opacity = type2correct ? "1" : "0.12";
    type2elem.style.borderStyle = type2correct ? "solid" : "none";
  }

  const secret_name = getPokemonFromId(parseInt(getCookie("secret_poke", isDaily)));
  if (secret_name == lastAttempt) {
    document.getElementById("secretpoke")!.innerHTML = secret_name
    document.getElementById("guessform")!.style.display = "none";
    document.getElementById("results")!.style.display = "block";
    document.getElementById("won")!.style.display = "block";
    if (isDaily) {
      const streak = parseInt(getCookie("streak", false))
      const title = getTitle(streak)
      document.getElementById("streak")!.innerHTML = `You've guessed <b>${streak} Pokémon</b> in a row!<br><b>Title:</b> ${title}`;
    }
  }
  else if (guesses.length == attempts) {
    document.getElementById("secretpoke")!.innerHTML = secret_name
    document.getElementById("guessform")!.style.display = "none";
    document.getElementById("results")!.style.display = "block";
    document.getElementById("lost")!.style.display = "block";
    if (isDaily) {
      setCookie("streak", "0", 300, false)
      document.getElementById("streak")!.innerHTML = "Streak Reset!<br><b>Title:</b> Novice Trainer"
    }
  }
  document.getElementById("attempts")!.innerHTML = (attempts - guesses.length).toString()
}

interface ElementProps {
  classList?: string[]
  childNodes?: HTMLElement[]
  attributes?: { key: string, value: string }[]
}
function createElement<T extends HTMLElement>(tag: string, modifications?: ElementProps, attributes?: Record<string, string>): T {
  const element = document.createElement(tag);
  if (modifications) {
    const { classList, childNodes } = modifications;
    classList?.forEach(classType => element.classList.add(classType));
    childNodes?.forEach(node => element.appendChild(node));
  }
  if (attributes) Object.entries(attributes)?.forEach(([key, value]) => element.setAttribute(key, value));
  return element as T;
}