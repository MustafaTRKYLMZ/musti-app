import { useEffect } from "react";
import { useRouter } from "expo-router";

/** @deprecated Use transaction modal with tab=scan instead. */
export function ReceiptScanModalScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace({
      pathname: "/(modals)/transaction",
      params: { mode: "create", tab: "scan" },
    });
  }, [router]);

  return null;
}
