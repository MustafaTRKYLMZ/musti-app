import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { useBookSectionsStore } from "@/store/bookshelf/useBookSectionsStore";
import {
  MSelectBottomSheet,
  type MSelectItemBase,
} from "@/components/ui/MSelectBottomSheet";
import { TargetItemsList } from "@/components/Books/TargetItemsList";
import { useToast } from "@/components/ui/ToastProvider";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import { TargetType, type TargetRepeat } from "@budget/core";
import { clampInt } from "@/utils/number";
import {
  isValidTimeOfDay,
  normalizeTimeOfDay,
} from "@/utils/normalizeTimeOfDay";

type Props = {
  visible: boolean;
  targetId: string | null;
  onClose: () => void;
  onOpenChapters: (bookUri: string, bookName: string) => void;
};

type SectionPick = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
};

function mergeDateWithTimeOfDay(date: Date, timeOfDay: string) {
  const [hh, mm] = (timeOfDay || "00:00").split(":").map((x) => Number(x));
  const safeH = Number.isFinite(hh) ? hh : 0;
  const safeM = Number.isFinite(mm) ? mm : 0;

  return dayjs(date)
    .hour(safeH)
    .minute(safeM)
    .second(0)
    .millisecond(0)
    .valueOf();
}

function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.borderSubtle, backgroundColor: colors.surface },
        active && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <MText
        numberOfLines={1}
        style={{ fontWeight: "800", opacity: active ? 1 : 0.75 }}
      >
        {text}
      </MText>
    </Pressable>
  );
}

function WeekdayChip({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.weekdayChip,
        {
          borderColor: colors.borderSubtle,
          backgroundColor: active ? colors.surfaceElevated : colors.surface,
        },
      ]}
    >
      <MText style={{ fontWeight: "900", opacity: active ? 1 : 0.7 }}>
        {text}
      </MText>
    </Pressable>
  );
}

