export function formatDurationShort(ms: number): string | null {
    if (!Number.isFinite(ms) || ms <= 0) return null;
  
    const totalSec = Math.floor(ms / 1000);
    if (totalSec <= 0) return "0s";
  
    const s = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const m = totalMin % 60;
    const h = Math.floor(totalMin / 60);
  
    if (totalMin === 0) {
      return `${s}s`;
    }
  
    if (h === 0) {
      return `${totalMin}m ${String(s).padStart(2, "0")}s`;
    }
  
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  