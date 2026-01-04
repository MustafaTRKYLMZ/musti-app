// apps/mobile/services/syncTransactions.ts

import { LocalTransaction } from "@musti/core";
import { apiConfig } from "../constants/apiConfig";
import { useTransactionsStore } from "../store/budget/transactions/useTransactionsStore";
// adjust import path if needed

const BASE_URL = apiConfig.baseUrl;

/**
 * Synchronizes local transactions with the backend.
 *
 * Steps:
 *  1) Push local "dirty" changes to the server (upsert or delete).
 *  2) Pull server changes since lastSyncAt.
 *  3) Merge server changes into local state based on updatedAt.
 *  4) Mark merged items as "synced" and update lastSyncAt.
 */
export async function syncTransactions(): Promise<void> {
  const state = useTransactionsStore.getState() as unknown as {
    transactions: LocalTransaction[];
    lastSyncAt: string | null;
  };

  const { transactions, lastSyncAt } = state;

  const dirty = transactions.filter(
    (t) => t.syncStatus === "dirty"
  );

  try {
    // 1) Push local dirty changes to server
    for (const tx of dirty) {
      const payload: any = { ...tx };
      delete payload.syncStatus; // remove local-only flag before sending

      if (tx.deleted) {
        // Locally deleted -> delete on server
        await safeDeleteOnServer(tx.id);
      } else {
        // Upsert: try PUT first, then fallback to POST
        await upsertOnServer(payload);
      }
    }

    // 2) Pull server changes since lastSyncAt
    const sinceParam = lastSyncAt
      ? `?since=${encodeURIComponent(lastSyncAt)}`
      : "";
    const res = await fetch(
      `${BASE_URL}/transactions/changes${sinceParam}`
    );

    if (!res.ok) {
      console.log(
        "[syncTransactions] Failed to fetch changes, status:",
        res.status
      );
      return;
    }

    const serverChanges = (await res.json()) as LocalTransaction[];

    // 3) Merge server changes with current local state
    const merged = mergeTransactions(
      useTransactionsStore.getState().transactions,
      serverChanges
    );

    const now = new Date().toISOString();

    const mergedWithSyncStatus: LocalTransaction[] = merged.map((tx) => ({
      ...tx,
      syncStatus: "synced",
    }));

    // 4) Update store
    useTransactionsStore.setState({
      transactions: mergedWithSyncStatus,
      lastSyncAt: now,
    });
  } catch (err) {
    console.log("[syncTransactions] error:", err);
    // On error we do not modify local state; dirty items remain dirty.
  }
}

/**
 * Try PUT /transactions/:id first; if server returns 404, fallback to POST /transactions.
 */
async function upsertOnServer(tx: LocalTransaction): Promise<void> {
  const id = tx.id;

  try {
    const putRes = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });

    if (putRes.status === 404) {
      const postRes = await fetch(`${BASE_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });

      if (!postRes.ok) {
        console.log(
          "[upsertOnServer] POST failed, status:",
          postRes.status
        );
      }
    } else if (!putRes.ok) {
      console.log(
        "[upsertOnServer] PUT failed, status:",
        putRes.status
      );
    }
  } catch (err) {
    console.log("[upsertOnServer] error:", err);
  }
}

/**
 * Best-effort DELETE /transactions/:id.
 * Ignores 404 (already deleted on server).
 */
async function safeDeleteOnServer(id: string | number): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      console.log(
        "[safeDeleteOnServer] Delete failed, status:",
        res.status
      );
    }
  } catch (err) {
    console.log("[safeDeleteOnServer] error:", err);
  }
}

/**
 * Merge local and server transactions based on id and updatedAt.
 * Latest updatedAt wins for each id.
 */
function mergeTransactions(
  local: LocalTransaction[],
  server: LocalTransaction[]
): LocalTransaction[] {
  const byId = new Map<string, LocalTransaction>();

  // Start with local
  for (const tx of local) {
    byId.set(String(tx.id), tx);
  }

  // Apply server changes
  for (const s of server) {
    const key = String(s.id);
    const existing = byId.get(key);

    if (!existing) {
      byId.set(key, s);
      continue;
    }

    // Compare updatedAt: latest wins
    const sUpdated = s.updatedAt || "";
    const eUpdated = existing.updatedAt || "";

    if (sUpdated > eUpdated) {
      byId.set(key, s);
    } else {
      byId.set(key, existing);
    }
  }

  return Array.from(byId.values());
}
