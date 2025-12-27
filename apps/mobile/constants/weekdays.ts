export const WEEKDAYS: { label: string; value: number }[] = Array.from(
  { length: 7 },
  (_unused, index) => {
    const value = index + 1;
    const referenceMonday = new Date(Date.UTC(2020, 0, 6));
    const referenceDateForDay = new Date(
      referenceMonday.getTime() + index * 24 * 60 * 60 * 1000
    );
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
    }).format(referenceDateForDay);

    return { label, value };
  }
);