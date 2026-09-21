import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import type { CalendarConfig, MEvent, WeekViewConfig } from "@musti/planner";
import { MText, plannerTheme, spacing } from "@musti/ui-native";
import { TimeColumn } from "./TimeColumn";
import { GridEvents } from "./GridEvents";
import { BOTTOM_PADDING_MINUTES, TIME_COL_WIDTH } from "@/config/timeConfigs";
import {
  clamp,
  layoutWeek,
  pad2,
  sameDay,
  segmentEventsForWeek,
  snapMinutes,
  startOfWeek,
} from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";

const { colors } = plannerTheme;

type Props = {
  day: Date;
  config: CalendarConfig;
  weekView: WeekViewConfig;
  locale?: string;
  onEventChange?: (next: MEvent) => void;
  /** Hide inline date heading (e.g. when modal already shows the title). */
  hideTitle?: boolean;
  /** Full day sheet — always show timed blocks with titles (Samsung-style). */
  variant?: "default" | "modal";
};

export function DayView({
  day,
  config,
  weekView,
  locale,
  onEventChange,
  hideTitle = false,
  variant = "default",
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const { events, openCreate } = useCalendar();
  const weekStartsOn = config.weekStartsOn ?? 1;
  const isModal = variant === "modal";

  const [density, setDensity] = useState<"compact" | "expanded">(
    isModal ? "expanded" : "compact"
  );
  const [now, setNow] = useState(() => new Date());
  const vRef = useRef<ScrollView | null>(null);
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const columnWidth = Math.max(0, screenWidth - TIME_COL_WIDTH);
  const gridWidth = columnWidth;

  const startMinVis = weekView.startHour * 60;
  const endMinVis = weekView.endHour * 60;
  const totalMinutes =
    (weekView.endHour - weekView.startHour) * 60 + BOTTOM_PADDING_MINUTES;
  const contentHeight = totalMinutes * weekView.pxPerMinute;
  const hourHeight = 60 * weekView.pxPerMinute;

  const weekStart = useMemo(
    () => startOfWeek(day, weekStartsOn),
    [day, weekStartsOn]
  );

  const focusDayIndex = useMemo(() => {
    const ms = day.getTime() - weekStart.getTime();
    return Math.max(0, Math.min(6, Math.round(ms / 86_400_000)));
  }, [day, weekStart]);

  const blocks = useMemo(() => {
    const segged = segmentEventsForWeek(
      events,
      weekStart,
      startMinVis,
      endMinVis
    );
    const laid = layoutWeek(day, segged as MEvent[], { weekStartsOn }, weekView);
    return laid.blocks
      .filter((b) => b.dayIndex === focusDayIndex)
      .map((b) => ({ ...b, dayIndex: 0 }));
  }, [day, events, weekView, weekStartsOn, startMinVis, endMinVis, weekStart, focusDayIndex]);

  const handleTapGrid = useCallback(
    (_dayIndex: number, yPx: number) => {
      const rawMinute = startMinVis + yPx / weekView.pxPerMinute;
      const snapped = snapMinutes(rawMinute, weekView.stepMinutes);
      const clampedMin = clamp(
        snapped,
        startMinVis,
        endMinVis - weekView.stepMinutes
      );
      openCreate(day, clampedMin);
    },
    [day, weekView, startMinVis, endMinVis, openCreate]
  );

  const isToday = sameDay(day, now);
  const todayIndex = isToday ? 0 : -1;

  const nowInfo = useMemo(() => {
    if (!isToday) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < startMinVis || minutes > endMinVis) return null;
    const y = (minutes - startMinVis) * weekView.pxPerMinute;
    return {
      y,
      label: `${pad2(now.getHours() % 24)}:${pad2(now.getMinutes())}`,
    };
  }, [isToday, now, startMinVis, endMinVis, weekView.pxPerMinute]);

  useEffect(() => {
    if (!nowInfo || !viewportH) return;
    const maxScroll = Math.max(0, contentHeight - viewportH);
    const target = clamp(nowInfo.y - hourHeight, 0, maxScroll);
    vRef.current?.scrollTo({ y: target, animated: false });
  }, [day.getTime(), viewportH, nowInfo, contentHeight, hourHeight]);

  return (
    <View style={styles.root}>
      {!hideTitle ? (
        <MText variant="bodyStrong" style={styles.dayTitle}>
          {day.toLocaleDateString(locale ?? config.locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </MText>
      ) : null}

      <ScrollView
        ref={vRef}
        style={styles.scroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: isModal
            ? BOTTOM_PADDING_MINUTES * weekView.pxPerMinute * 0.4 + spacing["2xl"]
            : spacing.lg,
        }}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (isModal) return;
          const y = e.nativeEvent.contentOffset.y;
          setDensity(y > 40 ? "expanded" : "compact");
        }}
      >
        <View
          style={{
            flexDirection: "row",
            height: contentHeight,
            overflow: "visible",
          }}
        >
          <TimeColumn
            TIME_COL_WIDTH={TIME_COL_WIDTH}
            weekView={weekView}
            hourHeight={hourHeight}
            bottomPaddingMinutes={BOTTOM_PADDING_MINUTES}
            nowY={nowInfo?.y ?? null}
            nowLabel={nowInfo?.label ?? null}
            nowColor={colors.primary ?? "#EF4444"}
          />

          <GridEvents
            mode="day"
            gridWidth={gridWidth}
            totalHeight={contentHeight}
            weekStart={day}
            columnWidth={columnWidth}
            blocks={blocks}
            density={isModal ? "expanded" : density}
            weekView={weekView}
            startMinVis={startMinVis}
            endMinVis={endMinVis}
            bottomPaddingMinutes={BOTTOM_PADDING_MINUTES}
            gridLineStyle={styles.gridLine}
            gridLineStrongStyle={styles.gridLineStrong}
            handleTapGrid={handleTapGrid}
            todayIndex={todayIndex}
            nowY={nowInfo?.y ?? null}
            nowColor={colors.primary ?? "#EF4444"}
            onEventChange={onEventChange}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  dayTitle: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    color: colors.textPrimary,
  },
  gridLine: { backgroundColor: colors.borderSubtle, opacity: 0.35 },
  gridLineStrong: { backgroundColor: colors.borderSubtle, opacity: 0.8 },
});
