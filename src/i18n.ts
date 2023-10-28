import { setCookie } from "./utils.js";
import { handleLoad } from "./game.js";

export const languages = ["ja", "ko", "de", "fr", "en"] as const;
export type Language = typeof languages[number];

//TODO: change language map functionality
let lang_map: Record<string, string> | undefined
let rev_map: Record<string, string> | undefined

export function getPkmnName(name: string): string {
  return lang_map ? lang_map[name] : name
}

export function getRevPkmnName(name: string): string {
  return rev_map ? rev_map[name] : name
}

const guessMessageMap: Record<Language, string> = {
  en: "Who's that Pokémon?",
  ja: "秘密のポケモンは？",
  ko: "포켓몬은?",
  fr: "Quel est ce Pokemon?",
  de: "Welches Pokémon ist das?"
}
export async function setLanguage(lang: Language, isDaily = false) {
  setCookie("lang", lang, 100, false)
  for (let i = 0; i < 8; i++) {
    document.getElementById(`guess${i}`)?.remove()
  }
  if (lang != "en" && languages.includes(lang)) {
    const data: Record<string, string> = await import(`./data/${lang}.json`);
    lang_map = data
    rev_map = {}
    for (const [key, value] of Object.entries(lang_map)) {
      rev_map[value] = key;
    }
    document.querySelector<HTMLInputElement>("#guess")!.placeholder = guessMessageMap[lang] ?? guessMessageMap.en
    handleLoad(isDaily)
  } else {
    lang_map = undefined
    rev_map = undefined
    document.querySelector<HTMLInputElement>("#guess")!.placeholder = "Who's that Pokémon?"
    handleLoad(isDaily)
  }
}

