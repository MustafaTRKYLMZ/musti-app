// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { useTranslation } from "@budget/core";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
          height: 0,
        },
      }}
    >
      {/* BUDGET */}
      <Tabs.Screen
        name="budget"
        options={{
          title: "budget",
        }}
      />

      {/* BOOKSHELF */}
      <Tabs.Screen
        name="bookshelf"
        options={{
          title: "bookshelf",
        }}
      />

      {/* ABOUT */}
      <Tabs.Screen
        name="about"
        options={{
          title: t("about"),
          href: null,
        }}
      />
    </Tabs>
  );
}
