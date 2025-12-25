export type NotificationOwner = "budget" | "bookshelf";

export type DailyReminderConfig = {
  owner: NotificationOwner;
  hour: number;
  minute: number;
  title: string;
  body: string;
  kind?: string;
};

export type ReminderLink =
  | { kind: "normal"; bookUri: string; bookName?: string }
  | { kind: "plan"; planId: string; bookUri?: string; bookName?: string }
  | { kind: "target"; targetId: string }
  | { kind: "reminders"; owner: NotificationOwner };

export type NotificationPayload =
  | { v: 1; link: ReminderLink }
  | { v: 1; kind: "generic"|"motivation" }; 
