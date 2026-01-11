export type WeekSeg = {
    id: string;
    color: string;
    title: string;
    startCol: number; 
    endCol: number; 
  };
  
  export function packWeekSegments(segs: WeekSeg[]) {
    const sorted = [...segs].sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      return b.endCol - b.startCol - (a.endCol - a.startCol);
    });
  
    const rows: { endCol: number }[] = [];
    const placement = new Map<string, number>();
  
    for (const s of sorted) {
      let placed = -1;
      for (let r = 0; r < rows.length; r++) {
        if (s.startCol > rows[r].endCol) {
          placed = r;
          break;
        }
      }
      if (placed === -1) {
        placed = rows.length;
        rows.push({ endCol: s.endCol });
      } else {
        rows[placed].endCol = s.endCol;
      }
      placement.set(s.id, placed);
    }
  
    return { placement, rowCount: rows.length };
  }
  