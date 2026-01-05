import React, { JSX } from "react";
import { View } from "react-native";
import { WeekViewConfig } from "../types";

export function snapMinutes(mins: number, step: number) {
  return Math.round(mins / step) * step;
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const startOfWeek = (d: Date, weekStartsOn: number) => {
  const day = d.getDay(); // 0 Sun
  const diff = (day - weekStartsOn + 7) % 7;
  return startOfDay(addDays(d, -diff));
};

export const toDate = (iso: string) => new Date(iso);

export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

export function withDayAndMinutes(day: Date, mins: number) {
  const d = new Date(day);
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  d.setHours(h, m, 0, 0);
  return d;
}

export function formatTime(iso: string, locale = "en-EN") {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function getISOWeekNumber(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeekdayLetter(d: Date, locale: string = "en"): string {
  const day = d.getDay(); // 0 = Sunday

  if (locale.startsWith("tr")) {
    // Paz, Pzt, Sal, Çar, Per, Cum, Cmt
    return ["P", "P", "S", "Ç", "P", "C", "C"][day];
  }

  // ✅ Default EN
  // Sun Mon Tue Wed Thu Fri Sat
  return ["S", "M", "T", "W", "T", "F", "S"][day];
}

export const renderGridLines = (
  week: WeekViewConfig,
  width: number,
  BOTTOM_PADDING_MINUTES,
  styles
) => {
  const lines: JSX.Element[] = [];
  const totalMinutes =
    (week.endHour - week.startHour) * 60 + BOTTOM_PADDING_MINUTES;

  const steps = Math.floor(totalMinutes / week.stepMinutes);

  for (let i = 0; i <= steps; i++) {
    const y = i * week.stepMinutes * week.pxPerMinute;
    lines.push(
      <View key={`line-${i}`} style={[styles.gridLine, { top: y, width }]} />
    );
  }
  return lines;
};
