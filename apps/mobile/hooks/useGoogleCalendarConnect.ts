import { useCallback, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GOOGLE_CALENDAR_SCOPES,
  googleCalendarConfig,
  isGoogleCalendarConfigured,
} from "@/constants/googleCalendarConfig";
import {
  fetchGoogleCalendarList,
  fetchGoogleUserProfile,
} from "@/services/googleCalendar/googleCalendarApi";
import { storeGoogleAuthResult } from "@/services/googleCalendar/accessToken";
import { syncGoogleCalendarsForAccount } from "@/services/googleCalendar/syncGoogleCalendars";
import {
  buildGoogleAccount,
  buildGoogleFeeds,
  useCalendarSourcesStore,
} from "@/store/calendar/useCalendarSourcesStore";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleCalendarConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleCalendarConfig.iosClientId || undefined,
    androidClientId: googleCalendarConfig.androidClientId || undefined,
    webClientId: googleCalendarConfig.webClientId || undefined,
    scopes: GOOGLE_CALENDAR_SCOPES,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });

  const finalizeConnection = useCallback(
    async (accessToken: string, refreshToken?: string | null, expiresIn?: number | null) => {
      const profile = await fetchGoogleUserProfile(accessToken);
      const account = buildGoogleAccount(profile.email, profile.name);
      await storeGoogleAuthResult(account.id, {
        accessToken,
        refreshToken,
        expiresIn,
      });

      const calendarList = await fetchGoogleCalendarList(accessToken);
      const feeds = buildGoogleFeeds(account, calendarList);
      useCalendarSourcesStore.getState().addGoogleAccount(account, feeds);
      await syncGoogleCalendarsForAccount(account, feeds);
      return account;
    },
    []
  );

  useEffect(() => {
    if (response?.type !== "success") {
      if (response?.type === "error") {
        setError(response.error?.message ?? "Google sign-in failed.");
        setIsConnecting(false);
      }
      return;
    }

    const run = async () => {
      try {
        setError(null);
        const auth = response.authentication;
        if (!auth?.accessToken) {
          throw new Error("Google sign-in did not return an access token.");
        }
        await finalizeConnection(
          auth.accessToken,
          auth.refreshToken ?? null,
          auth.expiresIn ?? null
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
      } finally {
        setIsConnecting(false);
      }
    };

    void run();
  }, [response, finalizeConnection]);

  const connectGoogle = useCallback(async () => {
    setError(null);
    if (!isGoogleCalendarConfigured()) {
      setError(
        "Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and platform client IDs) to enable Google Calendar."
      );
      return;
    }
    if (!request) {
      setError("Google sign-in is not ready yet. Try again in a moment.");
      return;
    }
    setIsConnecting(true);
    const result = await promptAsync();
    if (result?.type !== "success") {
      setIsConnecting(false);
    }
  }, [promptAsync, request]);

  return {
    connectGoogle,
    isConnecting,
    error,
    isConfigured: isGoogleCalendarConfigured(),
    canPrompt: Boolean(request),
  };
}
