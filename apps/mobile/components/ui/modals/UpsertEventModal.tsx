import React, { useState, useCallback, useEffect, useRef } from "react";
import { Keyboard } from "react-native";
import type { MEvent } from "@musti/planner";
import { spacing } from "@musti/ui-native";

import { AppModal } from "@musti/ui-native";
import { useTranslation } from "@musti/core";
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
  onSubmit: (
    e: Omit<MEvent, "id">,
    targetCalendarId: string
  ) => void | Promise<void>;
};

type EditProps = BaseProps & {
  mode: "edit";
  event: MEvent;
  onSubmit: (id: string, patch: Partial<MEvent>) => void | Promise<void>;

  onDelete: () => void;
};

type Props = CreateProps | EditProps;

export const UpsertEventModal = (props: Props) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const savingRef = useRef(false);
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

  useEffect(() => {
    if (!props.visible) {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [props.visible]);

  const handleSave = useCallback(async () => {
    if (savingRef.current || !c.canSave) return;
    Keyboard.dismiss();
    savingRef.current = true;
    setIsSaving(true);
    try {
      await c.save();
    } catch (err) {
      if (__DEV__) {
        console.error("[Planner] event save failed:", err);
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [c.canSave, c.save]);

  const savingLabel =
    props.mode === "edit" ? t("common.updating") : t("common.saving");

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
          deleteLabel: t("delete"),
          deleteDisabled: props.mode !== "edit" || isSaving,

          onSave: () => void handleSave(),
          saveDisabled: !c.canSave || isSaving,
          saveLoading: isSaving,
          cancelLabel: t("cancel"),
          saveLabel: isSaving
            ? savingLabel
            : props.mode === "edit"
              ? t("update")
              : t("save"),
          onCancel: isSaving ? undefined : props.onClose,
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
          calendarOptions={c.calendarOptions}
          targetCalendarId={c.targetCalendarId}
          onChangeCalendar={c.setTargetCalendarId}
          calendarLocked={c.calendarLocked}
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
