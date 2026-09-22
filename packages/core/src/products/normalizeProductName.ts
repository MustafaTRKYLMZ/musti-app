export function normalizeProductName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function productNamesMatch(a: string, b: string): boolean {
  const na = normalizeProductName(a);
  const nb = normalizeProductName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}
