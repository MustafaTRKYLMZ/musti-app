import React from "react";
import { ReaderShell } from "@/components/Books/ReaderShell";
import { useNormalReaderController } from "@/components/Books/controllers/useNormalReaderController";

export default function PdfViewerScreen() {
  const ctrl = useNormalReaderController();
  return <ReaderShell {...ctrl} />;
}
