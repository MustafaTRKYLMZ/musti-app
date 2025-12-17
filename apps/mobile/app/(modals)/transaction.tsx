// apps/mobile/app/(modals)/transaction.tsx
import React from "react";
import { Stack } from "expo-router";
import { TransactionModalScreen } from "@/components/screens/TranslationModalScreen";

export default function TransactionRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: "transparentModal",
          animation: "fade",
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <TransactionModalScreen />
    </>
  );
}
