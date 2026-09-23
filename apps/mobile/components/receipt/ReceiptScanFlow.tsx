import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import {
  assessReceiptOcrQuality,
  extractDeclaredItemCount,
  MAX_RECEIPT_PHOTOS,
  mergeManyReceiptTexts,
  normalizeProductName,
  parseReceiptText,
  receiptToTransactionDraft,
  suggestFrequentProducts,
  useTranslation,
  type ParseReceiptResult,
  type ProductSuggestion,
  type ReceiptDraft,
  type ReceiptOcrQuality,
  type ReceiptScanType,
} from "@musti/core";
import { MText, colors, spacing, radii } from "@musti/ui-native";
import { ReceiptCameraView } from "@/components/receipt/ReceiptCameraView";
import { ReceiptReviewForm } from "@/components/receipt/ReceiptReviewForm";
import { ReceiptTypeSelector } from "@/components/receipt/ReceiptTypeSelector";
import {
  recognizeReceiptImage,
  ReceiptOcrUnavailableError,
} from "@/services/receipt/recognizeReceiptImage";
import type { ReceiptCapture } from "@/services/receipt/receiptCapture";
import { pickReceiptFromGallery, isGalleryImportAvailable } from "@/services/receipt/pickReceiptFromGallery";
import {
  collectLineCorrections,
  loadUserOcrCorrections,
  recordUserOcrCorrections,
} from "@/services/receipt/userOcrCorrectionStore";
import { appendReceiptArchiveEntry } from "@/services/receipt/receiptArchiveStore";
import { useStoresStore } from "@/store/budget/stores/useStoresStore";
import { useProductsStore } from "@/store/budget/products/useProductsStore";
import { useTransactionsStore } from "@/store/budget/transactions/useTransactionsStore";
import { useShoppingListStore } from "@/store/budget/shopping-list/useShoppingListStore";
import { useBudgetNotificationSettingsStore } from "@/store/budget/notification/useNotificationSettingsStore";
import { notifyPriceChanges } from "@/services/receipt/notifyPriceChanges";

type Step = "type_select" | "camera" | "append_prompt" | "processing" | "review";

type Props = {
  embedded?: boolean;
  onDone: () => void;
  onSwitchToManual?: () => void;
  onStepChange?: (step: "camera" | "processing" | "review") => void;
};

const CAMERA_STEPS: Step[] = ["camera", "append_prompt"];

function countPricedLines(result: ParseReceiptResult): number {
  return result.draft.lines.filter((line) => (line.totalAmount ?? 0) > 0)
    .length;
}

function getPartHintKey(photoIndex: number, totalPhotos: number): string {
  if (photoIndex === 0) return "receipt.multi.hintFirst";
  if (photoIndex >= totalPhotos - 1) return "receipt.multi.hintLast";
  return "receipt.multi.hintMiddle";
}

function buildOcrWarning(
  t: ReturnType<typeof useTranslation>["t"],
  text: string,
  quality: ReceiptOcrQuality,
  photoCount: number
): string | null {
  if (!text.trim()) {
    return t("receipt.error.noText");
  }

  if (quality.suggestRetake) {
    return t("receipt.error.poorQuality");
  }

  if (quality.suggestMorePhotos && photoCount >= 2) {
    return t("receipt.error.suggestMorePhotos");
  }

  if (quality.suggestSecondPhoto && photoCount === 1) {
    return t("receipt.error.suggestSecondPhoto");
  }

  if (
    quality.declaredItemCount != null &&
    quality.pricedLineCount < Math.floor(quality.declaredItemCount * 0.8)
  ) {
    return t("receipt.review.declaredCountMismatch", {
      declared: quality.declaredItemCount,
      parsed: quality.pricedLineCount,
    });
  }

  if (quality.level === "fair") {
    return t("receipt.error.fairQuality");
  }

  return null;
}

function shouldSteerToMorePhotos(quality: ReceiptOcrQuality | null): boolean {
  if (!quality) return false;
  return (
    quality.suggestRetake ||
    quality.suggestMorePhotos ||
    quality.suggestSecondPhoto ||
    quality.suggestThirdPhoto ||
    (quality.declaredItemCount != null &&
      quality.pricedLineCount < Math.floor(quality.declaredItemCount * 0.65))
  );
}

