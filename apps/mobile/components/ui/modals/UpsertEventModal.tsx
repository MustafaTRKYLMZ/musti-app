import React, { useState, useCallback } from "react";
import type { MEvent } from "@musti/planner";
import { spacing } from "@musti/ui-native";

import { AppModal } from "@musti/ui-native";
import { useEventFormController } from "@/components/planner/controllers/useEventFormController";
import { EventForm } from "@/components/planner/EventForm";
import { EventColorPickerModal } from "./EventColorPickerModal";

type BaseProps = {
  visible: boolean;
  day: Date;
  startMinute?: number;
  timezone?: string;
  locale?: string;
  onClose: () => void;
};

type CreateProps = BaseProps & {
  mode: "create";
  onSubmit: (e: Omit<MEvent, "id">) => void;
};

type EditProps = BaseProps & {
  mode: "edit";
  event: MEvent;
  onSubmit: (id: string, patch: Partial<MEvent>) => void;

  onDelete: () => void;
};

type Props = CreateProps | EditProps;

export const UpsertEventModal = (props: Props) => {
  const [colorOpen, setColorOpen] = useState(false);
  const openColors = useCallback(() => setColorOpen(true), []);
  const closeColors = useCallback(() => setColorOpen(false), []);

  const c = useEventFormController(
    props.mode === "edit"
      ? {
          mode: "edit",
          visible: props.visible,
          day: props.day,
          startMinute: props.startMinute,
          timezone: props.timezone,
          locale: props.locale,
          onClose: props.onClose,
          event: props.event,
          onSubmit: props.onSubmit,
        }
      : {
          mode: "create",
          visible: props.visible,
          day: props.day,
          startMinute: props.startMinute,
          timezone: props.timezone,
          locale: props.locale,
          onClose: props.onClose,
          onSubmit: props.onSubmit,
        }
  );

  const selectedColor = c.watch("color");
  const allDay = !!c.watch("allDay");

  return (
    <>
      <AppModal
        visible={props.visible}
        onClose={props.onClose}
        variant="center"
        closeOnBackdrop={false}
        showClose={false}
        contentContainerStyle={{ paddingTop: spacing.xs }}
        actions={{
          onDelete: props.mode === "edit" ? props.onDelete : undefined,
          deleteLabel: "Delete",
          deleteDisabled: props.mode !== "edit",

          onSave: c.save,
          saveDisabled: !c.canSave,
          cancelLabel: "Cancel",
          saveLabel: props.mode === "edit" ? "Update" : "Save",
          onCancel: props.onClose,
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
};
