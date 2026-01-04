// apps/mobile/api.ts

import { Platform } from "react-native";
import {
  fetchTransactions as coreFetchTransactions,
  createTransaction as coreCreateTransaction,
  updateTransaction as coreUpdateTransaction,
  deleteTransactionApi as coreDeleteTransaction,
  type ApiConfig,
  type Transaction,
} from "/core";

/**
 * Resolve base API URL depending on platform and env vars.
 *
 * EXPO_PUBLIC_API_URL  (recommended):
 *   - Full URL including protocol and port, for example:
 *     "http://192.168.1.10:3001" or "https://my-backend.com"
 *
 * If EXPO_PUBLIC_API_URL is not set, we fall back to:
 *   - iOS / Web:  http://localhost:3001
 *   - Android emulators: http://10.0.2.2:3001
 */
function resolveBaseUrl(): string {
  // If you provided a full URL via env, use it directly.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl;
  }

  const port = envUrl && !Number.isNaN(Number(envUrl))
    ? envUrl
    : "3001";

  const host =
    Platform.OS === "android"
      ? "10.0.2.2" // Android emulator host for local machine
      : "localhost";

  return `http://${host}:${port}`;
}

const API_BASE_URL = resolveBaseUrl();

const config: ApiConfig = {
  baseUrl: API_BASE_URL,
};
export const apiConfig = config;

export async function fetchTransactions() {
  return coreFetchTransactions(config);
}

export async function createTransaction(tx: Transaction) {
  return coreCreateTransaction(config, tx);
}

export async function updateTransaction(tx: Transaction) {
  return coreUpdateTransaction(config, tx);
}

export async function deleteTransaction(id: Transaction["id"]) {
  return coreDeleteTransaction(config, id);
}
