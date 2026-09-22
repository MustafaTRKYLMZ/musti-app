import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import {
  mergeReceiptTexts,
  normalizeProductName,
  parseReceiptText,
  receiptToTransactionDraft,
  suggestFrequentProducts,
  useTranslation,
  type ParseReceiptResult,
  type ProductSuggestion,
  type ReceiptDraft,
} from "@musti/core";
import { MText, colors, spacing, radii } from "@musti/ui-native";
import { ReceiptCameraView } from "@/components/receipt/ReceiptCameraView";
import { ReceiptReviewForm } from "@/components/receipt/ReceiptReviewForm";
import {
  recognizeReceiptImage,
  ReceiptOcrUnavailableError,
} from "@/services/receipt/recognizeReceiptImage";
import { useStoresStore } from "@/store/budget/stores/useStoresStore";
import { useProductsStore } from "@/store/budget/products/useProductsStore";
import { useTransactionsStore } from "@/store/budget/transactions/useTransactionsStore";
import { useShoppingListStore } from "@/store/budget/shopping-list/useShoppingListStore";
import { useBudgetNotificationSettingsStore } from "@/store/budget/notification/useNotificationSettingsStore";
import { notifyPriceChanges } from "@/services/receipt/notifyPriceChanges";

type Step =
  | "camera"
  | "append_prompt"
  | "camera_second"
  | "processing"
  | "review";

type Props = {
  embedded?: boolean;
  onDone: () => void;
  onSwitchToManual?: () => void;
  onStepChange?: (step: "camera" | "processing" | "review") => void;
};

const CAMERA_STEPS: Step[] = ["camera", "append_prompt", "camera_second"];

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

  const [step, setStepState] = useState<Step>("camera");

  const setStep = (next: Step) => {
    setStepState(next);
    if (next === "review") {
      onStepChange?.("review");
    } else if (CAMERA_STEPS.includes(next)) {
      onStepChange?.("camera");
    } else if (next === "processing") {
      onStepChange?.("processing");
    }
  };

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [parseResult, setParseResult] = useState<ParseReceiptResult | null>(
    null
  );
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingPart, setProcessingPart] = useState(0);

  const processImages = async (uris: string[]) => {
    setImageUris(uris);
    setOcrWarning(null);
    setStep("processing");
    setProcessingPart(0);

    try {
      let text = "";
      if (uris.length === 1) {
        setProcessingPart(1);
        text = await recognizeReceiptImage(uris[0]);
      } else {
        setProcessingPart(1);
        const partA = await recognizeReceiptImage(uris[0]);
        setProcessingPart(2);
        const partB = await recognizeReceiptImage(uris[1]);
        text = mergeReceiptTexts(partA, partB);
      }

      const result = parseReceiptText(text);

      if (__DEV__) {
        console.log("[ReceiptScan] OCR chars:", text.length);
        console.log("[ReceiptScan] OCR preview:", text.slice(0, 600));
        console.log("[ReceiptScan] parsed:", {
          store: result.draft.storeName,
          total: result.draft.total,
          category: result.draft.suggestedCategory,
          lineCount: result.draft.lines.length,
          lines: result.draft.lines
            .slice(0, 8)
            .map((l) => `${l.name}=${l.totalAmount}`),
        });
      }

      if (!text.trim()) {
        setOcrWarning(t("receipt.error.noText"));
      } else if (uris.length > 1) {
        setOcrWarning(null);
      }

      setParseResult(result);
      setStep("review");
    } catch (e) {
      const message =
        e instanceof ReceiptOcrUnavailableError
          ? t("receipt.error.ocrUnavailable")
          : t("receipt.error.generic");

      setOcrWarning(message);
      setParseResult(parseReceiptText(""));
      setStep("review");
    } finally {
      setProcessingPart(0);
    }
  };

  const handleFirstCapture = (uri: string) => {
    setImageUris([uri]);
    setStep("append_prompt");
  };

  const handleSecondCapture = (uri: string) => {
    void processImages([imageUris[0], uri]);
  };

  const handleContinueSingle = () => {
    if (imageUris[0]) {
      void processImages([imageUris[0]]);
    }
  };

  const handleRetake = () => {
    setParseResult(null);
    setImageUris([]);
    setOcrWarning(null);
    setProcessingPart(0);
    setStep("camera");
  };

  const handleRetakeFirst = () => {
    setImageUris([]);
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

  if (step === "camera") {
    return (
      <View style={[styles.cameraWrap, embedded && styles.cameraWrapEmbedded]}>
        <ReceiptCameraView
          embedded={embedded}
          onCapture={handleFirstCapture}
          busy={false}
          partLabel={t("receipt.multi.partFirst")}
          hintText={t("receipt.multi.hintFirst")}
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

  if (step === "append_prompt" && imageUris[0]) {
    return (
      <View style={styles.appendPrompt}>
        <MText variant="bodyStrong">{t("receipt.multi.promptTitle")}</MText>
        <MText variant="caption" color="textSecondary" style={styles.appendSubtitle}>
          {t("receipt.multi.promptSubtitle")}
        </MText>

        <Image
          source={{ uri: imageUris[0] }}
          style={styles.appendPreview}
          resizeMode="cover"
        />

        <Pressable
          style={styles.primaryBtn}
          onPress={() => setStep("camera_second")}
        >
          <MText variant="bodyStrong" style={styles.primaryBtnText}>
            {t("receipt.multi.addSecond")}
          </MText>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={handleContinueSingle}>
          <MText variant="bodyStrong">{t("receipt.multi.continueOne")}</MText>
        </Pressable>

        <Pressable onPress={handleRetakeFirst}>
          <MText variant="caption" color="primary">
            {t("receipt.multi.retakeFirst")}
          </MText>
        </Pressable>
      </View>
    );
  }

  if (step === "camera_second") {
    return (
      <View style={[styles.cameraWrap, embedded && styles.cameraWrapEmbedded]}>
        <ReceiptCameraView
          embedded={embedded}
          onCapture={handleSecondCapture}
          onBack={() => setStep("append_prompt")}
          busy={false}
          partLabel={t("receipt.multi.partSecond")}
          hintText={t("receipt.multi.hintSecond")}
        />
      </View>
    );
  }

  if (step === "processing") {
    return (
      <View style={styles.processing}>
        <ActivityIndicator size="large" color={colors.primary} />
        <MText variant="body" style={styles.processingText}>
          {processingPart > 1
            ? t("receipt.multi.processingSecond")
            : processingPart === 1 && imageUris.length > 1
              ? t("receipt.multi.processingFirst")
              : t("receipt.processing")}
        </MText>
      </View>
    );
  }

  if (!parseResult || imageUris.length === 0) {
    return null;
  }

  return (
    <ReceiptReviewForm
      imageUris={imageUris}
      parseResult={parseResult}
      ocrWarning={ocrWarning}
      transactions={transactions}
      suggestions={suggestions}
      saving={saving}
      onRetake={handleRetake}
      onConfirm={handleConfirm}
    />
  );
}

const styles = StyleSheet.create({
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
  appendPreview: {
    width: "100%",
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
