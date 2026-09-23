/** Common OCR misreads on thermal receipt fonts (Latin script). */
export const DEFAULT_OCR_CHARACTER_SUBSTITUTIONS: ReadonlyArray<
  readonly [pattern: RegExp, replacement: string]
> = [
  [/\b0(?=[A-Za-z])/g, "O"],
  [/(?<=[A-Za-z])0(?=\d)/g, "O"],
  [/€(\d)/g, "€ $1"],
  [/₺(\d)/g, "₺ $1"],
  [/\bEUR0(\d)/gi, "EUR $1"],
  [/\bT0TAL\b/gi, "TOTAL"],
  [/\bT0PLAM\b/gi, "TOPLAM"],
  [/\bT0TAAL\b/gi, "TOTAAL"],
  [/\bSUBT0TAL\b/gi, "SUBTOTAL"],
  [/\bSUBT0TAAL\b/gi, "SUBTOTAAL"],
  [/\bBETAALD\b/gi, "BETAALD"],
  [/\bBETALEN\b/gi, "BETALEN"],
  [/\bMELK\b/gi, "MELK"],
  [/\bMlLK\b/gi, "MILK"],
  [/\bREGELS\b/gi, "REGELS"],
  [/\bREGEIS\b/gi, "REGELS"],
  [/\bARTIKEL\b/gi, "ARTIKEL"],
  [/\bARTIKELEN\b/gi, "ARTIKELEN"],
  [/\bKASSABON\b/gi, "KASSABON"],
  [/\bKASSAB0N\b/gi, "KASSABON"],
  [/\bGUvEN\b/gi, "GUVEN"],
  [/\bGÜvEN\b/gi, "GÜVEN"],
  [/\bALBERT\s*HElJN\b/gi, "ALBERT HEIJN"],
  [/\bALBERT\s*HE1JN\b/gi, "ALBERT HEIJN"],
  [/\bJUMBO\b/gi, "JUMBO"],
  [/\bJUMB0\b/gi, "JUMBO"],
  [/\bACTI0N\b/gi, "ACTION"],
  [/\bKRUIDVAT\b/gi, "KRUIDVAT"],
  [/\bET0S\b/gi, "ETOS"],
  [/\bMIGR0S\b/gi, "MIGROS"],
  [/\bCARREFOUR\b/gi, "CARREFOUR"],
  [/\bSHELL\b/gi, "SHELL"],
  [/\bSH3LL\b/gi, "SHELL"],
  [/\bx(\d)/gi, "×$1"],
  [/@(\d)/g, "×$1"],
  [/(?<=\d)[lI|](?=\d)/g, "1"],
  [/(?<=\d)[oO](?=\d)/g, "0"],
];

export type OcrUserCorrection = {
  from: string;
  to: string;
};

export function applyOcrCharacterSubstitutions(
  text: string,
  userCorrections: OcrUserCorrection[] = []
): string {
  let result = text;

  for (const [pattern, replacement] of DEFAULT_OCR_CHARACTER_SUBSTITUTIONS) {
    result = result.replace(pattern, replacement);
  }

  for (const correction of userCorrections) {
    const from = correction.from.trim();
    const to = correction.to.trim();
    if (!from || !to || from === to) continue;
    result = result.split(from).join(to);
  }

  return result;
}
