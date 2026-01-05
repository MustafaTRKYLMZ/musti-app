import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Controller } from "react-hook-form";

import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  Card,
} from "@musti/ui-native";
import { IconButton, BaseIcon } from "@musti/ui-native";
import { MSelectBottomSheet } from "@/components/ui/MSelectBottomSheet";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";

type Props = {
  mode: "create" | "edit";
  books: LocalPdfFile[];
  subtitle?: string;

  // controller bits
  control: any;
  errors: any;
  fields: any[];

  availableBooks: LocalPdfFile[];
  bookItems: any[];
  selectedBookUri: string | null;
  setSelectedBookUri: (v: string | null) => void;

  pagesInput: string;
  setPagesInput: (v: string) => void;

  multiSelectOpen: boolean;
  toggleMultiSelectOpen: () => void;
  closeMultiSelect: () => void;
  multiSelected: Record<string, boolean>;
  toggleMultiBook: (uri: string) => void;

  addSelected: () => void;
  addMultiSelected: () => void;

  removeAt: (idx: number) => void;
  updatePages: (idx: number, t: string) => void;

  setAllTargets: (n: number) => void;
  clearAllTargets: () => void;
  addAllBooks: () => void;
  removeAllBooks: () => void;

  setOrderFromDnd: (uris: string[]) => void;

  onSave: () => void;
  onDelete?: () => void;
};

type RowData = LocalPdfFile & { _formIndex: number };

