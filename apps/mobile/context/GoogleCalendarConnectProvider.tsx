import React, { createContext, useContext } from "react";
import { useGoogleCalendarConnect } from "@/hooks/useGoogleCalendarConnect";

type GoogleCalendarConnectValue = ReturnType<typeof useGoogleCalendarConnect>;

const GoogleCalendarConnectContext =
  createContext<GoogleCalendarConnectValue | null>(null);

/** Keeps OAuth session handling mounted for the whole app lifecycle. */
export function GoogleCalendarConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useGoogleCalendarConnect();
  return (
    <GoogleCalendarConnectContext.Provider value={value}>
      {children}
    </GoogleCalendarConnectContext.Provider>
  );
}

export function useGoogleCalendarConnectContext() {
  const ctx = useContext(GoogleCalendarConnectContext);
  if (!ctx) {
    throw new Error(
      "useGoogleCalendarConnectContext must be used within GoogleCalendarConnectProvider"
    );
  }
  return ctx;
}
