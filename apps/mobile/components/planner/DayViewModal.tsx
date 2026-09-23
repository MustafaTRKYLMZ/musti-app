import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { AppModal, spacing } from "@musti/ui-native";
import { toBcp47, useTranslation } from "@musti/core";
import type { CalendarConfig, WeekViewConfig } from "@musti/planner";
import { DayView } from "./DayView";

type Props = {
  visible: boolean;
  day: Date;
  onClose: () => void;
  config: CalendarConfig;
  weekView: WeekViewConfig;
  locale?: string;
};

export function DayViewModal({
  visible,
  day,
  onClose,
  config,
  weekView,
  locale,
}: Props) {
  const { language } = useTranslation();
  const localeTag = locale ?? toBcp47(language);

  const title = useMemo(() => {
    const dayNum = day.getDate();
    const weekday = day.toLocaleDateString(localeTag, { weekday: "long" });
    return `${dayNum} ${weekday}`;
  }, [day, localeTag]);

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      variant="full"
      title={title}
      showClose
      scrollable={false}
      contentContainerStyle={styles.content}
      actions={{
        showSave: false,
        showDelete: false,
        showCancel: false,
      }}
    >
      <View style={styles.body}>
        <DayView
          day={day}
          config={config}
          weekView={weekView}
          locale={locale}
          hideTitle
          variant="modal"
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xs,
    flex: 1,
    paddingHorizontal: 0,
  },
  body: {
    flex: 1,
  },
});
