import { IconButton } from "@/components/ui/AppIcon";
import { InfoIcon } from "@/components/ui/InfoIcon";
import { MText, bookshelfTheme, iconSizes, spacing } from "/ui-native";
import { FC } from "react";
import { View, StyleSheet } from "react-native";

const { colors } = bookshelfTheme;
type StepperProps = {
  label: string;
  info?: { title: string; message: string };
  value: number;
  valueLabel?: string;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

export const Stepper: FC<StepperProps> = ({
  label,
  info,
  value,
  valueLabel,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
}) => {
  const shown = valueLabel ?? String(value);

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <MText style={{ fontWeight: "600" }}>{label}</MText>
          {info && <InfoIcon title={info.title} message={info.message} />}
        </View>
        <MText style={{ opacity: 0.7 }}>{shown}</MText>
      </View>

      <View style={styles.stepper}>
        <IconButton
          name="remove-outline"
          size={iconSizes.md}
          color={colors.textPrimary}
          onPress={() => onChange(Math.max(min, value - step))}
          accessibilityLabel={`Decrease ${label}`}
        />
        <IconButton
          name="add-outline"
          size={iconSizes.md}
          color={colors.textPrimary}
          onPress={() => onChange(Math.min(max, value + step))}
          accessibilityLabel={`Increase ${label}`}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
