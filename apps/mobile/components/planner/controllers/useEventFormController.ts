import { useEffect, useMemo, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { type MEvent, type EventCreate } from "@musti/planner";

import { clampTimeOrder } from "@/utils/calendar/clampTimeOrder";
import { clampDay, isBeforeDay } from "@/utils/calendar/isBeforeDay";
import { isoToDayAndTime } from "@/utils/calendar/isoToDayAndTime";
import { minuteToHHmm } from "@/utils/calendar/minuteToHHmm";
import { parseHHmm } from "@/utils/calendar/parseHHmm";

type BaseArgs = {
  visible: boolean;
  day: Date;
  startMinute?: number;
  timezone?: string;
  locale?: string;
  onClose: () => void;
};

type CreateArgs = BaseArgs & {
  mode: "create";
  onSubmit: (e: Omit<MEvent, "id">) => void;
};

type EditArgs = BaseArgs & {
  mode: "edit";
  event: MEvent;
  onSubmit: (id: string, patch: Partial<MEvent>) => void;
};

type Args = CreateArgs | EditArgs;

export function useEventFormController(args: Args) {
  const { visible, startMinute, timezone, onClose } = args;

  const initialDays = useMemo(() => {
    if (args.mode === "edit") {
      const s = dayjs(args.event.start);
      const e = dayjs(args.event.end);
      return { startDay: clampDay(s.toDate()), endDay: clampDay(e.toDate()) };
    }
    const d = clampDay(args.day);
    return { startDay: d, endDay: d };
  }, [
    args.mode,
    args.day,
    args.mode === "edit" ? args.event.start : null,
    args.mode === "edit" ? args.event.end : null,
  ]);

  const [startDay, _setStartDay] = useState<Date>(() => initialDays.startDay);
  const [endDay, _setEndDay] = useState<Date>(() => initialDays.endDay);

  useEffect(() => {
    if (!visible) return;
    _setStartDay(initialDays.startDay);
    _setEndDay(initialDays.endDay);
  }, [visible, initialDays.startDay, initialDays.endDay]);

  const setStartDay = useCallback((d: Date) => {
    const nextStart = clampDay(d);
    _setStartDay(nextStart);

    _setEndDay((curEnd) => {
      const cur = clampDay(curEnd);
      return isBeforeDay(cur, nextStart) ? nextStart : cur;
    });
  }, []);

  const setEndDay = useCallback(
    (d: Date) => {
      const nextEnd = clampDay(d);
      _setEndDay(isBeforeDay(nextEnd, startDay) ? clampDay(startDay) : nextEnd);
    },
    [startDay]
  );

  const defaultValues = useMemo<EventCreate>(() => {
    if (args.mode === "edit") {
      const ev = args.event;
      const startParts = isoToDayAndTime(ev.start);
      const endParts = isoToDayAndTime(ev.end);

      const startTime = ev.allDay ? "09:00" : startParts?.time ?? "09:00";
      const endTime = ev.allDay ? "10:00" : endParts?.time ?? "10:00";

      return {
        title: ev.title ?? "",
        allDay: !!ev.allDay,
        startTime,
        endTime,
        color: ev.color,
        location: ev.location ?? "",
        notes: ev.notes ?? "",
      };
    }

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
      color: undefined,
      location: "",
      notes: "",
    };
  }, [args.mode, startMinute, args.mode === "edit" ? args.event.id : null]);

  const form = useForm<EventCreate>({ defaultValues, mode: "onChange" });

  useEffect(() => {
    if (!visible) return;
    form.reset(defaultValues);
  }, [visible, defaultValues, form]);

  const title = form.watch("title");
  const allDay = form.watch("allDay");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  useEffect(() => {
    if (!visible) return;
    const fixed = clampTimeOrder(startTime, endTime);

    if (fixed.start !== startTime) {
      form.setValue("startTime", fixed.start, { shouldDirty: true, shouldValidate: true });
    }
    if (fixed.end !== endTime) {
      form.setValue("endTime", fixed.end, { shouldDirty: true, shouldValidate: true });
    }
  }, [visible, startTime, endTime, form]);

  useEffect(() => {
    if (!visible) return;
    if (!allDay) return;
    _setEndDay(clampDay(startDay));
  }, [visible, allDay, startDay]);

  const canSave = useMemo(() => {
    const cleanTitle = (title ?? "").trim();
    if (!cleanTitle) return false;
    if (allDay) return true;

    const s = parseHHmm(startTime);
    const e = parseHHmm(endTime);
    if (!s || !e) return false;

    const startDt = dayjs(startDay).hour(s.h).minute(s.m).second(0).millisecond(0);
    const endDt = dayjs(endDay).hour(e.h).minute(e.m).second(0).millisecond(0);
    return endDt.isAfter(startDt);
  }, [title, allDay, startTime, endTime, startDay, endDay]);

  const buildPayload = useCallback((): Omit<MEvent, "id"> | null => {
    const v = form.getValues();
    const cleanTitle = (v.title ?? "").trim();
    if (!cleanTitle) return null;

    if (v.allDay) {
      const d = clampDay(startDay);
      const start = dayjs(d).startOf("day").toISOString();
      const end = dayjs(d).add(1, "day").startOf("day").toISOString();

      return {
        title: cleanTitle,
        start,
        end,
        timezone,
        allDay: true,
        color: v.color,
        location: v.location?.trim() || undefined,
        notes: v.notes?.trim() || undefined,
        source: "planner",
      };
    }

    const s = parseHHmm(v.startTime);
    const e = parseHHmm(v.endTime);
    if (!s || !e) return null;

    let startDt = dayjs(startDay).hour(s.h).minute(s.m).second(0).millisecond(0);
    let endDt = dayjs(endDay).hour(e.h).minute(e.m).second(0).millisecond(0);

    if (!endDt.isAfter(startDt)) endDt = startDt.add(30, "minute");

    return {
      title: cleanTitle,
      start: startDt.toISOString(),
      end: endDt.toISOString(),
      timezone,
      allDay: false,
      color: v.color,
      location: v.location?.trim() || undefined,
      notes: v.notes?.trim() || undefined,
      source: "planner",
    };
  }, [form, startDay, endDay, timezone]);

  const save = useCallback(() => {
    const payload = buildPayload();
    if (!payload) return;

    if (args.mode === "create") {
      args.onSubmit(payload);
      onClose();
      return;
    }

    // ✅ patch merge
    args.onSubmit(args.event.id, { ...payload });
    onClose();
  }, [args, buildPayload, onClose]);

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

    startDay,
    endDay,
    setStartDay,
    setEndDay,

    canSave,
    save,
    buildPayload,
    toggleAllDay,

    close: onClose,
  };
}
