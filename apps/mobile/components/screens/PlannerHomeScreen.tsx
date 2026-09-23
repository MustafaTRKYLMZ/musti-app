import React, { useMemo, useCallback, useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import "dayjs/locale/nl";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";

import { AppScreen } from "../AppScreen";
import { spacing, radii, MText, useTheme } from "@musti/ui-native";
import { PlannerHeaderCenter } from "../planner/PlannerHeaderCenter";
import { PlannerHeaderRight } from "../planner/PlannerHeaderRight";
import { PlannerHeaderLeft } from "../planner/PlannerHeaderLeft";
import { BottomDaySheet } from "../planner/BottomDaySheet";
import { FloatingCreateButton } from "../planner/FloatingCreateButton";
import { Calendar } from "../planner/Calendar";
import { eventsForDay, MEvent } from "@musti/planner";
import { useTranslation, toAppLocale } from "@musti/core";
import { useCalendar } from "@/hooks/useCalendar";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { PlannerEventSearchModal } from "@/components/planner/PlannerEventSearchModal";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale("en");

export const PlannerHomeScreen = () => {
  const { colors } = useTheme();
  const { language, t } = useTranslation();
  const plannerLocale = toAppLocale(language);

  useEffect(() => {
    dayjs.locale(plannerLocale);
  }, [plannerLocale]);
  const {
    date,
    selectedDate,
    view,
    daySheetOpen,
    setDate,
    openDay,
    closeDaySheet,
    openCreate,
    pressEvent,
    hasHydrated,
    events,
  } = useCalendar();

  const sourcesHydrated = useCalendarSourcesStore((s) => s.hasHydrated);
  const eventsHydrated = useCalendarEventsStore((s) => s.hasHydrated);
  const allEvents = useCalendarEventsStore((s) => s.events);
  const ready = hasHydrated && sourcesHydrated && eventsHydrated;

  const { syncNow, isSyncing } = useCalendarSync(ready);

  const handleSync = useCallback(() => {
    void syncNow();
  }, [syncNow]);

  const [searchOpen, setSearchOpen] = useState(false);

  const weekNumber = useMemo(() => dayjs(date).isoWeek(), [date]);

  const selectedEvents = useMemo(() => {
    return eventsForDay(selectedDate, events);
  }, [selectedDate, events]);

  const onPressFab = useCallback(() => {
    openCreate(selectedDate);
  }, [openCreate, selectedDate]);

  const onPressToday = useCallback(() => {
    const today = new Date();
    setDate(today);
    if (view !== "month") {
      openDay(today);
    }
  }, [setDate, openDay, view]);

  return (
    <AppScreen
      headerLeft={
        <PlannerHeaderLeft
          weekNumber={weekNumber}
          onPressToday={onPressToday}
          onSync={handleSync}
          isSyncing={isSyncing}
        />
      }
      variant="planner"
      headerCenter={<PlannerHeaderCenter date={date} locale={plannerLocale} />}
      headerRight={
        <PlannerHeaderRight onSearch={() => setSearchOpen(true)} />
      }
    >
      <View style={styles.body}>
        {isSyncing ? (
          <View
            style={[
              styles.syncBar,
              {
                backgroundColor: colors.surfaceElevated,
                borderBottomColor: colors.borderSubtle,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <MText variant="caption" color="textSecondary">
              {t("planner.syncBar")}
            </MText>
          </View>
        ) : null}

        <Calendar
          config={{ weekStartsOn: 1, locale: plannerLocale }}
          locale={plannerLocale}
          weekView={{
            stepMinutes: 15,
            pxPerMinute: 1.15,
            startHour: 0,
            endHour: 24,
          }}
          onEventChange={() => {}}
          onRefresh={handleSync}
          refreshing={isSyncing}
        />

        <FloatingCreateButton onPress={onPressFab} />

        {daySheetOpen && (
          <BottomDaySheet
            date={selectedDate}
            events={selectedEvents}
            onCreate={() => openCreate(selectedDate)}
            onPressEvent={(e: MEvent) => pressEvent(e.id, e.start)}
            onClose={closeDaySheet}
          />
        )}

        <PlannerEventSearchModal
          visible={searchOpen}
          events={allEvents}
          onClose={() => setSearchOpen(false)}
          onSelectEvent={(ev) => pressEvent(ev.id, ev.start)}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1 },
  syncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
