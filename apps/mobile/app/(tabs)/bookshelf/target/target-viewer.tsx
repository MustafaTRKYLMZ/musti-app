import React from "react";
import { ReaderShell } from "@/components/Books/ReaderShell";
import { useTargetReaderController } from "@/components/Books/controllers/useTargetReaderController";

export default function TargetViewerScreen() {
  const ctrl = useTargetReaderController();
  return <ReaderShell {...ctrl} />;
}
