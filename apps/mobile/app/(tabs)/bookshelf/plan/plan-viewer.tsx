import React from "react";
import { ReaderShell } from "@/components/Books/ReaderShell";
import { usePlanReaderController } from "@/components/Books/controllers/usePlanReaderController";

export default function PlanViewerScreen() {
  const ctrl = usePlanReaderController();
  return <ReaderShell {...ctrl} />;
}
