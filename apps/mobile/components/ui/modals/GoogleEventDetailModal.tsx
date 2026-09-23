import React from "react";
import { View, StyleSheet } from "react-native";
import type { MEvent } from "@musti/planner";
import { AppModal, MText, spacing } from "@musti/ui-native";

type Props = {
  visible: boolean;
  event: MEvent;
  onClose: () => void;
};

function formatWhen(event: MEvent): string {
  const start = new Date(event.start);
  const end = new Date(event.end);
  if (Number.isNaN(start.getTime())) return event.start;

  if (event.allDay) {
    return start.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const datePart = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${startTime} – ${endTime}`;
}

export function GoogleEventDetailModal({ visible, event, onClose }: Props) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      variant="center"
      showClose
      actions={{
        onCancel: onClose,
        cancelLabel: "Close",
        saveLabel: "Close",
        onSave: onClose,
        saveDisabled: false,
      }}
    >
      <View style={styles.wrap}>
        <MText variant="caption" color="textSecondary">
          Google Calendar
        </MText>
        <MText variant="heading3" style={styles.title}>
          {event.title}
        </MText>
        <MText variant="body" color="textSecondary">
          {formatWhen(event)}
        </MText>
        {event.location ? (
          <MText variant="body" style={styles.field}>
            {event.location}
          </MText>
        ) : null}
        {event.notes ? (
          <MText variant="body" color="textSecondary" style={styles.field}>
            {event.notes}
          </MText>
        ) : null}
        <MText variant="caption" color="textSecondary" style={styles.hint}>
          Synced read-only events can be edited in Google Calendar.
        </MText>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { marginTop: spacing.xs },
  field: { marginTop: spacing.xs },
  hint: { marginTop: spacing.md },
});
