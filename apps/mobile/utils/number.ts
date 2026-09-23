export const toIntOr = (n: unknown, fallback: number) => {
    const x = Math.floor(Number(n));
    return Number.isFinite(x) ? x : fallback;
  };
  export const clampInt = (n: any,) => {
    const v = Math.floor(Number(n) || 0);
    return Math.max(0, Math.min(999999, v));
  };


  export const clampBetween = (
    n: unknown,
    min: number,
    max: number,
    fallback = min
  ) => {
    const v = toIntOr(n, fallback);
    return Math.max(min, Math.min(max, v));
  };
  
  export const clampPage = (n: unknown) =>
    clampBetween(n, 1, 999_999, 1);
  