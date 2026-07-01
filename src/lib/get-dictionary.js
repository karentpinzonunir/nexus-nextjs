// src/lib/get-dictionary.js
import fs from "fs";
import path from "path";
import { DEFAULT_LOCALE, LOCALES } from "./i18n";

export async function getDictionary(locale) {
  const loc = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const base = path.join(process.cwd(), "src", "dictionaries");
  const filePath = path.join(base, `${loc}.json`);
  try {
    if (!fs.existsSync(base)) {
      console.error("getDictionary: carpeta 'src/dictionaries' no encontrada en:", base);
      return {};
    }

    if (!fs.existsSync(filePath)) {
      console.warn("getDictionary: diccionario no encontrado:", filePath);
      console.warn("getDictionary: archivos disponibles:", fs.readdirSync(base));
      // intentar fallback
      const fallbackPath = path.join(base, `${DEFAULT_LOCALE}.json`);
      if (fs.existsSync(fallbackPath)) {
        return JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
      }
      return {};
    }

    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("getDictionary: error leyendo diccionario:", err);
    return {};
  }
}