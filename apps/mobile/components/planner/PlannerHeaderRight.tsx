import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { spacing } from "@musti/ui-native";
import { AppSwitcherButton } from "../AppSwitcherButton";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";

type Props = {
  onSearch?: () => void;
};

export const PlannerHeaderRight = ({ onSearch }: Props) => {
  const { t } = useTranslation();
  return (
    <View style={styles.hRightWrap}>
      {onSearch ? (
        <HeaderIconButton
          icon="search-outline"
          accessibilityLabel={t("planner.header.search")}
          onPress={onSearch}
        />
      ) : null}

      <AppSwitcherButton />
    </View>
  );
};

const styles = StyleSheet.create({
  hRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "flex-end",
    paddingLeft: spacing.sm,
  },
});
