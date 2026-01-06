import { useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { pad2, type MEvent, type EventCreate } from "@musti/planner";

type Args = {
  mode: "create";
  visible: boolean;
  day: Date;
  startMinute?: number;
  timezone?: string;
  locale?: string;
  color?: string;
  onClose: () => void;
  onSubmit: (e: Omit<MEvent, "id">) => void;
};

function minuteToHHmm(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${pad2(h)}:${pad2(m)}`;
}

function parseHHmm(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (h < 0 || h > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return { h, m: mm };
}

function clampTimeOrder(start: string, end: string) {
  const s = parseHHmm(start);
  const e = parseHHmm(end);
  if (!s || !e) return { start, end };

  const sMin = s.h * 60 + s.m;
  const eMin = e.h * 60 + e.m;

  if (eMin <= sMin) {
    return { start, end: minuteToHHmm(Math.min(24 * 60 - 1, sMin + 30)) };
  }
  return { start, end };
}

export function useEventFormController({
  mode,
  visible,
  day,
  startMinute,
  timezone,
  color,
  onClose,
  onSubmit,
}: Args) {
  const defaultValues = useMemo<EventCreate>(() => {
    const m = startMinute ?? 9 * 60;
    const snapped = Math.round(m / 15) * 15;
    const startTime = minuteToHHmm(
      Math.max(0, Math.min(23 * 60 + 59, snapped))
    );

    const s = parseHHmm(startTime);
    const endTime = s
      ? minuteToHHmm(Math.min(23 * 60 + 59, s.h * 60 + s.m + 60))
      : "10:00";

    return {
      title: "",
      allDay: false,
      startTime,
      endTime,
      color: color ?? undefined,
      location: "",
      notes: "",
    };
  }, [startMinute,color]);

  const form = useForm<EventCreate>({
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!visible) return;
    form.reset(defaultValues);
  }, [visible, defaultValues, form]);

  // start/end order fix (watch ile)
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  
  useEffect(() => {
    if (!visible) return;
    const fixed = clampTimeOrder(startTime, endTime);
    if (fixed.start !== startTime) form.setValue("startTime", fixed.start);
    if (fixed.end !== endTime) form.setValue("endTime", fixed.end);
  }, [visible, startTime, endTime, form]);


  const title = form.watch("title");
  const allDay = form.watch("allDay");
  

  const canSave = useMemo(() => {
    if (!title?.trim()) return false;
    if (allDay) return true;
  
    const s = parseHHmm(startTime);
    const e = parseHHmm(endTime);
    if (!s || !e) return false;
  
    return e.h * 60 + e.m > s.h * 60 + s.m;
  }, [title, allDay, startTime, endTime]);

  const save = useCallback(() => {
    const v = form.getValues();
    if (!v.title?.trim()) return;

    const cleanTitle = v.title.trim();

    if (v.allDay) {
      const start = dayjs(day).startOf("day").toISOString();
      const end = dayjs(day).add(1, "day").startOf("day").toISOString();

      onSubmit({
        title: cleanTitle,
        start,
        end,
        timezone,
        allDay: true,
        color: v.color,
        location: v.location?.trim() || undefined,
        notes: v.notes?.trim() || undefined,
        source: "planner",
      });

      onClose();
      return;
    }

    const s = parseHHmm(v.startTime);
    const e = parseHHmm(v.endTime);
    if (!s || !e) return;

    const start = dayjs(day)
      .hour(s.h)
      .minute(s.m)
      .second(0)
      .millisecond(0)
      .toISOString();

    const end = dayjs(day)
      .hour(e.h)
      .minute(e.m)
      .second(0)
      .millisecond(0)
      .toISOString();

    onSubmit({
      title: cleanTitle,
      start,
      end,
      timezone,
      allDay: false,
      color: v.color,
      location: v.location?.trim() || undefined,
      notes: v.notes?.trim() || undefined,
      source: "planner",
    });

    onClose();
  }, [form, day, timezone, onClose, onSubmit]);

  const toggleAllDay = useCallback(() => {
    const cur = form.getValues("allDay");
    form.setValue("allDay", !cur, { shouldDirty: true, shouldValidate: true });
  }, [form]);

  return {
    control: form.control,
    errors: form.formState.errors,
    setValue: form.setValue,
    watch: form.watch,
    getValues: form.getValues,

    canSave,
    save,
    toggleAllDay,
    close: onClose,
  };
}
