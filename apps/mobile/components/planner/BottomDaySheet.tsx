import React, { useMemo, useRef } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTranslation, toBcp47 } from "@musti/core";
import { MText, spacing, useTheme } from "@musti/ui-native";
import type { MEvent } from "@musti/planner";
import { formatTime } from "@/utils/calendar/format";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { EmptyState } from "@/components/ui/EmptyState";

export function BottomDaySheet(props: {
  date: Date;
  events: MEvent[];
  locale?: string;
  onCreate: () => void;
  onPressEvent: (e: MEvent) => void;
  onClose?: () => void;
}) {
  const ref = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["22%", "45%", "75%"], []);
  const { colors } = useTheme();
  const { t, language } = useTranslation();

  const locale = props.locale ?? toBcp47(language);

  return (
    <BottomSheet
      ref={ref}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={props.onClose}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.borderSubtle }}
    >
      <View style={styles.wrap}>
        <View style={styles.row}>
          <MText variant="bodyStrong" style={{ color: colors.textPrimary, flex: 1 }}>
            {props.date.toLocaleDateString(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </MText>

          <HeaderIconButton
            icon="add-outline"
            accessibilityLabel={t("empty.events.action")}
            onPress={props.onCreate}
          />
        </View>

        {props.events.length === 0 ? (
          <EmptyState
            compact
            icon="calendar-outline"
            title={t("empty.events.title")}
            actionLabel={t("empty.events.action")}
            onAction={props.onCreate}
          />
        ) : (
          props.events.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => props.onPressEvent(e)}
              style={styles.item}
              accessibilityRole="button"
              accessibilityLabel={e.title}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: e.color ?? colors.primary },
                ]}
              />
              <View style={{ flex: 1 }}>
                <MText variant="bodyStrong" numberOfLines={1}>
                  {e.title}
                </MText>
                <MText variant="caption" color="textSecondary">
                  {formatTime(e.start, locale)} – {formatTime(e.end, locale)}
                </MText>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
});
