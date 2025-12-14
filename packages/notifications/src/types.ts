export type NotificationOwner = "budget" | "bookshelf";

export type DailyReminderConfig = {
  owner: NotificationOwner;
  hour: number;
  minute: number;
  title: string;
  body: string;
  kind?: string; 
};
