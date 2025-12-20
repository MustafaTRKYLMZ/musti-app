export type ReminderOwner = "budget" | "bookshelf";

export type ReminderSchedule =
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: number; hour: number; minute: number } // 1-7
  | { type: "once"; timestamp: number }; // ms

export type ReminderTarget =
  | { type: "general" }
  | { type: "plan"; planName?: string }
  | { type: "book"; bookUri: string; bookName: string }
  | { type: "weeklyReport" };

  export type ReminderItem = {
    id: string;
    owner: ReminderOwner;
  
    enabled: boolean;
  
    title: string;
    body: string;
  
    target: ReminderTarget;
    schedule: ReminderSchedule;
  
    notificationIds: string[];
    scheduledHash?: string;

    createdAt: number;
    updatedAt: number;
  };
  
