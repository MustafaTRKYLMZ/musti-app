import { Platform } from "react-native";
import Constants from "expo-constants";
import type { LocalTransaction } from "@musti/core";

/**
 * Resolve base API URL depending on platform and env vars.
 *
 * EXPO_PUBLIC_API_URL (recommended on a physical phone):
 *   e.g. "http://192.168.1.10:3001"
 */
function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/$/, "");
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri?.split(":")[0];

  if (debuggerHost && Platform.OS !== "web") {
    const port =
      envUrl && !Number.isNaN(Number(envUrl)) ? envUrl : "3001";
    return `http://${debuggerHost.split(":")[0]}:${port}`;
  }

  const port = envUrl && !Number.isNaN(Number(envUrl)) ? envUrl : "3001";
  const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${host}:${port}`;
}

export const apiConfig = {
  baseUrl: resolveBaseUrl(),
};

export async function fetchTransactions(): Promise<LocalTransaction[]> {
  const res = await fetch(`${apiConfig.baseUrl}/transactions`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions (${res.status})`);
  }
  return res.json() as Promise<LocalTransaction[]>;
}
