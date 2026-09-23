// src/index.ts
import express from "express";
import cors from "cors";
import type { Transaction } from "./types";
import {
  readTransactions,
  writeTransactions,
  getTransactionById,
} from "./storage";
import XLSX from "xlsx";
import multer from "multer";
import path from "path";
import settingsRoutes from "./routes/settingsRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS (allow all origins for now)
app.use(cors());

app.use(express.json());
app.use("/settings", settingsRoutes);

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
});

// -------------------- IMPORT / EXPORT --------------------

app.post("/import/excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const mode = (req.query.mode as string) || "replace";

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

    const nowIso = new Date().toISOString();

    const imported = rows.map((raw) => {
      const dateStr = String(raw.date ?? "").slice(0, 10);
      const monthStr =
        String(raw.month ?? "").slice(0, 7) ||
        (dateStr ? dateStr.slice(0, 7) : "");

      return {
        id: raw.id ?? Date.now(),
        date: dateStr,
        month: monthStr,
        type: raw.type === "Income" ? "Income" : "Expense",
        item: String(raw.item ?? ""),
        category:
          raw.category === null ||
          raw.category === undefined ||
          raw.category === ""
            ? undefined
            : String(raw.category),
        isFixed: Boolean(raw.isFixed),
        amount: Number(raw.amount ?? 0),
        planId: raw.planId,
        updatedAt: raw.updatedAt ?? nowIso,
        deleted: Boolean(raw.deleted) ?? false,
      } as Transaction;
    });

    if (mode === "replace") {
      await writeTransactions(imported);
    } else {
      const existing = await readTransactions();
      const byId = new Map<string, any>();
      for (const t of existing) {
        byId.set(String(t.id), t);
      }
      for (const t of imported) {
        byId.set(String(t.id), t);
      }
      await writeTransactions(Array.from(byId.values()));
    }

    res.json({ ok: true, count: imported.length, mode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import Excel" });
  }
});

app.get("/export/excel", async (_req, res) => {
  try {
    const transactions = await readTransactions();

    const worksheet = XLSX.utils.json_to_sheet(transactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transactions.xlsx"'
    );

    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export Excel" });
  }
});

// -------------------- HEALTH --------------------

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// -------------------- TRANSACTIONS READ --------------------

// GET /transactions
app.get("/transactions", async (_req, res) => {
  try {
    const all = await readTransactions();
    const transactions = all.filter((t) => !t.deleted);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read transactions" });
  }
});

