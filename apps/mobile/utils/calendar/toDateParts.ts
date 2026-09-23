export const toDateParts = (d: string) => {
  const [y, m, day] = d.split("-").map((x) => Number(x));
  return { y, m, day };
};