export function ReceiptScanFlow({
  embedded = false,
  onDone,
  onSwitchToManual,
  onStepChange,
}: Props) {
  const { t, language } = useTranslation();

  const resolveOrCreate = useStoresStore((s) => s.resolveOrCreate);
  const transactions = useTransactionsStore((s) => s.transactions);
  const createTransaction = useTransactionsStore((s) => s.createTransaction);
  const products = useProductsStore((s) => s.products);
  const priceSamples = useProductsStore((s) => s.priceSamples);
  const recordPurchase = useProductsStore((s) => s.recordPurchase);
  const shoppingItems = useShoppingListStore((s) => s.items);
  const addItemIfMissing = useShoppingListStore((s) => s.addItemIfMissing);
  const priceAlertsEnabled = useBudgetNotificationSettingsStore(
    (s) => s.priceAlertsEnabled
  );
  const priceAlertThresholdPct = useBudgetNotificationSettingsStore(
    (s) => s.priceAlertThresholdPct
  );

  const [step, setStepState] = useState<Step>("type_select");
  const [receiptType, setReceiptType] = useState<ReceiptScanType>("market");
  const [userOcrCorrections, setUserOcrCorrections] = useState<
    Array<{ from: string; to: string }>
  >([]);

  const setStep = (next: Step) => {
    setStepState(next);
    if (next === "review") {
      onStepChange?.("review");
    } else if (CAMERA_STEPS.includes(next) || next === "type_select") {
      onStepChange?.("camera");
    } else if (next === "processing") {
      onStepChange?.("processing");
    }
  };

  const [captures, setCaptures] = useState<ReceiptCapture[]>([]);
  const [parseResult, setParseResult] = useState<ParseReceiptResult | null>(
    null
  );
  const [ocrQuality, setOcrQuality] = useState<ReceiptOcrQuality | null>(null);
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingPart, setProcessingPart] = useState(0);
  const [previewQuality, setPreviewQuality] = useState<ReceiptOcrQuality | null>(
    null
  );
  const [previewParsedCount, setPreviewParsedCount] = useState(0);
  const [previewDeclaredCount, setPreviewDeclaredCount] = useState<number | null>(
    null
  );
  const [previewQualityLoading, setPreviewQualityLoading] = useState(false);

  useEffect(() => {
    void loadUserOcrCorrections().then(setUserOcrCorrections);
  }, []);

  const runPreviewQuality = async (
    items: ReceiptCapture[],
    cancelled: () => boolean
  ) => {
    setPreviewQualityLoading(true);
    setPreviewQuality(null);
    try {
      let text = "";
      if (items.length === 1) {
        text = await recognizeReceiptImage(items[0].uri, items[0].meta);
      } else {
        const texts: string[] = [];
        for (const item of items) {
          texts.push(await recognizeReceiptImage(item.uri, item.meta));
        }
        text = mergeManyReceiptTexts(texts);
      }
      if (cancelled()) return;
      const parsed = parseReceiptText(text, {
        receiptType,
        userOcrCorrections,
      });
      setPreviewParsedCount(countPricedLines(parsed));
      setPreviewDeclaredCount(extractDeclaredItemCount(text));
      setPreviewQuality(
        assessReceiptOcrQuality(text, parsed, { photoCount: items.length })
      );
    } catch {
      if (!cancelled()) {
        setPreviewQuality(null);
        setPreviewParsedCount(0);
        setPreviewDeclaredCount(null);
      }
    } finally {
      if (!cancelled()) setPreviewQualityLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "append_prompt") {
      setPreviewQuality(null);
      setPreviewQualityLoading(false);
      return;
    }

    if (captures.length === 0) return;

    let cancelled = false;
    void runPreviewQuality(captures, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [step, captures, receiptType, userOcrCorrections]);

  const processCaptures = async (items: ReceiptCapture[]) => {
    setCaptures(items);
    setOcrWarning(null);
    setOcrQuality(null);
    setStep("processing");
    setProcessingPart(0);

    try {
      const texts: string[] = [];
      for (let i = 0; i < items.length; i += 1) {
        setProcessingPart(i + 1);
        texts.push(await recognizeReceiptImage(items[i].uri, items[i].meta));
      }
      const text = mergeManyReceiptTexts(texts);

      const result = parseReceiptText(text, {
        receiptType,
        userOcrCorrections,
      });
      const quality = assessReceiptOcrQuality(text, result, {
        photoCount: items.length,
      });

      if (__DEV__) {
        console.log("[ReceiptScan] OCR chars:", text.length);
        console.log("[ReceiptScan] photos:", items.length);
        console.log("[ReceiptScan] quality:", quality);
        console.log("[ReceiptScan] parsed:", {
          store: result.draft.storeName,
          total: result.draft.total,
          lineCount: result.draft.lines.length,
        });
      }

      setOcrQuality(quality);
      setOcrWarning(buildOcrWarning(t, text, quality, items.length));
      setParseResult(result);
      setStep("review");
    } catch (e) {
      const message =
        e instanceof ReceiptOcrUnavailableError
          ? t("receipt.error.ocrUnavailable")
          : t("receipt.error.generic");

      setOcrWarning(message);
      setOcrQuality(null);
      setParseResult(parseReceiptText("", { receiptType }));
      setStep("review");
    } finally {
      setProcessingPart(0);
    }
  };

  const confirmContinueWithFewerPhotos = (
    photoCount: number,
    onContinue: () => void,
    onAddMore: () => void
  ) => {
    Alert.alert(
      t("receipt.multi.continueOneConfirmTitle"),
      photoCount === 1
        ? t("receipt.multi.continueOneConfirmBody")
        : t("receipt.multi.continueManyConfirmBody", { count: photoCount }),
      [
        {
          text: t("receipt.multi.addNextSection"),
          onPress: onAddMore,
        },
        {
          text: t("receipt.multi.continueOneAnyway"),
          style: "destructive",
          onPress: onContinue,
        },
        { text: t("common.cancel"), style: "cancel" },
      ]
    );
  };

  const handleCapture = (capture: ReceiptCapture) => {
    setCaptures((current) => [...current, capture]);
    setStep("append_prompt");
  };

  const handleContinueWithCurrentPhotos = () => {
    if (captures.length === 0) return;
    const proceed = () => void processCaptures(captures);
    if (shouldSteerToMorePhotos(previewQuality) && captures.length < MAX_RECEIPT_PHOTOS) {
      confirmContinueWithFewerPhotos(captures.length, proceed, () =>
        setStep("camera")
      );
      return;
    }
    proceed();
  };

  const handleAddNextPhoto = () => {
    if (captures.length >= MAX_RECEIPT_PHOTOS) return;
    setStep("camera");
  };

  const handleGalleryImport = async () => {
    const capture = await pickReceiptFromGallery();
    if (!capture) return;
    handleCapture(capture);
  };

  const handleRetake = () => {
    setParseResult(null);
    setCaptures([]);
    setOcrWarning(null);
    setOcrQuality(null);
    setPreviewQuality(null);
    setProcessingPart(0);
    setStep("type_select");
  };

  const handleRetakeFirst = () => {
    setCaptures([]);
    setPreviewQuality(null);
    setStep("camera");
  };

  const handleAddPhotoFromReview = () => {
    setParseResult(null);
    setOcrQuality(null);
    setOcrWarning(null);
    setStep("camera");
  };

  const handleTypeSelect = (type: ReceiptScanType) => {
    setReceiptType(type);
    setCaptures([]);
    setStep("camera");
  };

  const suggestions = useMemo(() => {
    if (!parseResult) return [];

    const receiptNames = new Set(
      parseResult.draft.lines.map((line) => normalizeProductName(line.name))
    );
    const receiptProductIds = products
      .filter((product) => receiptNames.has(normalizeProductName(product.name)))
      .map((product) => product.id);

    return suggestFrequentProducts({
      products,
      priceSamples,
      receiptProductIds,
      shoppingListProductIds: shoppingItems
        .filter((item) => !item.checked && item.productId)
        .map((item) => item.productId!),
    });
  }, [parseResult, products, priceSamples, shoppingItems]);

  const handleConfirm = async (
    draft: ReceiptDraft,
    category: string,
    selectedSuggestions: ProductSuggestion[],
    options: { saveTotalOnly: boolean }
  ) => {
    setSaving(true);
    try {
      const lineEdits = await collectLineCorrections(
        parseResult?.draft.lines ?? [],
        draft.lines
      );
      if (lineEdits.length > 0) {
        await recordUserOcrCorrections(lineEdits);
        setUserOcrCorrections(await loadUserOcrCorrections());
      }

      await appendReceiptArchiveEntry({
        storeName: draft.storeName,
        total: draft.total,
        currency: draft.currency,
        imageUris: captures.map((capture) => capture.uri),
        rawTextPreview: draft.rawText.slice(0, 500),
      });

      const { store } = resolveOrCreate(draft.storeName);

      const existingSamples = useProductsStore.getState().priceSamples;
      let enrichedLines = draft.lines;

      if (!options.saveTotalOnly && draft.lines.length > 0) {
        const purchase = recordPurchase({
          lines: draft.lines,
          storeId: store.id,
          storeName: store.name,
          date: draft.date,
          currency: draft.currency,
          category,
        });
        enrichedLines = purchase.enrichedLines;

        await notifyPriceChanges({
          enabled: priceAlertsEnabled,
          thresholdPct: priceAlertThresholdPct,
          products: useProductsStore.getState().products,
          existingSamples,
          newSamples: purchase.newSamples,
          language,
          title: t("priceAlerts.notificationTitle"),
        });
      }

      const txDraft = receiptToTransactionDraft(
        { ...draft, storeId: store.id, lines: enrichedLines },
        { category }
      );

      await createTransaction(txDraft);

      for (const suggestion of selectedSuggestions) {
        await addItemIfMissing({
          name: suggestion.name,
          productId: suggestion.productId,
          storeId: store.id,
        });
      }

      onDone();
    } finally {
      setSaving(false);
    }
  };

  const renderAppendPrompt = () => {
    const steerToMore =
      shouldSteerToMorePhotos(previewQuality) &&
      captures.length < MAX_RECEIPT_PHOTOS;
    const declaredMismatch =
      previewDeclaredCount != null &&
      previewParsedCount < Math.floor(previewDeclaredCount * 0.65);
    const canAddMore = captures.length < MAX_RECEIPT_PHOTOS;

    return (
      <View style={styles.appendPrompt}>
        <MText variant="bodyStrong">
          {t("receipt.multi.promptCaptured", { count: captures.length })}
        </MText>
        <MText variant="caption" color="textSecondary" style={styles.appendSubtitle}>
          {canAddMore
            ? t("receipt.multi.promptSubtitle")
            : t("receipt.multi.promptMaxPhotos")}
        </MText>

        {previewQualityLoading ? (
          <View style={styles.previewQualityRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <MText variant="caption" color="textSecondary">
              {t("receipt.multi.checkingQuality")}
            </MText>
          </View>
        ) : steerToMore ? (
          <View style={styles.previewQualityBanner}>
            <MText variant="caption" style={styles.previewQualityText}>
              {declaredMismatch
                ? t("receipt.multi.declaredCountMismatch", {
                    declared: previewDeclaredCount ?? 0,
                    parsed: previewParsedCount,
                  })
                : t("receipt.multi.suggestMore")}
            </MText>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.appendPreviewRow}
        >
          {captures.map((capture, index) => (
            <Image
              key={`${capture.uri}_${index}`}
              source={{ uri: capture.uri }}
              style={styles.appendPreview}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {canAddMore ? (
          <Pressable
            style={[styles.primaryBtn, steerToMore && styles.primaryBtnEmphasis]}
            onPress={handleAddNextPhoto}
          >
            <MText variant="bodyStrong" style={styles.primaryBtnText}>
              {t("receipt.multi.addNextSection")}
            </MText>
          </Pressable>
        ) : null}

        {steerToMore ? (
          <Pressable style={styles.continueLink} onPress={handleContinueWithCurrentPhotos}>
            <MText variant="caption" color="textSecondary">
              {t("receipt.multi.continueWithCount", { count: captures.length })}
            </MText>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryBtn} onPress={handleContinueWithCurrentPhotos}>
            <MText variant="bodyStrong">
              {t("receipt.multi.continueWithCount", { count: captures.length })}
            </MText>
          </Pressable>
        )}

        <Pressable onPress={handleRetakeFirst}>
          <MText variant="caption" color="primary">
            {t("receipt.multi.retakeFirst")}
          </MText>
        </Pressable>
      </View>
    );
  };

  if (step === "type_select") {
    return (
      <View style={[styles.typeWrap, embedded && styles.cameraWrapEmbedded]}>
        <ReceiptTypeSelector onSelect={handleTypeSelect} />
        {embedded && onSwitchToManual ? (
          <Pressable style={styles.manualLink} onPress={onSwitchToManual}>
            <MText variant="caption" style={styles.manualLinkText}>
              {t("budget.create.tab.manual")}
            </MText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (step === "camera") {
    const photoIndex = captures.length;
    return (
      <View style={[styles.cameraWrap, embedded && styles.cameraWrapEmbedded]}>
        <ReceiptCameraView
          embedded={embedded}
          onCapture={handleCapture}
          onGalleryImport={
            isGalleryImportAvailable()
              ? () => void handleGalleryImport()
              : undefined
          }
          onBack={photoIndex > 0 ? () => setStep("append_prompt") : undefined}
          busy={false}
          enableStabilityCapture={photoIndex === 0}
          partLabel={t("receipt.multi.partLabel", {
            current: photoIndex + 1,
            max: MAX_RECEIPT_PHOTOS,
          })}
          hintText={t(getPartHintKey(photoIndex, MAX_RECEIPT_PHOTOS))}
        />
        {embedded && onSwitchToManual ? (
          <Pressable style={styles.manualLink} onPress={onSwitchToManual}>
            <MText variant="caption" style={styles.manualLinkText}>
              {t("budget.create.tab.manual")}
            </MText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (step === "append_prompt" && captures.length > 0) {
    return renderAppendPrompt();
  }

  if (step === "processing") {
    const processingLabel =
      processingPart > 0
        ? t("receipt.multi.processingPart", {
            current: processingPart,
            total: captures.length,
          })
        : t("receipt.processing");

    return (
      <View style={styles.processing}>
        <ActivityIndicator size="large" color={colors.primary} />
        <MText variant="body" style={styles.processingText}>
          {processingLabel}
        </MText>
      </View>
    );
  }

  if (!parseResult || captures.length === 0) {
    return null;
  }

  const canAddPhoto =
    captures.length < MAX_RECEIPT_PHOTOS &&
    (ocrQuality?.suggestMorePhotos ||
      ocrQuality?.suggestSecondPhoto ||
      ocrQuality?.suggestThirdPhoto ||
      (ocrQuality?.declaredItemCount != null &&
        ocrQuality.pricedLineCount <
          Math.floor(ocrQuality.declaredItemCount * 0.8)));

  return (
    <ReceiptReviewForm
      imageUris={captures.map((capture) => capture.uri)}
      parseResult={parseResult}
      ocrWarning={ocrWarning}
      ocrQuality={ocrQuality}
      transactions={transactions}
      suggestions={suggestions}
      saving={saving}
      onRetake={handleRetake}
      onAddPhoto={canAddPhoto ? handleAddPhotoFromReview : undefined}
      onConfirm={handleConfirm}
    />
  );
}

const styles = StyleSheet.create({
  typeWrap: {
    flex: 1,
    minHeight: 420,
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  cameraWrap: {
    flex: 1,
    minHeight: 420,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  cameraWrapEmbedded: {
    borderRadius: radii.lg,
  },
  appendPrompt: {
    flex: 1,
    minHeight: 360,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  appendSubtitle: {
    textAlign: "center",
  },
  previewQualityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  previewQualityBanner: {
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  previewQualityText: {
    textAlign: "center",
    color: colors.textSecondary,
  },
  appendPreviewRow: {
    gap: spacing.sm,
  },
  appendPreview: {
    width: 140,
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  processing: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  processingText: {
    textAlign: "center",
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  primaryBtnEmphasis: {
    borderWidth: 2,
    borderColor: "#FFF",
  },
  primaryBtnText: {
    color: "#FFF",
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  continueLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  manualLink: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.md,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  manualLinkText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
