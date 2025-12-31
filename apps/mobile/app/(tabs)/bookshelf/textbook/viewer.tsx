import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  bookshelfTheme,
  MText,
  spacing,
  radii,
  iconSizes,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import { readTextBook } from "@/utils/textBooksStorage";
import { TextBook } from "@budget/core";

const bColors = bookshelfTheme.colors;

function containsArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s);
}

export default function TextBookViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();

  const uri = useMemo(() => {
    const raw = params.uri ? String(params.uri) : "";
    return raw ? decodeURIComponent(raw) : "";
  }, [params.uri]);

  const [book, setBook] = useState<TextBook | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uri) return;
      const data = await readTextBook(uri);
      if (!mounted) return;
      setBook(data);
    })();
    return () => {
      mounted = false;
    };
  }, [uri]);

  const contentText = useMemo(() => {
    const text = book?.fullText ?? "";
    const q = query.trim();
    if (!q) return text;

    const hay = text.toLowerCase();
    const needle = q.toLowerCase();
    const idx = hay.indexOf(needle);

    if (idx < 0) return text;

    const start = Math.max(0, idx - 900);
    const end = Math.min(text.length, idx + q.length + 1600);
    return text.slice(start, end);
  }, [book, query]);

  const isArabic = useMemo(() => containsArabic(contentText), [contentText]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          name="arrow-back-outline"
          size={iconSizes.lg}
          color={bColors.textPrimary}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1 }}>
          <MText style={styles.title} numberOfLines={1}>
            {book?.title ?? "Text Book"}
          </MText>
          <MText
            color="textSecondary"
            style={styles.subtitle}
            numberOfLines={1}
          >
            {book ? `${book.pages?.length ?? 0} blocks` : ""}
          </MText>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search in text..."
          placeholderTextColor={bColors.textSecondary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <IconButton
            name="close-circle-outline"
            size={iconSizes.lg}
            color={bColors.textPrimary}
            onPress={() => setQuery("")}
          />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text selectable style={[styles.text, isArabic && styles.arabicText]}>
          {contentText}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bColors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: "700", color: bColors.textPrimary },
  subtitle: { fontSize: 12 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: bColors.borderSubtle,
    backgroundColor: bColors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: bColors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  text: {
    color: bColors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  arabicText: {
    writingDirection: "rtl",
    textAlign: "right",
    lineHeight: 28,
    letterSpacing: 0,
  },
});
