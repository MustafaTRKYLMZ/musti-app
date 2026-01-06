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

  meta?: Record<string, any>;
};

export type EventCreate = {
  title: string;

  // UI state
  allDay: boolean;

  // UI inputs (HH:mm)
  startTime: string; // "09:00"
  endTime: string;   // "10:00"

  // optional fields
  color?: string;
  location?: string;
  notes?: string;
};


  export type BlockedTime = 
    {
      id: string;
      dayIndex: number;
      col: number;
      colCount: number;
      top: number;
      height: number;
      event: any;
    }
  export type CalendarConfig = {
    locale?: string;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; 
    timezone?: string;
  };
  
  export type WeekViewConfig = {
    startHour: number;     // 7
    endHour: number;       // 23
    stepMinutes: number;   // 15/30/60/custom
    pxPerMinute: number;   // zoom
  };
  
  export type CalendarView = "week"|"month"; 
  