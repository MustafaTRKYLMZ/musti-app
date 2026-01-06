import React, { useMemo, useState, useCallback } from "react";
import type { MEvent } from "@musti/planner";
import { StyleSheet } from "react-native";

import { AppModal } from "../AppModal";
import { useEventFormController } from "@/components/planner/controllers/useEventFormController";
import { EventColorPickerModal } from "@/components/ui/modals/EventColorPickerModal";
import { EventForm } from "@/components/planner/EventForm";

type Props = {
  visible: boolean;
  day: Date;
  startMinute?: number;
  timezone?: string;
  locale?: string;
  onClose: () => void;
  onSubmit: (e: Omit<MEvent, "id">) => void;
};

export function EventCreateModal({
  visible,
  day,
  startMinute,
  timezone,
  locale,
  onClose,
  onSubmit,
}: Props) {
  const [colorOpen, setColorOpen] = useState(false);

  const title = useMemo(() => {
    return day.toLocaleDateString(locale ?? "en-EN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [day, locale]);

  const c = useEventFormController({
    mode: "create",
    visible,
    day,
    startMinute,
    timezone,
    locale,
    onClose,
    onSubmit,
  });

  const selectedColor = c.watch("color");
  const allDay = !!c.watch("allDay");

  const openColors = useCallback(() => setColorOpen(true), []);
  const closeColors = useCallback(() => setColorOpen(false), []);

  return (
    <>
      <AppModal
        visible={visible}
        title={title}
        onClose={onClose}
        variant="full"
        closeOnBackdrop={false}
        actions={{
          onCancel: onClose,
          onSave: c.save,
          saveDisabled: !c.canSave,
          cancelLabel: "Cancel",
          saveLabel: "Save",
        }}
      >
        <EventForm
          control={c.control}
          errors={c.errors}
          allDay={allDay}
          onToggleAllDay={c.toggleAllDay}
          colorValue={selectedColor}
          onOpenColor={openColors}
        />
      </AppModal>

      <EventColorPickerModal
        visible={colorOpen}
        value={selectedColor}
        onClose={closeColors}
        onSelect={(color) => {
          c.setValue("color", color, {
            shouldDirty: true,
            shouldValidate: true,
          });
          closeColors();
        }}
      />
    </>
  );
}
