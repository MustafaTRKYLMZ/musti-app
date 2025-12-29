export const isValidTimeOfDay=(v: string) => {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [h, m] = v.split(":").map(Number);
  return (
    Number.isFinite(h) &&
    Number.isFinite(m) &&
    h >= 0 &&
    h <= 23 &&
    m >= 0 &&
    m <= 59
  );
}



export const  normalizeTimeOfDay=(v: string) => {
  const cleaned = v.replace(/[^\d:]/g, "");
  if (cleaned.length === 5 && isValidTimeOfDay(cleaned)) return cleaned;
  return cleaned;
}