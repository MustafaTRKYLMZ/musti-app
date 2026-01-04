import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { addDays, startOfWeek, sameDay } from "../../engine/helpers";

const TIME_COL_WIDTH = 56;

export function DaysHeader(props: {
  date: Date;
  weekStartsOn: number;
  locale?: string;
}) {
  const { width } = useWindowDimensions();
  const weekStart = startOfWeek(props.date, props.weekStartsOn);
  const daysWidth = width - TIME_COL_WIDTH;
  const colWidth = daysWidth / 7;

  const today = new Date();

  return (
    <View style={styles.container}>
      <View style={{ width: TIME_COL_WIDTH }} />
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(weekStart, i);
        const isToday = sameDay(d, today);

        return (
          <View
            key={i}
            style={[styles.day, { width: colWidth }, isToday && styles.today]}
          >
            <Text style={[styles.dayName, isToday && styles.todayText]}>
              {d.toLocaleDateString(props.locale ?? "tr-TR", {
                weekday: "short",
              })}
            </Text>
            <Text style={[styles.dayNumber, isToday && styles.todayText]}>
              {d.getDate()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  day: { alignItems: "center", paddingVertical: 6 },
  dayName: { fontSize: 12, color: "#666" },
  dayNumber: { fontSize: 14, fontWeight: "700", color: "#111" },
  today: { backgroundColor: "#EEF4FF", borderRadius: 10 },
  todayText: { color: "#2F6FED" },
});