export function EditTargetModal({
  visible,
  targetId,
  onClose,
  onOpenChapters,
}: Props) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const targets = useReadingTargetsStore((s) => s.targets);
  const addItem = useReadingTargetsStore((s) => s.addItem);
  const deleteItem = useReadingTargetsStore((s) => s.deleteItem);
  const updateTargetTitle = useReadingTargetsStore((s) => s.updateTargetTitle);
  const setTargetRepeat = useReadingTargetsStore((s) => s.setTargetRepeat);

  const getResolvedSections = useBookSectionsStore(
    (s) => (s as any).getResolvedSections
  );

  const progressItems = useBooksStore((s) => s.items);

  const target = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  // --- local UI state ---
  const [title, setTitle] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [type, setType] = useState<TargetType>("section");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [startPageInput, setStartPageInput] = useState<string>("");
  const [endPageInput, setEndPageInput] = useState<string>("");

  // --- repeat local state ---
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<TargetRepeat["freq"]>("weekly");
  const [repeatInterval, setRepeatInterval] = useState<string>("1");
  const [repeatTimeOfDay, setRepeatTimeOfDay] = useState<string>("00:00");
  // weekly: 0=Sun ... 6=Sat (UI: Mon..Sun)
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([1]);

  // --- repeat end ---
  const [endKind, setEndKind] = useState<"never" | "until" | "count">("never");
  const [untilDate, setUntilDate] = useState<Date>(new Date());
  const [countRemaining, setCountRemaining] = useState<string>("10");
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const availableBooks = useMemo(() => {
    const map = new Map<string, { uri: string; name: string }>();

    // 1) target items
    for (const it of target?.items ?? []) {
      if (it?.bookUri)
        map.set(it.bookUri, { uri: it.bookUri, name: it.bookName ?? "" });
    }

    // 2) progress store
    for (const uri of Object.keys(progressItems ?? {})) {
      const p = (progressItems as any)[uri];
      if (!p?.uri) continue;
      map.set(p.uri, {
        uri: p.uri,
        name: p.name ?? map.get(p.uri)?.name ?? "",
      });
    }

    return Array.from(map.values())
      .filter((b) => !!b.uri && !!b.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [target?.items, progressItems]);

  const bookItems = useMemo<MSelectItemBase[]>(
    () => availableBooks.map((b) => ({ id: b.uri, label: b.name })),
    [availableBooks]
  );

  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return availableBooks.find((b) => b.uri === selectedBookId) ?? null;
  }, [availableBooks, selectedBookId]);

  useEffect(() => {
    if (!visible) return;
    if (!target) return;

    setTitle(target.title);

    const firstBookUri = target.items?.[0]?.bookUri ?? null;
    setSelectedBookId(firstBookUri);

    setType("section");
    setSelectedSectionId(null);
    setStartPageInput("");
    setEndPageInput("");

    // ✅ hydrate repeat UI from target
    if (target.repeat) {
      setRepeatEnabled(true);
      setRepeatFreq(target.repeat.freq);
      setRepeatInterval(String(target.repeat.interval ?? 1));
      setRepeatTimeOfDay(target.repeat.timeOfDay ?? "00:00");
      setRepeatWeekdays(
        target.repeat.weekdays && target.repeat.weekdays.length
          ? target.repeat.weekdays
          : [1]
      );

      // ✅ hydrate end (new+old)
      const end = target.repeat.end as any;
      if (!end || end.kind === "never") {
        setEndKind("never");
      } else if (end.kind === "until") {
        setEndKind("until");
        setUntilDate(new Date(end.untilAt));
      } else if (end.kind === "count") {
        setEndKind("count");
        const total = Number(end.total ?? end.remaining ?? 1);
        setCountRemaining(String(Math.max(1, Math.floor(total || 1))));
      } else {
        setEndKind("never");
      }
    } else {
      setRepeatEnabled(false);
      setRepeatFreq("weekly");
      setRepeatInterval("1");
      setRepeatTimeOfDay("00:00");
      setRepeatWeekdays([1]);

      setEndKind("never");
      setUntilDate(new Date());
      setCountRemaining("10");
    }
  }, [visible, target]);

  useEffect(() => {
    setSelectedSectionId(null);
    setStartPageInput("");
    setEndPageInput("");
  }, [selectedBookId, type]);

  // sections
  const resolvedSections = useMemo<SectionPick[]>(() => {
    if (!selectedBookId) return [];
    if (!getResolvedSections) return [];

    const secs = getResolvedSections(selectedBookId, null) ?? [];
    return secs
      .map((s: any) => ({
        id: String(s.id),
        title: String(s.title ?? "Untitled"),
        startPage: Math.max(1, clampInt(s.startPage ?? 1) || 1),
        endPage: Math.max(1, clampInt(s.endPage ?? 1) || 1),
      }))
      .filter((s: any) => s.endPage >= s.startPage);
  }, [getResolvedSections, selectedBookId]);

  const sectionItems = useMemo<MSelectItemBase[]>(
    () =>
      resolvedSections.map((s) => ({
        id: `sec:${s.id}`,
        label: s.title,
        subLabel: `${s.startPage}–${s.endPage}`,
      })),
    [resolvedSections]
  );

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    const rawId = selectedSectionId.replace("sec:", "");
    return resolvedSections.find((s) => String(s.id) === rawId) ?? null;
  }, [selectedSectionId, resolvedSections]);

  const pagesStart = Math.max(1, clampInt(startPageInput) || 0);
  const pagesEnd = Math.max(1, clampInt(endPageInput) || 0);

  const canAddItem = useMemo(() => {
    if (!targetId) return false;
    if (!selectedBook) return false;

    if (type === "section") return !!selectedSection;
    return pagesStart > 0 && pagesEnd > 0 && pagesEnd >= pagesStart;
  }, [targetId, selectedBook, type, selectedSection, pagesStart, pagesEnd]);

  const addSelectedItem = async () => {
    if (!targetId || !selectedBook) return;

    if (type === "section") {
      if (!selectedSection) {
        showToast({ message: "Select a section first.", duration: 2500 });
        return;
      }

      const jumpPage = Math.max(1, selectedSection.startPage);
      const endPage = Math.max(jumpPage, selectedSection.endPage);

      try {
        await addItem(targetId, {
          bookUri: selectedBook.uri,
          bookName: selectedBook.name,
          type: "section",
          startPage: jumpPage,
          endPage,
          labelId: `sec:${selectedSection.id}`,
          label: selectedSection.title,
          jumpPage,
        });

        showToast({ message: "Item added.", duration: 1800 });
        setSelectedSectionId(null);
      } catch {
        showToast({ message: "Failed to add item.", duration: 3500 });
      }
      return;
    }

    // pages
    if (!(pagesEnd >= pagesStart)) {
      showToast({
        message: "End page must be greater than or equal to start page.",
        duration: 3500,
      });
      return;
    }

    try {
      await addItem(targetId, {
        bookUri: selectedBook.uri,
        bookName: selectedBook.name,
        type: "pages",
        startPage: pagesStart,
        endPage: pagesEnd,
        labelId: `pages:${pagesStart}-${pagesEnd}`,
        label: `${pagesStart} → ${pagesEnd}`,
        jumpPage: pagesStart,
      });

      showToast({ message: "Item added.", duration: 1800 });
      setStartPageInput("");
      setEndPageInput("");
    } catch {
      showToast({ message: "Failed to add item.", duration: 3500 });
    }
  };

  const toggleWeekday = (d: number) => {
    setRepeatWeekdays((prev) => {
      const has = prev.includes(d);
      const next = has ? prev.filter((x) => x !== d) : [...prev, d];
      // weekly’de boş kalmasın
      return next.length ? next : [1];
    });
  };

  const buildRepeatPayload = (): TargetRepeat | null => {
    if (!repeatEnabled) return null;

    const interval = Math.max(1, Math.floor(Number(repeatInterval) || 1));
    const time = repeatTimeOfDay?.trim() || "00:00";
    const safeTime = isValidTimeOfDay(time) ? time : "00:00";

    let end: TargetRepeat["end"] | undefined = undefined;

    if (endKind === "until") {
      const untilAt = mergeDateWithTimeOfDay(untilDate, safeTime);
      end = { kind: "until", untilAt } as any;
    } else if (endKind === "count") {
      const total = Math.max(1, Math.floor(Number(countRemaining) || 1));
      end = { kind: "count", total, remaining: total } as any; // ✅ total+remaining
    } else {
      end = undefined; // never
    }

    if (repeatFreq === "weekly") {
      const wds =
        repeatWeekdays && repeatWeekdays.length
          ? [...new Set(repeatWeekdays)].filter((x) => x >= 0 && x <= 6)
          : [1];

      return {
        freq: "weekly",
        interval,
        weekdays: wds,
        timeOfDay: safeTime,
        end,
      };
    }

    return {
      freq: repeatFreq,
      interval,
      timeOfDay: safeTime,
      end,
    };
  };

  const onUntilPicked = (_e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== "ios") setShowUntilPicker(false);
    if (d) setUntilDate(d);
  };

  const handleSave = async () => {
    if (!target) {
      onClose();
      return;
    }

    try {
      // title
      if (title.trim() && title.trim() !== target.title) {
        await updateTargetTitle(target.id, title.trim());
      }

      // repeat
      const payload = buildRepeatPayload();
      await setTargetRepeat(target.id, payload);
    } catch {
      showToast({ message: "Failed to save target.", duration: 3500 });
      return;
    }

    onClose();
    showToast({ message: "Target saved.", duration: 2000 });
  };

  if (!visible) return null;

  const untilLabel = dayjs(untilDate).format("D MMM YYYY");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ justifyContent: "flex-end" }}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <MText variant="heading3">Edit Target</MText>
              <IconButton
                name="close"
                size={iconSizes.lg}
                color={colors.textPrimary}
                onPress={onClose}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              <MText style={styles.sectionTitle}>Title</MText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Target title"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.titleInput,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                  },
                ]}
              />

              {/* Repeat */}
              <MText style={styles.sectionTitle}>Repeat</MText>

              <View style={styles.chipsRow}>
                <Chip
                  text={repeatEnabled ? "On" : "Off"}
                  active={repeatEnabled}
                  onPress={() => setRepeatEnabled((v) => !v)}
                />
                {!repeatEnabled ? (
                  <MText style={{ opacity: 0.7, marginLeft: spacing.sm }}>
                    One-time target
                  </MText>
                ) : null}
              </View>

              {repeatEnabled ? (
                <View style={{ marginTop: spacing.sm }}>
                  <MText style={styles.sectionTitle}>Frequency</MText>
                  <View style={styles.chipsRow}>
                    <Chip
                      text="Daily"
                      active={repeatFreq === "daily"}
                      onPress={() => setRepeatFreq("daily")}
                    />
                    <Chip
                      text="Weekly"
                      active={repeatFreq === "weekly"}
                      onPress={() => setRepeatFreq("weekly")}
                    />
                    <Chip
                      text="Monthly"
                      active={repeatFreq === "monthly"}
                      onPress={() => setRepeatFreq("monthly")}
                    />
                  </View>

                  <View style={{ marginTop: spacing.md }}>
                    <MText style={styles.sectionTitle}>Interval</MText>
                    <TextInput
                      value={repeatInterval}
                      onChangeText={(t) =>
                        setRepeatInterval(t.replace(/[^\d]/g, ""))
                      }
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.pageInput,
                        {
                          borderColor: colors.borderSubtle,
                          backgroundColor: colors.surface,
                          color: colors.textPrimary,
                        },
                      ]}
                    />
                    <MText style={{ opacity: 0.65, marginTop: spacing.xs }}>
                      {repeatFreq === "daily"
                        ? "Every N days"
                        : repeatFreq === "weekly"
                        ? "Every N weeks"
                        : "Every N months"}
                    </MText>
                  </View>

                  {repeatFreq === "weekly" ? (
                    <View style={{ marginTop: spacing.md }}>
                      <MText style={styles.sectionTitle}>Weekdays</MText>
                      <View style={styles.weekdaysRow}>
                        <WeekdayChip
                          text="Mon"
                          active={repeatWeekdays.includes(1)}
                          onPress={() => toggleWeekday(1)}
                        />
                        <WeekdayChip
                          text="Tue"
                          active={repeatWeekdays.includes(2)}
                          onPress={() => toggleWeekday(2)}
                        />
                        <WeekdayChip
                          text="Wed"
                          active={repeatWeekdays.includes(3)}
                          onPress={() => toggleWeekday(3)}
                        />
                        <WeekdayChip
                          text="Thu"
                          active={repeatWeekdays.includes(4)}
                          onPress={() => toggleWeekday(4)}
                        />
                        <WeekdayChip
                          text="Fri"
                          active={repeatWeekdays.includes(5)}
                          onPress={() => toggleWeekday(5)}
                        />
                        <WeekdayChip
                          text="Sat"
                          active={repeatWeekdays.includes(6)}
                          onPress={() => toggleWeekday(6)}
                        />
                        <WeekdayChip
                          text="Sun"
                          active={repeatWeekdays.includes(0)}
                          onPress={() => toggleWeekday(0)}
                        />
                      </View>
                    </View>
                  ) : null}

                  <View style={{ marginTop: spacing.md }}>
                    <MText style={styles.sectionTitle}>Reset time</MText>
                    <TextInput
                      value={repeatTimeOfDay}
                      onChangeText={(t) =>
                        setRepeatTimeOfDay(normalizeTimeOfDay(t))
                      }
                      placeholder="00:00"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.pageInput,
                        {
                          borderColor: colors.borderSubtle,
                          backgroundColor: colors.surface,
                          color: colors.textPrimary,
                        },
                      ]}
                    />
                    {!isValidTimeOfDay(repeatTimeOfDay) ? (
                      <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                        Format: HH:mm (e.g. 08:30)
                      </MText>
                    ) : null}
                  </View>

                  {/* END */}
                  <View style={{ marginTop: spacing.md }}>
                    <MText style={styles.sectionTitle}>End</MText>
                    <View style={styles.chipsRow}>
                      <Chip
                        text="Never"
                        active={endKind === "never"}
                        onPress={() => setEndKind("never")}
                      />
                      <Chip
                        text="Until"
                        active={endKind === "until"}
                        onPress={() => setEndKind("until")}
                      />
                      <Chip
                        text="Count"
                        active={endKind === "count"}
                        onPress={() => setEndKind("count")}
                      />
                    </View>

                    {endKind === "until" ? (
                      <View style={{ marginTop: spacing.sm }}>
                        <Pressable
                          onPress={() => setShowUntilPicker(true)}
                          style={[
                            styles.smallBtn,
                            {
                              borderColor: colors.borderSubtle,
                              backgroundColor: colors.surface,
                            },
                          ]}
                        >
                          <MText style={{ fontWeight: "900" }}>
                            End date: {untilLabel}
                          </MText>
                        </Pressable>

                        {showUntilPicker ? (
                          <DateTimePicker
                            value={untilDate}
                            mode="date"
                            display={
                              Platform.OS === "ios" ? "spinner" : "default"
                            }
                            onChange={onUntilPicked}
                          />
                        ) : null}

                        <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                          The repeat will stop after this date (using the reset
                          time).
                        </MText>
                      </View>
                    ) : null}

                    {endKind === "count" ? (
                      <View style={{ marginTop: spacing.sm }}>
                        <TextInput
                          value={countRemaining}
                          onChangeText={(t) =>
                            setCountRemaining(t.replace(/[^\d]/g, ""))
                          }
                          keyboardType="number-pad"
                          placeholder="10"
                          placeholderTextColor={colors.textSecondary}
                          style={[
                            styles.pageInput,
                            {
                              borderColor: colors.borderSubtle,
                              backgroundColor: colors.surface,
                              color: colors.textPrimary,
                            },
                          ]}
                        />
                        <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                          How many cycles to run (e.g. 10).
                        </MText>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* Book select */}
              <View style={{ marginTop: spacing.md }}>
                <MSelectBottomSheet
                  label="Book"
                  placeholder="Select a book…"
                  valueId={selectedBookId}
                  items={bookItems}
                  onChange={(it) => setSelectedBookId(it.id)}
                  searchable
                  searchPlaceholder="Search book…"
                />
              </View>

              {selectedBook ? (
                <>
                  <MText style={styles.sectionTitle}>Type</MText>
                  <View style={styles.chipsRow}>
                    <Chip
                      text="Section"
                      active={type === "section"}
                      onPress={() => setType("section")}
                    />
                    <Chip
                      text="Pages"
                      active={type === "pages"}
                      onPress={() => setType("pages")}
                    />
                  </View>

                  {type === "section" ? (
                    sectionItems.length > 0 ? (
                      <View style={{ marginTop: spacing.md }}>
                        <MSelectBottomSheet
                          label="Section"
                          placeholder="Select a section…"
                          valueId={selectedSectionId}
                          items={sectionItems}
                          onChange={(it) => setSelectedSectionId(it.id)}
                          searchable
                          searchPlaceholder="Search section…"
                        />
                      </View>
                    ) : (
                      <View style={{ marginTop: spacing.md }}>
                        <MText style={{ opacity: 0.7 }}>
                          No sections found for this book.
                        </MText>

                        <Pressable
                          onPress={() =>
                            onOpenChapters(selectedBook.uri, selectedBook.name)
                          }
                          style={[
                            styles.smallBtn,
                            {
                              borderColor: colors.borderSubtle,
                              backgroundColor: colors.surface,
                              marginTop: spacing.sm,
                            },
                          ]}
                        >
                          <MText style={{ fontWeight: "800" }}>
                            Open chapters
                          </MText>
                        </Pressable>
                      </View>
                    )
                  ) : (
                    <>
                      <MText style={styles.sectionTitle}>Pages</MText>

                      <View style={styles.pagesRow}>
                        <View style={{ flex: 1 }}>
                          <MText style={styles.pagesLabel}>Start page</MText>
                          <TextInput
                            value={startPageInput}
                            onChangeText={(t) =>
                              setStartPageInput(t.replace(/[^\d]/g, ""))
                            }
                            keyboardType="number-pad"
                            placeholder="e.g. 10"
                            placeholderTextColor={colors.textSecondary}
                            style={[
                              styles.pageInput,
                              {
                                borderColor: colors.borderSubtle,
                                backgroundColor: colors.surface,
                                color: colors.textPrimary,
                              },
                            ]}
                          />
                        </View>

                        <View style={{ width: spacing.sm }} />

                        <View style={{ flex: 1 }}>
                          <MText style={styles.pagesLabel}>End page</MText>
                          <TextInput
                            value={endPageInput}
                            onChangeText={(t) =>
                              setEndPageInput(t.replace(/[^\d]/g, ""))
                            }
                            keyboardType="number-pad"
                            placeholder="e.g. 30"
                            placeholderTextColor={colors.textSecondary}
                            style={[
                              styles.pageInput,
                              {
                                borderColor: colors.borderSubtle,
                                backgroundColor: colors.surface,
                                color: colors.textPrimary,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </>
                  )}

                  <Pressable
                    onPress={addSelectedItem}
                    disabled={!canAddItem}
                    style={[
                      styles.cta,
                      {
                        borderColor: colors.borderSubtle,
                        backgroundColor: colors.surface,
                        opacity: canAddItem ? 1 : 0.5,
                      },
                    ]}
                  >
                    <MText style={{ fontWeight: "900" }}>Add item</MText>
                  </Pressable>
                </>
              ) : null}

              {target?.items?.length ? (
                <TargetItemsList
                  items={target.items}
                  onDeleteItem={(itemId) => {
                    if (!targetId) return;
                    deleteItem(targetId, itemId);
                    showToast({ message: "Item removed.", duration: 1800 });
                  }}
                />
              ) : null}
            </ScrollView>

            <Pressable
              onPress={handleSave}
              disabled={!targetId}
              style={[
                styles.finish,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceElevated,
                  opacity: targetId ? 1 : 0.5,
                },
              ]}
            >
              <MText style={{ fontWeight: "900" }}>Save & Close</MText>
            </Pressable>
          </View>

          <View style={{ height: spacing["2xl"] }} />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: "800",
    opacity: 0.85,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  weekdaysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  weekdayChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pagesRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.xs,
  },
  pagesLabel: { fontWeight: "800", opacity: 0.85, marginBottom: spacing.xs },
  pageInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  cta: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  finish: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
