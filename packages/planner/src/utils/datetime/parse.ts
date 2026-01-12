export function toDate(input: unknown): Date {
    if (input instanceof Date) return input;
    if (typeof input === "number") return new Date(input);
  
    if (typeof input !== "string") return new Date(input as any);
  
    let s = input.trim();
    if (!s) return new Date(NaN);
  
    s = s.replace(" ", "T");
    s = s.replace(/([+\-]\d{2})(\d{2})$/, "$1:$2");
  
    const hasTz = /([zZ]|[+\-]\d{2}:\d{2})$/.test(s);
    if (hasTz) {
      const d = new Date(s);
      if (Number.isFinite(d.getTime())) return d;
    }
  
    const m =
      s.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
      ) || null;
  
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const da = Number(m[3]);
      const hh = m[4] ? Number(m[4]) : 0;
      const mm = m[5] ? Number(m[5]) : 0;
      const ss = m[6] ? Number(m[6]) : 0;
      const ms = m[7] ? Number(m[7].padEnd(3, "0")) : 0;
  
      const d = new Date(y, mo, da, hh, mm, ss, ms);
      if (Number.isFinite(d.getTime())) return d;
    }
  
    return new Date(s);
  }
  