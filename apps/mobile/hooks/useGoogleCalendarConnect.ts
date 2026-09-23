import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GOOGLE_CALENDAR_SCOPES,
  getGoogleAuthRequestParams,
  isGoogleCalendarConfigured,
} from "@/constants/googleCalendarConfig";
import {
  fetchGoogleCalendarList,
  fetchGoogleUserProfile,
} from "@/services/googleCalendar/googleCalendarApi";
import { storeGoogleAuthResult } from "@/services/googleCalendar/accessToken";
import { assertGoogleCalendarWriteScope } from "@/services/googleCalendar/googleCalendarDebug";
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
  const handledResponseRef = useRef<string | null>(null);

  const authParams = getGoogleAuthRequestParams();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: authParams.webClientId,
    androidClientId: authParams.androidClientId,
    iosClientId: authParams.iosClientId,
    redirectUri: authParams.redirectUri,
    scopes: GOOGLE_CALENDAR_SCOPES,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });

  useEffect(() => {
    if (__DEV__ && request?.redirectUri) {
      console.log("[Google OAuth] redirectUri:", request.redirectUri);
      console.log("[Google OAuth] clientId:", request.clientId);
    }
  }, [request?.redirectUri, request?.clientId]);

  const finalizeConnection = useCallback(
    async (
      accessToken: string,
      refreshToken?: string | null,
      expiresIn?: number | null,
      tokenClientId?: string | null
    ) => {
      await assertGoogleCalendarWriteScope(accessToken, "after connect");
      const profile = await fetchGoogleUserProfile(accessToken);
      const account = buildGoogleAccount(profile.email, profile.name);
      await storeGoogleAuthResult(account.id, {
        accessToken,
        refreshToken,
        expiresIn,
        tokenClientId,
      });

      const calendarList = await fetchGoogleCalendarList(accessToken);
      const feeds = buildGoogleFeeds(account, calendarList);
      useCalendarSourcesStore.getState().addGoogleAccount(account, feeds);
      const syncResult = await syncGoogleCalendarsForAccount(account, feeds);
      if (__DEV__) {
        console.log("[Google Calendar] sync after connect:", syncResult);
      }
      return { account, syncResult };
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

    const auth = response.authentication;
    if (!auth?.accessToken) {
      // Google provider may still be exchanging the auth code (PKCE).
      return;
    }

    const dedupeKey = `${auth.accessToken}:${response.params?.state ?? ""}`;
    if (handledResponseRef.current === dedupeKey) {
      return;
    }
    handledResponseRef.current = dedupeKey;

    const run = async () => {
      try {
        setError(null);
        const { account, syncResult } = await finalizeConnection(
          auth.accessToken,
          auth.refreshToken ?? null,
          auth.expiresIn ?? null,
          request?.clientId ?? null
        );
        const syncLine =
          syncResult.importedEvents > 0
            ? `${syncResult.importedEvents} events imported.`
            : "No events in the selected window yet.";
        const errorLine =
          syncResult.errors.length > 0
            ? `\n\n${syncResult.errors.join("\n")}`
            : "";
        Alert.alert(
          "Google connected",
          `${account.email} is linked. ${syncLine}${errorLine}`
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
    if (__DEV__) {
      console.log("[Google OAuth] connect pressed");
      console.log("[Google OAuth] requested scopes:", GOOGLE_CALENDAR_SCOPES);
      console.log("[Google OAuth] redirectUri:", request.redirectUri);
      console.log("[Google OAuth] clientId:", request.clientId);
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