// GET /transactions/changes?since=ISO_STRING
app.get("/transactions/changes", async (req, res) => {
  try {
    const since = req.query.since as string | undefined;
    const all = await readTransactions();

    if (!since) {
      // First sync: return everything
      return res.json(all);
    }

    const changes = all.filter((t) => t.updatedAt > since);
    res.json(changes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get transaction changes" });
  }
});

// GET /transactions/:id
app.get("/transactions/:id", async (req, res) => {
  try {
    const tx = await getTransactionById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read transaction" });
  }
});

// -------------------- TRANSACTIONS WRITE --------------------

// POST /transactions
app.post("/transactions", async (req, res) => {
  try {
    const body = req.body as Partial<Transaction>;

    if (!body.item || typeof body.amount !== "number") {
      return res.status(400).json({ error: "item and amount are required" });
    }

    const all = await readTransactions();

    const isFixed = body.isFixed ?? false;
    const planId =
      isFixed && body.planId == null
        ? Date.now() + Math.random()
        : body.planId;

    const nowIso = new Date().toISOString();

    const newTx: Transaction = {
      id: (body.id as any) ?? Date.now(),
      date: body.date ?? new Date().toISOString().slice(0, 10),
      month:
        body.month ??
        (body.date
          ? body.date.slice(0, 7)
          : new Date().toISOString().slice(0, 7)),
      type: body.type ?? "Expense",
      item: body.item!,
      category: body.category,
      amount: body.amount!,
      isFixed,
      planId,
      updatedAt: nowIso,
      deleted: false,
    };

  
    const next: Transaction[] = [...all, newTx];

    await writeTransactions(next);
    res.status(201).json(newTx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

type UpdateScope = "this" | "thisAndFuture" | "all";

app.put("/transactions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const scopeRaw = (req.query.scope as string) || "this";
    const scope: UpdateScope =
      scopeRaw === "thisAndFuture" || scopeRaw === "all"
        ? (scopeRaw as UpdateScope)
        : "this";

    const body = req.body as Partial<Transaction>;
    const all = await readTransactions();
    const index = all.findIndex((t) => String(t.id) === id);

    if (index === -1) {
      return res.status(404).json({ error: "Not found" });
    }

    const target = all[index];

    const applyCoreFields = (original: Transaction): Transaction => {
      const nowIso = new Date().toISOString();

      const base: Transaction = {
        ...original,
        ...body,
      };

      base.id = original.id;
      base.month =
        body.month ??
        (body.date ? body.date.slice(0, 7) : original.month);

      base.updatedAt = nowIso;

      return base;
    };

    // Non-fixed or no planId → always behave as "this"
    if (!target.isFixed || target.planId == null || scope === "this") {
      const updated = applyCoreFields(target);
      all[index] = updated;
      await writeTransactions(all);
      return res.json(updated);
    }

    const planId = target.planId;
    const targetMonth = target.month;

    // thisAndFuture
    if (scope === "thisAndFuture") {
      const updatedRows: Transaction[] = [];

      for (const tx of all) {
        if (tx.id === target.id) {
          updatedRows.push(applyCoreFields(tx));
          continue;
        }
        const nowIso = new Date().toISOString();
        if (tx.planId === planId && tx.month > targetMonth) {
          const merged: Transaction = {
            ...tx,
            type: body.type ?? tx.type,
            item: body.item ?? tx.item,
            category: body.category ?? tx.category,
            amount:
              typeof body.amount === "number" ? body.amount : tx.amount,
            isFixed:
              typeof body.isFixed === "boolean" ? body.isFixed : tx.isFixed,
            planId,
            updatedAt: nowIso,
          };
          updatedRows.push(merged);
        } else {
          updatedRows.push(tx);
        }
      }

      await writeTransactions(updatedRows);
      const updatedTarget = updatedRows.find((t) => t.id === target.id)!;
      return res.json(updatedTarget);
    }

    // all
    if (scope === "all") {
      const updatedRows: Transaction[] = [];
      const nowIso = new Date().toISOString();
      for (const tx of all) {
        if (tx.planId === planId) {
          const merged: Transaction = {
            ...tx,
            type: body.type ?? tx.type,
            item: body.item ?? tx.item,
            category: body.category ?? tx.category,
            amount:
              typeof body.amount === "number" ? body.amount : tx.amount,
            isFixed:
              typeof body.isFixed === "boolean" ? body.isFixed : tx.isFixed,
            planId,
            updatedAt: nowIso,
          };
          updatedRows.push(merged);
        } else {
          updatedRows.push(tx);
        }
      }

      await writeTransactions(updatedRows);
      const updatedTarget = updatedRows.find((t) => t.id === target.id)!;
      return res.json(updatedTarget);
    }

    // Fallback
    const updated = applyCoreFields(target);
    all[index] = updated;
    await writeTransactions(all);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

type DeleteScope = "this" | "thisAndFuture" | "all";

app.delete("/transactions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const scopeRaw = (req.query.scope as string) || "this";
    const scope: DeleteScope =
      scopeRaw === "thisAndFuture" || scopeRaw === "all"
        ? (scopeRaw as DeleteScope)
        : "this";

    const all = await readTransactions();
    const target = all.find((t) => String(t.id) === id);

    if (!target) {
      return res.status(404).json({ error: "Not found" });
    }

    const nowIso = new Date().toISOString();

    // For non-fixed or scope "this", mark only this row as deleted
    if (!target.isFixed || target.planId == null || scope === "this") {
      const next = all.map((t) =>
        String(t.id) === id
          ? { ...t, deleted: true, updatedAt: nowIso }
          : t
      );
      await writeTransactions(next);
      return res.status(204).send();
    }

    const planId = target.planId;
    const targetMonth = target.month;

    let next: Transaction[];

    if (scope === "thisAndFuture") {
      // Mark this transaction and all future ones in the same plan as deleted
      next = all.map((t) =>
        t.planId === planId && t.month >= targetMonth
          ? { ...t, deleted: true, updatedAt: nowIso }
          : t
      );
    } else {
      // scope === "all": mark all rows of this plan as deleted
      next = all.map((t) =>
        t.planId === planId
          ? { ...t, deleted: true, updatedAt: nowIso }
          : t
      );
    }

    await writeTransactions(next);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// -------------------- BOOTSTRAP (legacy patch) --------------------

async function bootstrapFixedTransactions() {
  try {
    const all = await readTransactions();
    let updated = false;

    // Patch missing updatedAt / deleted on older data
    const patched = all.map((tx) => {
      let changed = false;
      const copy = { ...tx };

      if (!copy.updatedAt) {
        copy.updatedAt = new Date().toISOString();
        changed = true;
      }
      if (copy.deleted === undefined) {
        copy.deleted = false;
        changed = true;
      }

      if (changed) updated = true;
      return copy;
    });

  
    const byPlan: Record<string, Transaction[]> = {};

    for (const tx of patched) {
      if (!tx.isFixed) continue;

      let planKey: string;
      if (tx.planId != null) {
        planKey = String(tx.planId);
      } else {
        planKey = [tx.type, tx.item, tx.category ?? "", tx.amount].join("|");
      }

      if (!byPlan[planKey]) {
        byPlan[planKey] = [];
      }
      byPlan[planKey].push(tx);
    }

    for (const list of Object.values(byPlan)) {
      const base = list[0];
      if (base.planId == null) {
        const newPlanId = Date.now() + Math.random();
        for (const tx of list) {
          tx.planId = newPlanId;
        }
        updated = true;
      }
    }

    if (updated) {
      await writeTransactions(patched);
      console.log("[bootstrapFixedTransactions] patched fixed transactions");
    }
  } catch (err) {
    console.error("[bootstrapFixedTransactions] failed:", err);
  }
}
bootstrapFixedTransactions();

// -------------------- START --------------------

app.listen(PORT, () => {
  console.log(`Budget API running on http://localhost:${PORT}`);
});
