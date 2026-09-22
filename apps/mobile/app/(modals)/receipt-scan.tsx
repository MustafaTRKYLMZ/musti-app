import React from "react";
import { Stack } from "expo-router";
import { ReceiptScanModalScreen } from "@/components/screens/ReceiptScanModalScreen";

export default function ReceiptScanRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
      <ReceiptScanModalScreen />
    </>
  );
}
