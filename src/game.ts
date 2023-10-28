import { getCookie, setCookie } from "./utils.js";
import { autocomplete } from "./autocomplete.js";
import { getRevPkmnName } from "./i18n.js";
import { getIdFromPokemon, getRandomPokemon, getPokemonFromId, globals, pokedex, types } from "./pokedex.js";
import { showState } from "./renderer.js"
import { GuessV2, GuessesV2 } from './types.js';

function replaceAt(str: string, index: number, ch: string) {
  return str.replace(/./g, (c, i) => i == index ? ch : c);
}

export function copyCurrentDay(day: number, useNames: boolean) {
  const attempts = parseInt(getCookie("t_attempts", day > -1))
  const guesses = JSON.parse(getCookie("guessesv2", day > -1))
  let gnum = guesses.length
  if (document.getElementById('lost')!.style.display == "block") {
    gnum = "X"
  }
  let isDailyinfo = day == -1 ? "" : ("Daily " + day + " - ")

  let text = ""
  for (const guess of guesses) {
    let mosaic = guess.mosaic
    if (day > -1 && (mosaic[0] == "2" || mosaic[0] == "3")) {
      mosaic = replaceAt(mosaic, 0, '6')
    }
    text = text + "\n" + mosaic + (useNames ? getPokemonFromId(guess.name) : "")
  }
  text = text
    .replace(/1/g, '🟩')
    .replace(/2/g, '🔼')
    .replace(/3/g, '🔽')
    .replace(/4/g, '🟨')
    .replace(/5/g, '🟥')
    .replace(/6/g, '🟦');
  text = `Squirdle ${isDailyinfo}${gnum}/${attempts}${text}`;

  const textarea = document.createElement("textarea");
  textarea.textContent = text;
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return navigator.clipboard.writeText(text);
  } catch (ex) {
    console.warn("Copy to clipboard failed. Let Fireblend know!", ex);
    return;
  } finally {
    document.body.removeChild(textarea);
    alert("Copied mosaic to clipboard!");
  }
}

const imgs = {
  '1': "imgs/correct.png",
  '2': "imgs/up.png",
  '3': "imgs/down.png",
  '4': "imgs/wrongpos.png",
  '5': "imgs/wrong.png"
}
export function handleGuess(isDaily = false) {
  const guess_name = getRevPkmnName(document.querySelector<HTMLInputElement>("#guess")!.value);
  const secret_name = getRevPkmnName(getPokemonFromId(parseInt(getCookie("secret_poke", isDaily))));
  const guess = pokedex[guess_name];

  if (!guess) {
    document.getElementById("error")!.style.display = "block";
    return;
  }
  document.getElementById("error")!.style.display = "none";
  document.querySelector<HTMLInputElement>("#guess")!.value = "";

  const secret = pokedex[secret_name]

  const mosaic: ('1' | '2' | '3' | '4' | '5')[] = [
    guess.generation == secret.generation ? '1' : guess.generation < secret.generation ? '2' : '3',
    guess.type1 == secret.type1 ? '1' : guess.type1 == secret.type2 ? '4' : '5',
    guess.type2 == secret.type2 ? '1' : guess.type2 == secret.type1 ? '4' : '5',
    guess.height == secret.height ? '1' : guess.height < secret.height ? '2' : '3',
    guess.weight == secret.weight ? '1' : guess.weight < secret.weight ? '2' : '3'
  ]
  const [generation, type1, type2, height, width] = mosaic;

  const pokeinfo = `<b>Gen:</b> ${guess.generation}<br><b>Type 1:</b> ${guess.type1}` +
    `<br><b>Type 2:</b> ${guess.type2 || "None"}` +
    `<br><b>Height:</b> ${guess.height}<br><b>Weight:</b> ${guess.weight}`;

  const guess_info: GuessV2 = {
    hints: [imgs[generation], imgs[type1], imgs[type2], imgs[height], imgs[width]],
    name: getIdFromPokemon(guess_name),
    info: pokeinfo,
    mosaic: mosaic.join("")
  }

  const guesses = JSON.parse(getCookie("guessesv2", isDaily) || "[]") as GuessesV2;
  guesses.push(guess_info)

  if (guess_name == secret_name && isDaily) {
    let streak = parseInt(getCookie("streak", false));
    streak = isNaN(streak) ? 1 : streak + 1;
    setCookie("streak", streak.toString(), 300, false, true);
  }

  setCookie("guessesv2", JSON.stringify(guesses), 100, isDaily)
  showState(isDaily)
}

export function toggleHints(isDaily = false) {
  const enableHints = !globals.game.hintsEnabled;
  const enabledCookie = getCookie("hintsenabled", isDaily) == "0" ? "1" : "0"
  setCookie("hintsenabled", enabledCookie);
  document.getElementById("toggleinfo")!.innerHTML = `📋 Pokémon Info ${enableHints ? "ON" : "OFF"}`;
}

const guessesFromGenerationRange = ['5', '5', '6', '6', '7', '7', '8', '8', '8'];
export function newGame(isDaily = false) {
  let mingen = isDaily ? 1 : parseInt(document.querySelector<HTMLInputElement>("#mingen")!.value)
  let maxgen = isDaily ? 9 : parseInt(document.querySelector<HTMLInputElement>("#maxgen")!.value)

  if (mingen > maxgen) {
    [mingen, maxgen] = [maxgen, mingen]
    document.querySelector<HTMLInputElement>("#mingen")!.value = mingen.toString()
    document.querySelector<HTMLInputElement>("#maxgen")!.value = maxgen.toString()
  }

  const [chosen, filtered] = isDaily ? [getIdFromPokemon(globals.game.dailyPoke), Object.keys(pokedex)] : getRandomPokemon(mingen, maxgen)
  setCookie('guessesv2', "", 30, isDaily)
  setCookie('secret_poke', chosen.toString(), 30, isDaily)
  setCookie('min_gene', mingen.toString(), 30, isDaily)
  setCookie('max_gene', maxgen.toString(), 30, isDaily)
  setCookie('t_attempts', guessesFromGenerationRange[maxgen - mingen], 30, isDaily)

  autocomplete(document.querySelector<HTMLInputElement>("#guess")!, filtered);

  for (let i = 0; i < 8; i++) {
    document.getElementById(`guess${i}`)?.remove();
  }

  for (const type of types) {
    const typeb = document.getElementById(`type_${type}`)!;
    typeb.style.opacity = "0.7";
    typeb.style.borderStyle = "none";
  }

  document.getElementById("guessform")!.style.display = "block";
  document.getElementById("results")!.style.display = "none";
  document.getElementById("lost")!.style.display = "none";
  document.getElementById("won")!.style.display = "none";
  document.getElementById("secretpoke")!.innerHTML = getPokemonFromId(chosen);
  showState(isDaily)
}

export function handleLoad(isDaily = false) {
  let poke = getCookie("secret_poke", isDaily)
  let mingen = poke ? parseInt(getCookie("min_gene", isDaily)) : 1
  let maxgen = poke ? parseInt(getCookie("max_gene", isDaily)) : 9

  if (!isDaily) {
    document.querySelector<HTMLInputElement>("#mingen")!.value = mingen.toString()
    document.querySelector<HTMLInputElement>("#maxgen")!.value = maxgen.toString()
  }
  newGame(isDaily)
  autocomplete(document.querySelector<HTMLInputElement>("#guess")!, getRandomPokemon(mingen, maxgen)[1]);
}