import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import type {
  LocalTransaction,
  ParseReceiptResult,
  ProductSuggestion,
  ReceiptDraft,
  ReceiptLineDraft,
  ReceiptOcrQuality,
} from "@musti/core";
import {
  findDuplicateReceipt,
  GROCERY_DESCRIPTION_LINE_THRESHOLD,
  normalizeReceiptCategoryKey,
  sumReceiptLines,
  useTranslation,
} from "@musti/core";
import { LocalizedDatePicker } from "@/components/ui/LocalizedDatePicker";
import { StoreSelectField } from "@/components/budget/StoreSelectField";
import { useStoresStore } from "@/store/budget/stores/useStoresStore";
import { MText, colors, spacing, radii, IconButton, iconSizes } from "@musti/ui-native";
import type { Store } from "@musti/core";
import { findMatchingStore } from "@musti/core";

type Props = {
  imageUris: string[];
  parseResult: ParseReceiptResult;
  ocrWarning?: string | null;
  ocrQuality?: ReceiptOcrQuality | null;
  transactions?: LocalTransaction[];
  suggestions?: ProductSuggestion[];
  saving?: boolean;
  onRetake: () => void;
  onAddPhoto?: () => void;
  onConfirm: (
    draft: ReceiptDraft,
    category: string,
    selectedSuggestions: ProductSuggestion[],
    options: { saveTotalOnly: boolean }
  ) => void;
};

function formatMoneyInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  return value.toFixed(2);
}

function parseMoneyInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeMoneyInput(value: string): string {
  return value.replace(/[^\d.,]/g, "");
}

function sanitizeLines(lines: ReceiptLineDraft[]): ReceiptLineDraft[] {
  return lines
    .map((line) => {
      const quantity = Number(line.quantity ?? 1);
      const totalAmount = Number(
        String(line.totalAmount ?? "").replace(",", ".")
      );
      return {
        ...line,
        name: line.name.trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      };
    })
    .filter((line) => line.name.length > 0 && line.totalAmount > 0);
}

function ConfidenceBadge({
  level,
}: {
  level: "high" | "medium" | "low";
}) {
  const { t } = useTranslation();
  const label =
    level === "high"
      ? t("receipt.review.confidence.high")
      : level === "medium"
        ? t("receipt.review.confidence.medium")
        : t("receipt.review.confidence.low");

  const bg =
    level === "high"
      ? "rgba(34,197,94,0.15)"
      : level === "medium"
        ? "rgba(234,179,8,0.15)"
        : "rgba(239,68,68,0.15)";

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <MText variant="caption">{label}</MText>
    </View>
  );
}

