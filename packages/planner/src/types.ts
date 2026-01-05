export type MEvent = {
    id: string;
    title: string;
    start: string; // ISO datetime
    end: string;   // ISO datetime
    color?: string;
    meta?: Record<string, any>;
  };
  
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
  