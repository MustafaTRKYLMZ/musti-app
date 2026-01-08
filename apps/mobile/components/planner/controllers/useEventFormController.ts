import { useEffect, useMemo, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { pad2, type MEvent, type EventCreate } from "@musti/planner";

type BaseArgs = {
  visible: boolean;
  day: Date; // fallback / create day
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

function clampDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isBeforeDay(a: Date, b: Date) {
  return clampDay(a).getTime() < clampDay(b).getTime();
}

function isoToDayAndTime(iso?: string) {
  if (!iso) return null;
  const d = dayjs(iso);
  if (!d.isValid()) return null;
  return {
    day: clampDay(d.toDate()),
    time: minuteToHHmm(d.hour() * 60 + d.minute()),
  };
}

export function useEventFormController(args: Args) {
  const { visible, startMinute, timezone, onClose } = args;

  const initialDays = useMemo(() => {
    if (args.mode === "edit") {
      const s = dayjs(args.event.start);
      const e = dayjs(args.event.end);
      return {
        startDay: clampDay(s.toDate()),
        endDay: clampDay(e.toDate()),
      };
    }
    const d = clampDay(args.day);
    return { startDay: d, endDay: d };
  }, [args]);

  const [startDay, _setStartDay] = useState<Date>(() => initialDays.startDay);
  const [endDay, _setEndDay] = useState<Date>(() => initialDays.endDay);

  useEffect(() => {
    if (!visible) return;
    _setStartDay(initialDays.startDay);
    _setEndDay(initialDays.endDay);
  }, [visible, initialDays]);

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
    // ---- EDIT DEFAULTS ----
    if (args.mode === "edit") {
      const ev = args.event;

      const startParts = isoToDayAndTime(ev.start);
      const endParts = isoToDayAndTime(ev.end);

      const startTime = ev.allDay
        ? "09:00"
        : startParts?.time ?? "09:00";

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

    // ---- CREATE DEFAULTS ----
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
  }, [args, startMinute]);

  const form = useForm<EventCreate>({
    defaultValues,
    mode: "onChange",
  });

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
      form.setValue("startTime", fixed.start, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (fixed.end !== endTime) {
      form.setValue("endTime", fixed.end, {
        shouldDirty: true,
        shouldValidate: true,
      });
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

    const startDt = dayjs(startDay)
      .hour(s.h)
      .minute(s.m)
      .second(0)
      .millisecond(0);

    const endDt = dayjs(endDay)
      .hour(e.h)
      .minute(e.m)
      .second(0)
      .millisecond(0);

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

    let startDt = dayjs(startDay)
      .hour(s.h)
      .minute(s.m)
      .second(0)
      .millisecond(0);

    let endDt = dayjs(endDay)
      .hour(e.h)
      .minute(e.m)
      .second(0)
      .millisecond(0);

    if (!endDt.isAfter(startDt)) {
      endDt = startDt.add(30, "minute");
    }

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
    const patch: Partial<MEvent> = payload;

    args.onSubmit(args.event.id, patch);
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
