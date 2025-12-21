import React from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";

import { BaseIcon } from "@/components/ui/AppIcon";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";

import type { ReadingEvent, ReadingMode } from "@budget/core";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { getSectionLabel, rangeCount } from "@/utils/statsBookUtils";
import { modeIcon, modeLabel } from "@/config/statsBookConfig";

type Props = {
  events: ReadingEvent[];
  formatTime?: (at: number) => string;
};

export function EventList({ events, formatTime }: Props) {
  const { colors } = useTheme();

  if (!events.length) return null;

  return (
    <View style={styles.list}>
      {events.map((e, idx) => {
        const t = formatTime ? formatTime(e.at) : dayjs(e.at).format("HH:mm");
        const from = toNonNegativeInt(e.pageFrom);
        const to = toNonNegativeInt(e.pageTo);
        const delta = rangeCount(from, to);
        const section = getSectionLabel(e);

        return (
          <View key={`${e.at}-${idx}`} style={styles.row}>
            <View style={styles.left}>
              <MText
                variant="caption"
                color="textSecondary"
                style={{ width: 44 }}
              >
                {t}
              </MText>

              <View style={styles.mode}>
                <BaseIcon
                  name={modeIcon[e.mode as ReadingMode] as any}
                  size={12}
                  color={colors.textSecondary}
                />
                <MText variant="caption" color="textSecondary">
                  {modeLabel[e.mode as ReadingMode]}
                </MText>
              </View>

              <MText
                variant="caption"
                color="textPrimary"
                style={{ fontWeight: "900" }}
              >
                p{Math.min(from, to)}–p{Math.max(from, to)}
              </MText>

              <MText variant="caption" color="textSecondary">
                (+{delta})
              </MText>
            </View>

            <MText
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
              style={{ maxWidth: "55%" }}
            >
              {section}
            </MText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  mode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
  },
});
