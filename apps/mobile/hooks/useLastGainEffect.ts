import { useEffect } from "react";
import { useLastGain } from "./useLastGain";
import { useToast } from "@/components/ui/ToastProvider";

function labelForMode(mode: string) {
  if (mode === "plan") return "Plan";
  if (mode === "target") return "Target";
  return "Reading";
}

// Polling interval (in milliseconds) for checking lastGain updates
// 250ms (4 times per second) provides responsive toast notifications
// while keeping CPU usage minimal. The check is lightweight (just reads
// a flag), so the performance impact is negligible.
// Note: An event-based approach would be more efficient but would require
// significant architectural changes to the zustand store pattern.
const LAST_GAIN_POLL_INTERVAL_MS = 250;

export function useLastGainEffect() {
  const { consume } = useLastGain();
  const { showToast } = useToast();

  useEffect(() => {
    const t = setInterval(() => {
      const g = consume();
      if (!g) return;

      const title =
        g.kind === "planComplete"
          ? "Plan completed 🎉"
          : g.kind === "targetComplete"
            ? "Target completed 🏁"
            : "Nice!";

      const modeLabel = labelForMode(g.mode);
      const pagesPart = g.pages > 0 ? `${g.pages} pages` : "";
      const xpPart = g.xp > 0 ? `+${g.xp} XP` : "";

      const message = [modeLabel, pagesPart, xpPart].filter(Boolean).join(" · ");

      showToast({
        title,
        message,
        duration: 2500,
      });
    }, LAST_GAIN_POLL_INTERVAL_MS);

    return () => clearInterval(t);
  }, [consume, showToast]);
}
