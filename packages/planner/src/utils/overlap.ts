type Interval = { id: string; startMin: number; endMin: number };

export type OverlapPlaced = { id: string; col: number; colCount: number };

export function placeOverlaps(intervals: Interval[]): OverlapPlaced[] {
  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin);

  const result: OverlapPlaced[] = [];
  let active: Interval[] = [];
  let cluster: Interval[] = [];

  const flushCluster = (c: Interval[]) => {
    if (!c.length) return;

    const colEnd: number[] = [];
    const placed: Record<string, number> = {};
    const byStart = [...c].sort((a, b) => a.startMin - b.startMin);

    for (const it of byStart) {
      let col = colEnd.findIndex((end) => end <= it.startMin);
      if (col === -1) {
        col = colEnd.length;
        colEnd.push(it.endMin);
      } else {
        colEnd[col] = it.endMin;
      }
      placed[it.id] = col;
    }

    const colCount = colEnd.length;
    for (const it of c) result.push({ id: it.id, col: placed[it.id], colCount });
  };

  for (const it of sorted) {
    active = active.filter((a) => a.endMin > it.startMin);

    if (active.length === 0 && cluster.length > 0) {
      flushCluster(cluster);
      cluster = [];
    }

    active.push(it);
    cluster.push(it);
  }

  flushCluster(cluster);
  return result;
}
