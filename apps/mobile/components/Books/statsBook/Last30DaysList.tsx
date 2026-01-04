import React from "react";
import { FlatList } from "react-native";
import { DayRow, ReadingEvent } from "/core";
import { DayRowCardContainer } from "./DayRowCardContainer";

type Props = {
  rows: DayRow[];
  eventsByDate: Record<string, ReadingEvent[]>;
  openDates: Record<string, boolean>;
  showAllDates: Record<string, boolean>;
  sectionFilterByDate: Record<string, string | null>;

  defaultEventsDisplayLimit: number;

  toggleDate: (date: string) => void;
  toggleShowAll: (date: string) => void;

  toggleSectionFilter: (date: string, label: string) => void;
  clearSectionFilter: (date: string) => void;

  openDate: (date: string) => void;
};

export function Last30DaysList({
  rows,
  eventsByDate,
  openDates,
  showAllDates,
  sectionFilterByDate,
  defaultEventsDisplayLimit,
  toggleDate,
  toggleShowAll,
  toggleSectionFilter,
  clearSectionFilter,
  openDate,
}: Props) {
  return (
    <FlatList
      data={rows}
      keyExtractor={(x) => x.date}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <DayRowCardContainer
          item={item}
          dayEventsAll={eventsByDate[item.date] ?? []}
          isOpen={!!openDates[item.date]}
          showAll={!!showAllDates[item.date]}
          selectedLabel={sectionFilterByDate[item.date] ?? null}
          defaultEventsDisplayLimit={defaultEventsDisplayLimit}
          toggleDate={toggleDate}
          toggleShowAll={toggleShowAll}
          toggleSectionFilter={toggleSectionFilter}
          clearSectionFilter={clearSectionFilter}
          openDate={openDate}
        />
      )}
    />
  );
}
