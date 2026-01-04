import React, { useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet"; // Adjust the import path if necessary
import type { Event } from "../../types";
import { formatTime } from "../../engine/helpers";

export function BottomDaySheet(props: {
  date: Date;
  events: Event[];
  locale?: string;
  onCreate: () => void;
  onPressEvent: (e: Event) => void;
  onClose?: () => void;
}) {
  const ref = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["22%", "45%", "75%"], []);

  return (
    <BottomSheet
      ref={ref}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={props.onClose}
    >
      <View style={styles.wrap}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {props.date.toLocaleDateString(props.locale ?? "tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>

          <Pressable onPress={props.onCreate} style={styles.addBtn}>
            <Text style={styles.addBtnText}>＋</Text>
          </Pressable>
        </View>

        {props.events.length === 0 ? (
          <Text style={styles.empty}>Bu gün için etkinlik yok</Text>
        ) : (
          props.events.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => props.onPressEvent(e)}
              style={styles.item}
            >
              <View
                style={[styles.dot, { backgroundColor: e.color ?? "#2F6FED" }]}
              />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.itemTitle}>
                  {e.title}
                </Text>
                <Text style={styles.itemTime}>
                  {formatTime(e.start, props.locale)} –{" "}
                  {formatTime(e.end, props.locale)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: "800", color: "#111" },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  addBtnText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2F6FED",
    marginTop: -1,
  },
  empty: { marginTop: 10, color: "#777" },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  itemTime: { fontSize: 12, color: "#666", marginTop: 2 },
});
