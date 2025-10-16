import countries from "i18n-iso-countries";

// Registrar idioma español
countries.registerLocale(require("i18n-iso-countries/langs/es.json"));

export function getCountryCode(nombrePais: string): string | null {
  if (!nombrePais) return null;
  const code = countries.getAlpha2Code(nombrePais, "es");
  return code || null; // retorna null si no encuentra
}