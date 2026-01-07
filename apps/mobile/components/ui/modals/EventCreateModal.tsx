import React, { useState, useCallback } from "react";
import type { MEvent } from "@musti/planner";
import { spacing } from "@musti/ui-native";

import { AppModal } from "../AppModal";
import { useEventFormController } from "@/components/planner/controllers/useEventFormController";
import { EventForm } from "@/components/planner/EventForm";
import { EventColorPickerModal } from "./EventColorPickerModal";

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
        onClose={() => {}}
        variant="center"
        closeOnBackdrop={false}
        showClose={false}
        contentContainerStyle={{ paddingTop: spacing.xs }}
        actions={{
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
          startDay={c.startDay}
          endDay={c.endDay}
          onChangeStartDay={c.setStartDay}
          onChangeEndDay={c.setEndDay}
          color={selectedColor}
          onOpenColors={openColors}
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
