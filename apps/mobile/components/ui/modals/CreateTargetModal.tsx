import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { useBookSectionsStore } from "@/store/bookshelf/useBookSectionsStore";
import {
  MSelectBottomSheet,
  type MSelectItemBase,
} from "@/components/ui/MSelectBottomSheet";
import { TargetItemsList } from "@/components/Books/TargetItemsList";
import { useToast } from "@/components/ui/ToastProvider";
import { AppChip } from "@/components/ui/AppChip";
import { TargetType, type TargetRepeat } from "@budget/core";
import { MCreateModal } from "@/components/ui/modals/MCreateModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  books: LocalPdfFile[];
  onOpenChapters: (bookUri: string, bookName: string) => void;
  initialBookUri?: string | null;
};

type SectionPick = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
};

const clampInt = (n: any) => {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(999999, v));
};

function isValidTimeOfDay(v: string) {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [h, m] = v.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function normalizeTimeOfDay(v: string) {
  const cleaned = v.replace(/[^\d:]/g, "");
  if (cleaned.length === 5 && isValidTimeOfDay(cleaned)) return cleaned;
  return cleaned;
}

function mergeDateWithTimeOfDay(date: Date, timeOfDay: string) {
  const [hh, mm] = timeOfDay.split(":").map((x) => Number(x));
  const safeH = Number.isFinite(hh) ? hh : 0;
  const safeM = Number.isFinite(mm) ? mm : 0;

  return dayjs(date)
    .hour(safeH)
    .minute(safeM)
    .second(0)
    .millisecond(0)
    .valueOf();
}

export function CreateTargetModal({
  visible,
  onClose,
  books,
  onOpenChapters,
  initialBookUri,
}: Props) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const addTarget = useReadingTargetsStore((s) => s.addTarget);
  const addItem = useReadingTargetsStore((s) => s.addItem);
  const deleteItem = useReadingTargetsStore((s) => s.deleteItem);
  const targets = useReadingTargetsStore((s) => s.targets);

  const setTargetRepeat = useReadingTargetsStore((s) => s.setTargetRepeat);

  const getResolvedSections = useBookSectionsStore(
    (s) => (s as any).getResolvedSections
  );

  const chipColors = useMemo(
    () => ({
      active: {
        bg: colors.surfaceElevated,
        border: colors.borderSubtle,
        text: colors.textPrimary,
        icon: colors.textSecondary,
      },
      inactive: {
        bg: colors.surface,
        border: colors.borderSubtle,
        text: colors.textPrimary,
        icon: colors.textSecondary,
      },
    }),
    [colors]
  );

  const [title, setTitle] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [type, setType] = useState<TargetType>("section");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [startPageInput, setStartPageInput] = useState<string>("");
  const [endPageInput, setEndPageInput] = useState<string>("");

  // ✅ repeat create state
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<TargetRepeat["freq"]>("weekly");
  const [repeatInterval, setRepeatInterval] = useState<string>("1");
  const [repeatTimeOfDay, setRepeatTimeOfDay] = useState<string>("00:00");
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([1]);

  const [endKind, setEndKind] = useState<"never" | "until" | "count">("never");
  const [untilDate, setUntilDate] = useState<Date>(new Date());
  const [countRemaining, setCountRemaining] = useState<string>("10");
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const selectedBook = useMemo(
    () => books.find((b) => b.uri === selectedBookId) ?? null,
    [books, selectedBookId]
  );

  const bookItems = useMemo<MSelectItemBase[]>(
    () =>
      [...books]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((b) => ({ id: b.uri, label: b.name })),
    [books]
  );

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

  const currentTarget = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  useEffect(() => {
    if (!visible) return;
    if (!initialBookUri) return;
    setSelectedBookId(initialBookUri);
  }, [visible, initialBookUri]);

  useEffect(() => {
    setSelectedSectionId(null);
    setStartPageInput("");
    setEndPageInput("");
  }, [selectedBookId, type]);

  const canCreateGroup = title.trim().length > 0 && !targetId;
  const canFinish = !!targetId && (currentTarget?.items?.length ?? 0) > 0;

  const resetAll = () => {
    setTitle("");
    setTargetId(null);

    setSelectedBookId(null);
    setType("section");
    setSelectedSectionId(null);

    setStartPageInput("");
    setEndPageInput("");

    setRepeatEnabled(false);
    setRepeatFreq("weekly");
    setRepeatInterval("1");
    setRepeatTimeOfDay("00:00");
    setRepeatWeekdays([1]);
    setEndKind("never");
    setUntilDate(new Date());
    setCountRemaining("10");
    setShowUntilPicker(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

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
    return pagesStart > 0 && pagesEnd > 0 && pagesEnd > pagesStart;
  }, [targetId, selectedBook, type, selectedSection, pagesStart, pagesEnd]);

  const toggleWeekday = (d: number) => {
    setRepeatWeekdays((prev) => {
      const has = prev.includes(d);
      const next = has ? prev.filter((x) => x !== d) : [...prev, d];
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
      end = { kind: "until", untilAt };
    } else if (endKind === "count") {
      const remaining = Math.max(1, Math.floor(Number(countRemaining) || 1));
      // ✅ new model: total + remaining
      end = { kind: "count", total: remaining, remaining } as any;
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

    return { freq: repeatFreq, interval, timeOfDay: safeTime, end };
  };

  const createGroup = async () => {
    const t = title.trim();
    if (!t) return;

    try {
      const id = await addTarget(t);
      setTargetId(id);

      // ✅ apply repeat immediately after create
      const payload = buildRepeatPayload();
      if (payload) {
        await setTargetRepeat(id, payload);
      }

      showToast({ message: "Target created. Now add items.", duration: 2500 });
    } catch {
      showToast({ message: "Failed to create target.", duration: 4000 });
    }
  };

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

        showToast({ message: "Item added to target.", duration: 2000 });
        setSelectedSectionId(null);
      } catch {
        showToast({ message: "Failed to add item.", duration: 4000 });
      }

      return;
    }

    const jumpPage = pagesStart;
    const endPage = pagesEnd;

    if (!(jumpPage > 0 && endPage > 0)) {
      showToast({ message: "Enter start and end page.", duration: 3000 });
      return;
    }

    if (!(endPage > jumpPage)) {
      showToast({
        message: "End page must be greater than start page.",
        duration: 3500,
      });
      return;
    }

    try {
      await addItem(targetId, {
        bookUri: selectedBook.uri,
        bookName: selectedBook.name,
        type: "pages",
        startPage: jumpPage,
        endPage,
        labelId: `pages:${jumpPage}-${endPage}`,
        label: `${jumpPage} → ${endPage}`,
        jumpPage,
      });

      showToast({ message: "Item added to target.", duration: 2000 });
      setStartPageInput("");
      setEndPageInput("");
    } catch {
      showToast({ message: "Failed to add item.", duration: 4000 });
    }
  };

  const handleSave = () => {
    const saved = !!targetId && (currentTarget?.items?.length ?? 0) > 0;
    if (!saved) return;

    resetAll();
    onClose();
    showToast({ message: "Target saved.", duration: 2000 });
  };

  const onUntilPicked = (_e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== "ios") setShowUntilPicker(false);
    if (d) setUntilDate(d);
  };

  const untilLabel = dayjs(untilDate).format("D MMM YYYY");

  return (
    <MCreateModal
      visible={visible}
      onClose={handleClose}
      title={targetId ? "Edit Target" : "New Target"}
      sheetStyle={{ padding: spacing.lg }}
      footer={
        <Pressable
          onPress={handleSave}
          disabled={!canFinish}
          style={[
            styles.finish,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceElevated,
              opacity: canFinish ? 1 : 0.5,
            },
          ]}
        >
          <MText style={{ fontWeight: "900" }}>
            {canFinish ? "Save & Close" : "Add at least 1 item"}
          </MText>
        </Pressable>
      }
    >
      <MText style={styles.sectionTitle} color="textSecondary">
        Title
      </MText>

      <View style={styles.titleRow}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Morning routine"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.titleInput,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceElevated ?? colors.surface,
              color: colors.textPrimary,
            },
          ]}
          editable={!targetId}
        />

        {!targetId ? (
          <Pressable
            onPress={createGroup}
            disabled={!canCreateGroup}
            style={[
              styles.primaryBtn,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceElevated,
                opacity: canCreateGroup ? 1 : 0.5,
              },
            ]}
          >
            <MText style={styles.primaryBtnText} color="textPrimary">
              Create
            </MText>
          </Pressable>
        ) : (
          <View
            style={[
              styles.lockPill,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <MText style={{ fontWeight: "900", opacity: 0.7 }}>Created</MText>
          </View>
        )}
      </View>

      {/* ✅ Repeat (create stage) */}
      <MText style={styles.sectionTitle} color="textSecondary">
        Repeat
      </MText>

      <View style={styles.chipsRow}>
        <AppChip
          label={repeatEnabled ? "On" : "Off"}
          icon="repeat-outline"
          active={repeatEnabled}
          onPress={() => setRepeatEnabled((v) => !v)}
          colors={chipColors}
          size="md"
          pill={false}
        />
      </View>

      {repeatEnabled ? (
        <>
          <MText style={styles.sectionTitle} color="textSecondary">
            Frequency
          </MText>

          <View style={styles.chipsRow}>
            <AppChip
              label="Daily"
              icon="calendar-outline"
              active={repeatFreq === "daily"}
              onPress={() => setRepeatFreq("daily")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Weekly"
              icon="calendar-outline"
              active={repeatFreq === "weekly"}
              onPress={() => setRepeatFreq("weekly")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Monthly"
              icon="calendar-outline"
              active={repeatFreq === "monthly"}
              onPress={() => setRepeatFreq("monthly")}
              colors={chipColors}
              size="md"
              pill={false}
            />
          </View>

          <MText style={styles.sectionTitle} color="textSecondary">
            Interval
          </MText>
          <TextInput
            value={repeatInterval}
            onChangeText={(t) => setRepeatInterval(t.replace(/[^\d]/g, ""))}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.pageInput,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceElevated ?? colors.surface,
                color: colors.textPrimary,
              },
            ]}
          />

          {repeatFreq === "weekly" ? (
            <>
              <MText style={styles.sectionTitle} color="textSecondary">
                Weekdays
              </MText>
              <View style={styles.weekdaysRow}>
                {[
                  ["Mon", 1],
                  ["Tue", 2],
                  ["Wed", 3],
                  ["Thu", 4],
                  ["Fri", 5],
                  ["Sat", 6],
                  ["Sun", 0],
                ].map(([label, d]) => (
                  <Pressable
                    key={String(d)}
                    onPress={() => toggleWeekday(d as number)}
                    style={[
                      styles.weekdayChip,
                      {
                        borderColor: colors.borderSubtle,
                        backgroundColor: repeatWeekdays.includes(d as number)
                          ? colors.surfaceElevated
                          : colors.surface,
                      },
                    ]}
                  >
                    <MText style={{ fontWeight: "900", opacity: 0.8 }}>
                      {label}
                    </MText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <MText style={styles.sectionTitle} color="textSecondary">
            Reset time (HH:mm)
          </MText>
          <TextInput
            value={repeatTimeOfDay}
            onChangeText={(t) => setRepeatTimeOfDay(normalizeTimeOfDay(t))}
            placeholder="00:00"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.pageInput,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceElevated ?? colors.surface,
                color: colors.textPrimary,
              },
            ]}
          />
          {!isValidTimeOfDay(repeatTimeOfDay) ? (
            <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
              Format: HH:mm (e.g. 08:30)
            </MText>
          ) : null}

          <MText style={styles.sectionTitle} color="textSecondary">
            End
          </MText>

          <View style={styles.chipsRow}>
            <AppChip
              label="Never"
              icon="infinite-outline"
              active={endKind === "never"}
              onPress={() => setEndKind("never")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Until"
              icon="calendar-outline"
              active={endKind === "until"}
              onPress={() => setEndKind("until")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Count"
              icon="repeat-outline"
              active={endKind === "count"}
              onPress={() => setEndKind("count")}
              colors={chipColors}
              size="md"
              pill={false}
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
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onUntilPicked}
                />
              ) : null}
            </View>
          ) : null}

          {endKind === "count" ? (
            <View style={{ marginTop: spacing.sm }}>
              <TextInput
                value={countRemaining}
                onChangeText={(t) => setCountRemaining(t.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.pageInput,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceElevated ?? colors.surface,
                    color: colors.textPrimary,
                  },
                ]}
              />
              <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                How many cycles (e.g. 10).
              </MText>
            </View>
          ) : null}
        </>
      ) : null}

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
          <MText style={styles.sectionTitle} color="textSecondary">
            Type
          </MText>

          <View style={styles.chipsRow}>
            <AppChip
              label="Section"
              icon="list-outline"
              active={type === "section"}
              onPress={() => setType("section")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Pages"
              icon="copy-outline"
              active={type === "pages"}
              onPress={() => setType("pages")}
              colors={chipColors}
              size="md"
              pill={false}
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
                  <MText style={{ fontWeight: "800" }}>Open chapters</MText>
                </Pressable>
              </View>
            )
          ) : (
            <>
              <MText style={styles.sectionTitle} color="textSecondary">
                Pages
              </MText>

              <View style={styles.pagesRow}>
                <View style={{ flex: 1 }}>
                  <MText style={styles.pagesLabel} color="textSecondary">
                    Start page
                  </MText>
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
                        backgroundColor:
                          colors.surfaceElevated ?? colors.surface,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={{ width: spacing.sm }} />

                <View style={{ flex: 1 }}>
                  <MText style={styles.pagesLabel} color="textSecondary">
                    End page
                  </MText>
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
                        backgroundColor:
                          colors.surfaceElevated ?? colors.surface,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                Tip: End page must be greater than start page.
              </MText>
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
            <MText style={{ fontWeight: "900" }}>
              {targetId ? "Add item" : "Create group first"}
            </MText>
          </Pressable>
        </>
      ) : null}

      {currentTarget?.items?.length ? (
        <TargetItemsList
          items={currentTarget.items}
          onDeleteItem={(itemId) => deleteItem(currentTarget.id, itemId)}
        />
      ) : null}

      <View style={{ height: spacing.lg }} />
    </MCreateModal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: "800",
    opacity: 0.85,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  primaryBtnText: { fontWeight: "900" },
  lockPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
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
  pagesLabel: {
    fontWeight: "800",
    opacity: 0.85,
    marginBottom: spacing.xs,
  },
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
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