export function PlanForm(props: Props) {
  const { colors } = useTheme();

  const planBooks = useMemo<RowData[]>(() => {
    return props.fields
      .map((it: any, idx: number) => {
        const book = props.books.find((b) => b.uri === it.bookUri);
        if (!book) return null;
        return { ...book, _formIndex: idx };
      })
      .filter(Boolean) as RowData[];
  }, [props.fields, props.books]);

  const renderRow = ({ item, drag, isActive }: RenderItemParams<RowData>) => {
    const idx = item._formIndex;

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.rowCard,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            opacity: isActive ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.dragHandle,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <BaseIcon
              family="ion"
              name="reorder-three-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
              {item.name}
            </MText>
            <MText variant="caption" color="textSecondary" numberOfLines={1}>
              Long press to reorder
            </MText>
          </View>
        </View>

        <View style={styles.rowRight}>
          <Controller
            control={props.control}
            name={`items.${idx}.pagesPerDay`}
            render={({ field: { value } }) => (
              <TextInput
                value={String(value ?? "")}
                onChangeText={(t) => props.updatePages(idx, t)}
                keyboardType="numeric"
                placeholder="0"
                style={[
                  styles.pagesInput,
                  {
                    borderColor: colors.borderSubtle,
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholderTextColor={colors.textSecondary}
              />
            )}
          />
          <MText
            variant="body"
            color="textSecondary"
            style={{ marginLeft: spacing.xs }}
          >
            /day
          </MText>

          <IconButton
            name="trash-outline"
            size={iconSizes.md}
            onPress={() => props.removeAt(idx)}
            style={{ marginLeft: spacing.sm }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: spacing["3xl"] ?? spacing.xl }}
    >
      {/* name */}
      <Card
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <MText variant="body" color="textSecondary">
          Plan name
        </MText>
        <Controller
          control={props.control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Reading plan"
              style={[
                styles.textInput,
                {
                  borderColor: colors.borderSubtle,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholderTextColor={colors.textSecondary}
            />
          )}
        />
        {props.errors.name?.message ? (
          <MText style={{ opacity: 0.75, marginTop: spacing.xs }}>
            {String(props.errors.name.message)}
          </MText>
        ) : null}
      </Card>

      {/* quick */}
      <Card
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <MText variant="bodyStrong" color="textPrimary">
            Quick actions
          </MText>
          <MText variant="caption" color="textSecondary">
            Fast edits
          </MText>
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => props.setAllTargets(5)}
          >
            <MText variant="body" color="textPrimary">
              Set all 5
            </MText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => props.setAllTargets(10)}
          >
            <MText variant="body" color="textPrimary">
              Set all 10
            </MText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={props.clearAllTargets}
          >
            <MText variant="body" color="textSecondary">
              Clear targets
            </MText>
          </TouchableOpacity>
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={props.addAllBooks}
          >
            <MText variant="body" color="textPrimary">
              Add all books
            </MText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={props.removeAllBooks}
          >
            <MText variant="body" color="danger">
              Remove all
            </MText>
          </TouchableOpacity>
        </View>
      </Card>

      {/* add book */}
      <Card
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <MText variant="bodyStrong" color="textPrimary">
            Add book
          </MText>

          <TouchableOpacity onPress={props.toggleMultiSelectOpen}>
            <MText variant="body" color="textSecondary">
              Multi select
            </MText>
          </TouchableOpacity>
        </View>

        {props.multiSelectOpen && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.multiHeader}>
              <MText variant="caption" color="textSecondary">
                Tap to select multiple books
              </MText>

              <TouchableOpacity onPress={props.closeMultiSelect}>
                <MText variant="caption" color="textSecondary">
                  Close
                </MText>
              </TouchableOpacity>
            </View>

            <View
              style={[styles.multiList, { borderColor: colors.borderSubtle }]}
            >
              <ScrollView
                style={{ maxHeight: 260 }}
                keyboardShouldPersistTaps="handled"
              >
                {props.availableBooks.map((b) => {
                  const checked = !!props.multiSelected[b.uri];
                  return (
                    <TouchableOpacity
                      key={b.uri}
                      style={styles.multiRow}
                      onPress={() => props.toggleMultiBook(b.uri)}
                    >
                      <BaseIcon
                        family="ion"
                        name={checked ? "checkbox-outline" : "square-outline"}
                        size={22}
                        color={checked ? colors.primary : colors.textSecondary}
                      />
                      <MText
                        variant="body"
                        color="textPrimary"
                        numberOfLines={1}
                        style={{ marginLeft: spacing.sm, flex: 1 }}
                      >
                        {b.name}
                      </MText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryWideBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={props.addMultiSelected}
            >
              <MText variant="body" color="textInverse">
                Add selected
              </MText>
            </TouchableOpacity>

            <View style={{ height: spacing.sm }} />
          </View>
        )}

        <View style={styles.selectRow}>
          <View style={{ flex: 1.4 }}>
            <MSelectBottomSheet
              label="Book"
              placeholder={
                props.availableBooks.length
                  ? "Select book"
                  : "All books are already in the plan"
              }
              valueId={props.selectedBookUri}
              items={props.bookItems}
              onChange={(it) => props.setSelectedBookUri(it.id)}
              searchable
              searchPlaceholder="Search book…"
              disabled={!props.availableBooks.length}
            />
          </View>

          <View style={styles.selectRight}>
            <View style={styles.pagesInputWrap}>
              <TextInput
                value={props.pagesInput}
                onChangeText={(t) =>
                  props.setPagesInput(t.replace(/[^\d]/g, ""))
                }
                keyboardType="numeric"
                placeholder="0"
                editable={!!props.selectedBookUri}
                style={[
                  styles.pagesInput,
                  {
                    borderColor: colors.borderSubtle,
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholderTextColor={colors.textSecondary}
              />
              <MText
                variant="body"
                color="textSecondary"
                style={{ marginLeft: spacing.xs }}
              >
                pages
              </MText>
            </View>

            <IconButton
              name="add-circle-outline"
              size={iconSizes.lg}
              onPress={props.addSelected}
            />
          </View>
        </View>
      </Card>

      {/* list */}
      <Card
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <MText variant="bodyStrong" color="textPrimary">
            Books in this plan
          </MText>
          <MText variant="caption" color="textSecondary">
            Drag to reorder
          </MText>
        </View>

        {planBooks.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.borderSubtle }]}>
            <MText variant="body" color="textSecondary">
              No books selected.
            </MText>
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            <DraggableFlatList
              data={planBooks}
              keyExtractor={(item) => item.uri}
              onDragEnd={({ data }) =>
                props.setOrderFromDnd(data.map((b) => b.uri))
              }
              renderItem={renderRow}
              activationDistance={8}
              scrollEnabled={false}
              nestedScrollEnabled
            />
          </View>
        )}

        {props.errors.items?.message ? (
          <MText style={{ opacity: 0.75, marginTop: spacing.xs }}>
            {String(props.errors.items.message)}
          </MText>
        ) : null}
      </Card>

      {/* footer buttons */}
      <View style={styles.footerRow}>
        {props.mode === "edit" && props.onDelete ? (
          <TouchableOpacity
            onPress={props.onDelete}
            style={[
              styles.footerBtn,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <MText variant="body" color="danger">
              Delete
            </MText>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <TouchableOpacity
          onPress={props.onSave}
          style={[
            styles.footerBtn,
            {
              backgroundColor: colors.primary,
              opacity: 1,
            },
          ]}
        >
          <MText variant="body" color="textInverse">
            Save
          </MText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  textInput: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  selectRight: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  pagesInputWrap: { flexDirection: "row", alignItems: "center" },
  pagesInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    textAlign: "center",
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  dragHandle: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowRight: { flexDirection: "row", alignItems: "center" },
  multiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  multiList: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  multiRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  primaryWideBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: 2,
  },
  footerBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
});
