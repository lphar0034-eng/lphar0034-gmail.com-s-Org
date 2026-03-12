export function numberToFrenchWords(amount: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

  function convertSection(n: number, isEnd: boolean = true): string {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (t === 7) return "soixante-" + (u === 1 ? "et-onze" : teens[u]);
      if (t === 8 && u === 0) return "quatre-vingt" + (isEnd ? "s" : "");
      if (t === 9) return "quatre-vingt-" + teens[u];
      if (u === 0) return tens[t];
      if (u === 1 && t < 8) return tens[t] + "-et-un";
      return tens[t] + "-" + units[u];
    }
    const h = Math.floor(n / 100);
    const r = n % 100;
    let s = h === 1 ? "cent" : units[h] + "-cent";
    if (h > 1 && r === 0 && isEnd) s += "s";
    if (r > 0) s += "-" + convertSection(r, isEnd);
    return s;
  }

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = "";

  if (integerPart === 0) {
    result = "zéro";
  } else if (integerPart < 1000) {
    result = convertSection(integerPart, true);
  } else if (integerPart < 1000000) {
    const thousands = Math.floor(integerPart / 1000);
    const remainder = integerPart % 1000;
    result = (thousands === 1 ? "" : convertSection(thousands, false) + "-") + "mille";
    if (remainder > 0) result += "-" + convertSection(remainder, true);
  } else {
    // Fallback for millions
    const millions = Math.floor(integerPart / 1000000);
    const remainder = integerPart % 1000000;
    result = convertSection(millions, false) + " million" + (millions > 1 ? "s" : "");
    if (remainder > 0) {
        if (remainder < 1000) result += " " + convertSection(remainder, true);
        else {
            const thousands = Math.floor(remainder / 1000);
            const rem = remainder % 1000;
            result += " " + (thousands === 1 ? "" : convertSection(thousands, false) + "-") + "mille";
            if (rem > 0) result += "-" + convertSection(rem, true);
        }
    }
  }

  result = result.replace(/-/g, " ").trim();
  result += " DIRHAMS";
  
  if (decimalPart > 0) {
    result += " ET " + convertSection(decimalPart, true).replace(/-/g, " ").trim() + " CENTIMES";
  } else {
    result += ", 00 CTS";
  }

  return result.toUpperCase();
}
