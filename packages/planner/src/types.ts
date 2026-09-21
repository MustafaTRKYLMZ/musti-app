export type CalendarProvider = "local" | "google";

/** Built-in planner calendar — always available, events are stored locally. */
export const LOCAL_CALENDAR_ID = "local:planner";

export type GoogleAccount = {
  id: string;
  provider: "google";
  email: string;
  displayName?: string;
  connectedAt: string;
};

export type CalendarFeed = {
  id: string;
  accountId: string;
  provider: CalendarProvider;
  /** Provider calendar id, e.g. Google calendar id or LOCAL_CALENDAR_ID */
  externalCalendarId: string;
  name: string;
  color?: string;
  enabled: boolean;
  isPrimary?: boolean;
  /** Google Calendar access role, e.g. owner | writer | reader */
  accessRole?: string;
  lastSyncedAt?: string;
};

export type MEvent = {
  id: string;

  title: string;

  start: string; // ISO 8601
  end: string;

  timezone?: string;

  allDay?: boolean;

  color?: string;
  notes?: string;
  location?: string;

  source?: "planner" | "google" | string;
  externalId?: string;
  calendarId?: string;
  accountId?: string;

  meta?: Record<string, unknown>;
};

export type EventCreate = {
  title: string;

  // UI state
  allDay: boolean;

  // UI inputs (HH:mm)
  startTime: string; // "09:00"
  endTime: string; // "10:00"

  // optional fields
  color?: string;
  location?: string;
  notes?: string;
};

export type BlockedTime = {
  id: string;
  dayIndex: number;
  col: number;
  colCount: number;
  top: number;
  height: number;
  event: MEvent;
};

export type CalendarConfig = {
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  timezone?: string;
};

export type WeekViewConfig = {
  startHour: number; // 7
  endHour: number; // 23
  stepMinutes: number; // 15/30/60/custom
  pxPerMinute: number; // zoom
};

export type CalendarView = "year" | "week" | "month" | "day";

export function isGoogleEvent(event: MEvent): boolean {
  return event.source === "google" || Boolean(event.externalId);
}

export function isLocalPlannerEvent(event: MEvent): boolean {
  return !isGoogleEvent(event);
}