export function ReceiptReviewForm({
  imageUris,
  parseResult,
  ocrWarning,
  ocrQuality,
  transactions = [],
  suggestions = [],
  saving,
  onRetake,
  onAddPhoto,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const stores = useStoresStore((s) => s.stores);
  const loadStores = useStoresStore((s) => s.loadFromStorage);
  const [showRaw, setShowRaw] = useState(false);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>(
    []
  );

  const [storeName, setStoreName] = useState(parseResult.draft.storeName);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
    const match = findMatchingStore(
      useStoresStore.getState().stores,
      parseResult.draft.storeName
    );
    return match?.id ?? parseResult.draft.storeId ?? null;
  });
  const [description, setDescription] = useState(
    parseResult.draft.description || parseResult.draft.storeName
  );
  const [date, setDate] = useState(parseResult.draft.date);
  const [amount, setAmount] = useState(() =>
    formatMoneyInput(parseResult.draft.total)
  );
  const [lineAmountEdits, setLineAmountEdits] = useState<Record<number, string>>(
    {}
  );
  const localizeCategoryKey = (raw: string) => {
    const key = normalizeReceiptCategoryKey(raw);
    const translated = t(key as Parameters<typeof t>[0]);
    return translated !== key ? translated : key;
  };

  const [category, setCategory] = useState(() =>
    localizeCategoryKey(parseResult.draft.suggestedCategory ?? "grocies")
  );
  const [lines, setLines] = useState<ReceiptLineDraft[]>(
    parseResult.draft.lines.map((line) => ({ ...line }))
  );
  const [saveTotalOnly, setSaveTotalOnly] = useState(() =>
    Boolean(ocrQuality?.suggestSaveTotalOnly)
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedLineIndexes, setSelectedLineIndexes] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    setStoreName(parseResult.draft.storeName);
    const match = findMatchingStore(stores, parseResult.draft.storeName);
    setSelectedStoreId(match?.id ?? parseResult.draft.storeId ?? null);
    setDescription(parseResult.draft.description || parseResult.draft.storeName);
    setDate(parseResult.draft.date);
    setAmount(formatMoneyInput(parseResult.draft.total));
    setLineAmountEdits({});
    setCategory(
      localizeCategoryKey(parseResult.draft.suggestedCategory ?? "grocies")
    );
    setLines(parseResult.draft.lines.map((line) => ({ ...line })));
    setSaveTotalOnly(Boolean(ocrQuality?.suggestSaveTotalOnly));
    setError(null);
    setSelectedLineIndexes([]);
    setSelectionMode(false);
  }, [parseResult, stores, ocrQuality]);

  const handleSelectStore = (store: Store | null) => {
    setSelectedStoreId(store?.id ?? null);
  };

  const previews = useMemo(() => imageUris.filter(Boolean), [imageUris]);

  const duplicate = useMemo(() => {
    const parsed = parseMoneyInput(amount);
    if (!storeName.trim() || parsed == null || parsed <= 0) return null;

    return findDuplicateReceipt(transactions, {
      date,
      storeName: storeName.trim(),
      total: parsed,
      storeId: parseResult.draft.storeId,
    });
  }, [
    transactions,
    date,
    storeName,
    amount,
    parseResult.draft.storeId,
  ]);

  const declaredMismatch =
    ocrQuality?.declaredItemCount != null &&
    ocrQuality.pricedLineCount <
      Math.floor(ocrQuality.declaredItemCount * 0.8);

  const toggleSuggestion = (productId: string) => {
    setSelectedSuggestionIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const updateLine = (
    index: number,
    patch: Partial<ReceiptLineDraft>
  ) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setLineAmountEdits({});
    setSelectedLineIndexes((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  const toggleLineSelection = (index: number) => {
    setSelectedLineIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const removeSelectedLines = () => {
    if (selectedLineIndexes.length === 0) return;
    const toRemove = new Set(selectedLineIndexes);
    setLines((prev) => prev.filter((_, index) => !toRemove.has(index)));
    setLineAmountEdits({});
    setSelectedLineIndexes([]);
    setSelectionMode(false);
  };

  const clearAllLines = () => {
    Alert.alert(
      t("receipt.review.clearAllTitle"),
      t("receipt.review.clearAllBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("receipt.review.clearAllConfirm"),
          style: "destructive",
          onPress: () => {
            setLines([]);
            setLineAmountEdits({});
            setSelectedLineIndexes([]);
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { name: "", quantity: 1, totalAmount: 0 },
    ]);
    setLineAmountEdits({});
  };

  const getLineAmountDisplay = (index: number, line: ReceiptLineDraft) => {
    if (lineAmountEdits[index] !== undefined) {
      return lineAmountEdits[index];
    }
    return formatMoneyInput(line.totalAmount);
  };

  const handleLineAmountChange = (index: number, rawValue: string) => {
    const cleaned = sanitizeMoneyInput(rawValue);
    setLineAmountEdits((prev) => ({ ...prev, [index]: cleaned }));
    const parsed = parseMoneyInput(cleaned);
    updateLine(index, { totalAmount: parsed ?? 0 });
  };

  const handleLineAmountBlur = (index: number) => {
    const raw = lineAmountEdits[index];
    if (raw === undefined) return;
    const parsed = parseMoneyInput(raw);
    if (parsed == null) {
      setLineAmountEdits((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      updateLine(index, { totalAmount: 0 });
      return;
    }
    setLineAmountEdits((prev) => ({ ...prev, [index]: parsed.toFixed(2) }));
    updateLine(index, { totalAmount: parsed });
  };

  const handleSaveTotalOnlyToggle = () => {
    setSaveTotalOnly((prev) => {
      const next = !prev;
      if (next && storeName.trim()) {
        setDescription(storeName.trim());
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const parsed = parseMoneyInput(amount);
    if (
      !storeName.trim() ||
      !description.trim() ||
      parsed == null ||
      parsed <= 0
    ) {
      setError(t("validation.requiredFields"));
      return;
    }

    setError(null);
    const selected = suggestions.filter((s) =>
      selectedSuggestionIds.includes(s.productId)
    );
    const cleanedLines = saveTotalOnly ? [] : sanitizeLines(lines);
    onConfirm(
      {
        ...parseResult.draft,
        storeName: storeName.trim(),
        storeId: selectedStoreId ?? undefined,
        description: description.trim(),
        date,
        total: parsed,
        lines: cleanedLines,
      },
      category.trim() || localizeCategoryKey("grocies"),
      selected,
      { saveTotalOnly }
    );
  };

  const parsedLineCount = lines.length;
  const linesSubtotal = useMemo(
    () => sumReceiptLines(sanitizeLines(lines)),
    [lines]
  );
  const parsedAmount = parseMoneyInput(amount) ?? 0;
  const hasReceiptDiscount = useMemo(() => {
    const raw = parseResult.draft.rawText ?? "";
    return (
      /jouw|voordeel|jou\s+voordeel|korting|besparing/i.test(raw) &&
      /-\s*\d+[.,]\d{2}/.test(raw)
    );
  }, [parseResult.draft.rawText]);
  const linesMatchReceipt =
    parsedLineCount > 0 &&
    parsedAmount > 0 &&
    Math.abs(linesSubtotal - parsedAmount) <= 0.05;
  const linesMismatch =
    !saveTotalOnly &&
    !hasReceiptDiscount &&
    parsedLineCount > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !linesMatchReceipt;

  const linesSection = !saveTotalOnly ? (
    <View style={styles.linesSection}>
      <View style={styles.linesSectionHeader}>
        <MText variant="bodyStrong">{t("receipt.review.lines")}</MText>
        <MText variant="caption" color="textSecondary">
          {parsedLineCount > 0
            ? t("receipt.review.linesCount", { count: parsedLineCount })
            : t("receipt.review.linesEmpty")}
        </MText>
      </View>

      {parsedLineCount > 0 ? (
        <View style={styles.linesBulkActions}>
          <Pressable
            onPress={() => {
              setSelectionMode((current) => !current);
              setSelectedLineIndexes([]);
            }}
          >
            <MText variant="caption" color="primary">
              {selectionMode
                ? t("receipt.review.cancelSelection")
                : t("receipt.review.selectLines")}
            </MText>
          </Pressable>
          {selectionMode && selectedLineIndexes.length > 0 ? (
            <Pressable onPress={removeSelectedLines}>
              <MText variant="caption" color="primary">
                {t("receipt.review.deleteSelected", {
                  count: selectedLineIndexes.length,
                })}
              </MText>
            </Pressable>
          ) : null}
          {!selectionMode && parsedLineCount > 1 ? (
            <Pressable onPress={clearAllLines}>
              <MText variant="caption" color="textSecondary">
                {t("receipt.review.clearAllLines")}
              </MText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {parsedLineCount >= GROCERY_DESCRIPTION_LINE_THRESHOLD ? (
        <MText variant="caption" color="textSecondary">
          {t("receipt.review.linesEditHint")}
        </MText>
      ) : null}

      {hasReceiptDiscount && parsedLineCount > 0 ? (
        <MText variant="caption" color="textSecondary">
          {t("receipt.review.linesDiscountHint", {
            receiptTotal: parsedAmount.toFixed(2),
          })}
        </MText>
      ) : null}

      {linesMismatch ? (
        <View style={styles.linesMismatchBanner}>
          <MText variant="caption" style={styles.linesMismatchText}>
            {t("receipt.review.linesSumMismatch", {
              linesTotal: linesSubtotal.toFixed(2),
              receiptTotal: parsedAmount.toFixed(2),
            })}
          </MText>
        </View>
      ) : null}

      {parsedLineCount > 0 ? (
        <View style={styles.linesScrollWrap}>
          <View style={styles.lineRowHeader}>
            <MText variant="caption" style={styles.lineColHeader}>
              {t("receipt.review.lineName")}
            </MText>
            <MText variant="caption" style={styles.lineColHeaderQty}>
              {t("receipt.review.lineQty")}
            </MText>
            <MText variant="caption" style={styles.lineColHeaderAmount}>
              {t("receipt.review.lineAmount")}
            </MText>
            <View style={styles.lineColHeaderAction} />
          </View>
          <ScrollView
            style={styles.linesScroll}
            contentContainerStyle={styles.linesScrollContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {lines.map((line, index) => (
              <View key={`line_${index}`} style={styles.editableLineRow}>
                {selectionMode ? (
                  <Pressable
                    style={[
                      styles.lineSelectBtn,
                      selectedLineIndexes.includes(index) &&
                        styles.lineSelectBtnActive,
                    ]}
                    onPress={() => toggleLineSelection(index)}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: selectedLineIndexes.includes(index),
                    }}
                  >
                    <MText variant="caption" style={styles.lineSelectMark}>
                      {selectedLineIndexes.includes(index) ? "✓" : ""}
                    </MText>
                  </Pressable>
                ) : null}
                <TextInput
                  style={[styles.input, styles.lineNameInput]}
                  value={line.name}
                  onChangeText={(value) => updateLine(index, { name: value })}
                  placeholder={t("receipt.review.lineName")}
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, styles.lineQtyInput]}
                  value={line.quantity != null ? String(line.quantity) : "1"}
                  onChangeText={(value) => {
                    const parsedQty = Number(value.replace(",", "."));
                    updateLine(index, {
                      quantity:
                        value.trim() === ""
                          ? 1
                          : Number.isFinite(parsedQty) && parsedQty > 0
                            ? parsedQty
                            : line.quantity ?? 1,
                    });
                  }}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.input, styles.lineAmountInput]}
                  value={getLineAmountDisplay(index, line)}
                  onChangeText={(value) => handleLineAmountChange(index, value)}
                  onBlur={() => handleLineAmountBlur(index)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
                <IconButton
                  name="trash-outline"
                  size={iconSizes.md}
                  onPress={() => removeLine(index)}
                  accessibilityLabel={t("delete")}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.linesSumRow}>
            <MText variant="bodyStrong">{t("receipt.review.linesSumLabel")}</MText>
            <MText
              variant="bodyStrong"
              style={linesMatchReceipt ? styles.linesSumMatch : undefined}
            >
              {linesSubtotal.toFixed(2)} {parseResult.draft.currency}
            </MText>
          </View>
          {parsedAmount > 0 ? (
            <MText
              variant="caption"
              style={
                linesMatchReceipt ? styles.linesSumMatchCaption : styles.linesSumHint
              }
            >
              {linesMatchReceipt
                ? t("receipt.review.linesSumMatches", {
                    receiptTotal: parsedAmount.toFixed(2),
                  })
                : t("receipt.review.linesSumCompare", {
                    receiptTotal: parsedAmount.toFixed(2),
                  })}
            </MText>
          ) : null}
        </View>
      ) : (
        <View style={styles.linesEmptyBox}>
          <MText variant="caption" color="textSecondary" style={styles.linesEmptyText}>
            {t("receipt.review.linesEmptyHint")}
          </MText>
        </View>
      )}

      <Pressable style={styles.linkBtn} onPress={addLine}>
        <MText variant="bodyStrong" style={styles.linkBtnText}>
          + {t("receipt.review.addLine")}
        </MText>
      </Pressable>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <MText variant="caption" color="textSecondary" style={styles.intro}>
        {t("receipt.review.subtitle")}
      </MText>

      {ocrWarning ? (
        <View style={styles.ocrWarningBanner}>
          <MText variant="caption" style={styles.ocrWarningText}>
            {ocrWarning}
          </MText>
        </View>
      ) : null}

      {declaredMismatch ? (
        <View style={styles.declaredBanner}>
          <MText variant="caption" style={styles.declaredBannerText}>
            {t("receipt.review.declaredCountMismatch", {
              declared: ocrQuality?.declaredItemCount ?? 0,
              parsed: ocrQuality?.pricedLineCount ?? 0,
            })}
          </MText>
        </View>
      ) : null}

      {previews.length > 1 ? (
        <View style={styles.multiPreviewWrap}>
          <MText variant="caption" color="textSecondary">
            {t("receipt.multi.reviewParts", { count: previews.length })}
          </MText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.multiPreviewRow}
          >
            {previews.map((uri, index) => (
              <View key={`${uri}_${index}`} style={styles.multiPreviewItem}>
                <Image
                  source={{ uri }}
                  style={styles.multiPreviewImage}
                  resizeMode="cover"
                />
                <MText variant="caption" style={styles.multiPreviewLabel}>
                  {index + 1}/{previews.length}
                </MText>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : previews[0] ? (
        <Image
          source={{ uri: previews[0] }}
          style={styles.preview}
          resizeMode="cover"
        />
      ) : null}

      {duplicate ? (
        <View style={styles.duplicateBanner}>
          <MText variant="caption" style={styles.duplicateText}>
            {t("receipt.duplicate.warning")}
          </MText>
          <MText variant="caption" style={styles.duplicateMeta}>
            {duplicate.storeName ?? duplicate.item} · {duplicate.amount.toFixed(2)}
          </MText>
        </View>
      ) : null}

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <MText variant="caption" color="textSecondary">
            {t("receipt.review.store")}
          </MText>
          <ConfidenceBadge level={parseResult.hints.store.confidence} />
        </View>
        <StoreSelectField
          value={storeName}
          selectedStoreId={selectedStoreId}
          stores={stores}
          onChangeName={setStoreName}
          onSelectStore={handleSelectStore}
          placeholder={t("receipt.review.store")}
        />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <MText variant="caption" color="textSecondary">
            {t("date")}
          </MText>
          <ConfidenceBadge level={parseResult.hints.date.confidence} />
        </View>
        <LocalizedDatePicker value={date} onChange={setDate} />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <MText variant="caption" color="textSecondary">
            {t("amount")}
          </MText>
          <ConfidenceBadge level={parseResult.hints.total.confidence} />
        </View>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={(value) => setAmount(sanitizeMoneyInput(value))}
          onBlur={() => {
            const parsed = parseMoneyInput(amount);
            if (parsed != null) setAmount(parsed.toFixed(2));
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <MText variant="caption" color="textSecondary" style={styles.currencyHint}>
          {t("receipt.review.amountHint")} · {parseResult.draft.currency}
        </MText>
      </View>

      {linesSection}

      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("receipt.review.description")}
        </MText>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder={t("receipt.review.descriptionPlaceholder")}
        />
      </View>

      <View style={styles.field}>
          <Pressable
            style={styles.saveTotalOnlyRow}
            onPress={handleSaveTotalOnlyToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: saveTotalOnly }}
          >
            <View style={styles.saveTotalOnlyCopy}>
              <MText variant="bodyStrong">{t("receipt.review.saveTotalOnly")}</MText>
              <MText variant="caption" color="textSecondary">
                {t("receipt.review.saveTotalOnlyHint")}
              </MText>
            </View>
            <View
              style={[
                styles.saveTotalOnlyToggle,
                saveTotalOnly && styles.saveTotalOnlyToggleActive,
              ]}
            >
              <View
                style={[
                  styles.saveTotalOnlyKnob,
                  saveTotalOnly && styles.saveTotalOnlyKnobActive,
                ]}
              />
            </View>
          </Pressable>
        </View>

      {suggestions.length > 0 ? (
        <View style={styles.field}>
          <MText variant="caption" color="textSecondary" style={styles.label}>
            {t("receipt.suggestions.title")}
          </MText>
          <MText variant="caption" color="textSecondary">
            {t("receipt.suggestions.subtitle")}
          </MText>
          <View style={styles.suggestionRow}>
            {suggestions.map((item) => {
              const selected = selectedSuggestionIds.includes(item.productId);
              return (
                <Pressable
                  key={item.productId}
                  style={[
                    styles.suggestionChip,
                    selected && styles.suggestionChipActive,
                  ]}
                  onPress={() => toggleSuggestion(item.productId)}
                >
                  <MText variant="caption">
                    {item.name}
                    {item.purchaseCount > 1 ? ` (${item.purchaseCount}×)` : ""}
                  </MText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("category")}
        </MText>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder={t("category")}
        />
      </View>

      <Pressable
        onPress={() => setShowRaw((v) => !v)}
        style={[styles.linkBtn, showRaw && styles.linkBtnActive]}
      >
        <MText variant="bodyStrong" style={styles.linkBtnText}>
          {showRaw ? t("receipt.review.hideRaw") : t("receipt.review.showRaw")}
        </MText>
      </Pressable>

      {showRaw ? (
        <View style={styles.rawBox}>
          <MText variant="caption" color="textSecondary">
            {parseResult.draft.rawText || t("receipt.review.noText")}
          </MText>
        </View>
      ) : null}

      {error ? (
        <MText variant="caption" style={styles.error}>
          {error}
        </MText>
      ) : null}

      {onAddPhoto ? (
        <Pressable
          style={styles.addPhotoBtn}
          onPress={onAddPhoto}
          disabled={saving}
        >
          <MText variant="bodyStrong" style={styles.addPhotoBtnText}>
            {t("receipt.review.addPhoto")}
          </MText>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={onRetake} disabled={saving}>
          <MText variant="bodyStrong">{t("receipt.review.retake")}</MText>
        </Pressable>
        <Pressable
          style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
          onPress={handleConfirm}
          disabled={saving}
        >
          <MText variant="bodyStrong" style={styles.primaryBtnText}>
            {t("receipt.review.confirm")}
          </MText>
        </Pressable>
      </View>
    </View>
  );
}

const LINK_TEXT = "#93C5FD";
const LINK_BG = "rgba(147, 197, 253, 0.14)";
const LINK_BORDER = "rgba(147, 197, 253, 0.45)";

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  intro: {
    marginBottom: spacing.xs,
  },
  ocrWarningBanner: {
    backgroundColor: "rgba(234,179,8,0.15)",
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,179,8,0.45)",
  },
  ocrWarningText: {
    color: colors.textPrimary,
    textAlign: "center",
  },
  declaredBanner: {
    backgroundColor: "rgba(234,179,8,0.12)",
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,179,8,0.35)",
  },
  declaredBannerText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 140,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  multiPreviewWrap: {
    gap: spacing.xs,
  },
  multiPreviewRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  multiPreviewItem: {
    width: 120,
    gap: spacing.xs,
  },
  multiPreviewImage: {
    width: 120,
    height: 140,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  multiPreviewLabel: {
    textAlign: "center",
    color: colors.textSecondary,
  },
  duplicateBanner: {
    backgroundColor: "rgba(234,179,8,0.15)",
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,179,8,0.45)",
  },
  duplicateText: {
    fontWeight: "700",
  },
  duplicateMeta: {
    color: colors.textSecondary,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  suggestionChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(47,111,237,0.08)",
  },
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    color: colors.textPrimary,
  },
  currencyHint: {
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  linkBtn: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: LINK_BORDER,
    backgroundColor: LINK_BG,
  },
  linkBtnActive: {
    backgroundColor: "rgba(147, 197, 253, 0.24)",
  },
  linkBtnText: {
    color: LINK_TEXT,
  },
  rawBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINK_BORDER,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    maxHeight: 160,
  },
  saveTotalOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  saveTotalOnlyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  saveTotalOnlyToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderSubtle,
    padding: 2,
    justifyContent: "center",
  },
  saveTotalOnlyToggleActive: {
    backgroundColor: colors.primary,
  },
  saveTotalOnlyKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  saveTotalOnlyKnobActive: {
    alignSelf: "flex-end",
  },
  linesSection: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  linesSectionHeader: {
    gap: spacing.xs,
  },
  linesBulkActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    alignItems: "center",
  },
  lineSelectBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },
  lineSelectBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  lineSelectMark: {
    color: "#FFF",
    fontWeight: "700",
  },
  linesMismatchBanner: {
    backgroundColor: "rgba(234,179,8,0.15)",
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,179,8,0.45)",
  },
  linesMismatchText: {
    color: colors.textPrimary,
  },
  linesEmptyBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  linesEmptyText: {
    textAlign: "center",
    color: colors.textPrimary,
  },
  linesScrollWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  linesScroll: {
    maxHeight: 280,
  },
  linesScrollContent: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  lineRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  lineColHeader: {
    flex: 1,
    color: colors.textSecondary,
  },
  lineColHeaderQty: {
    width: 52,
    textAlign: "center",
    color: colors.textSecondary,
  },
  lineColHeaderAmount: {
    width: 72,
    textAlign: "right",
    color: colors.textSecondary,
  },
  lineColHeaderAction: {
    width: iconSizes.md + spacing.xs,
  },
  linesSumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  linesSumMatch: {
    color: "#4ADE80",
  },
  linesSumMatchCaption: {
    color: "#4ADE80",
    textAlign: "right",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  linesSumHint: {
    color: colors.textSecondary,
    textAlign: "right",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  editableLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  lineNameInput: {
    flex: 1,
    minWidth: 0,
  },
  lineQtyInput: {
    width: 52,
    textAlign: "center",
    paddingHorizontal: spacing.xs,
  },
  lineAmountInput: {
    width: 72,
    textAlign: "right",
    paddingHorizontal: spacing.xs,
  },
  error: {
    color: colors.danger,
  },
  addPhotoBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  addPhotoBtnText: {
    color: colors.primary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  primaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: "#FFF",
  },
});
