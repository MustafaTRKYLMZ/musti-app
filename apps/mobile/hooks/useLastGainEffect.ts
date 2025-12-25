import { useEffect } from "react";
import { useLastGain } from "./useLastGain";
import { useToast } from "@/components/ui/ToastProvider";

function labelForMode(mode: string) {
  if (mode === "plan") return "Plan";
  if (mode === "target") return "Target";
  return "Reading";
}

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
    }, 250);

    return () => clearInterval(t);
  }, [consume, showToast]);
}
