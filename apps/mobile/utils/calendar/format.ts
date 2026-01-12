export function formatTime(iso: string, locale = "en-EN") {
    const d = new Date(iso);
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  
  export function getWeekdayLetter(d: Date, locale: string = "en"): string {
    const day = d.getDay(); 
  
    if (locale.startsWith("tr")) {
      return ["P", "P", "S", "Ç", "P", "C", "C"][day];
    } else if (locale.startsWith("nl")) {
      // Default NL
      return ["Z", "M", "D", "W", "D", "V", "Z"][day];
    }
  
    // Default EN
    return ["S", "M", "T", "W", "T", "F", "S"][day];
  }
  
  export const eventToTitle = (e: any): string => {
    return e?.title ?? e?.name ?? e?.summary ?? e?.text ?? e?.label ?? "Event";
  };
  
  export function hhmmToDate(hhmm: string) {
    const [h, m] = (hhmm || "00:00").split(":").map(Number);
    const d = new Date();
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return d;
  }