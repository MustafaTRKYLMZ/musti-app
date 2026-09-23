export const WEEKDAYS: { label: string; value: number }[] = Array.from(
  { length: 7 },
  (_, index) => {
   
    const referenceMonday = new Date(Date.UTC(2020, 0, 6));
    const referenceDateForDay = new Date(
      referenceMonday.getTime() + index * 24 * 60 * 60 * 1000
    );

    const label = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
      referenceDateForDay
    );

  
    const value = index === 6 ? 0 : index + 1;

    return { label, value };
  }
);
