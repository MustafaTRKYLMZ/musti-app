// apps/mobile/app/(modals)/transaction.tsx
import React from "react";
import { Stack } from "expo-router";
import { TransactionModalScreen } from "@/components/screens/TranslationModalScreen";

export default function TransactionRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
      <TransactionModalScreen />
    </>
  );
}
