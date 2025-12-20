import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { iconSizes } from "@budget/ui-native";

// Ensure the correct path to the ComingSoon component
import { ComingSoon } from "../../components/ui/ComingSoon";
import { IconButton } from "@/components/ui/AppIcon";

export default function ComingSoonScreen() {
  const handleBack = () => {
    router.replace("/(tabs)/budget");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <IconButton
          name="chevron-back"
          size={iconSizes.md}
          color={"white"}
          onPress={handleBack}
        />

        <Text style={styles.headerTitle}>Coming soon</Text>
        {/* Spacer to balance layout */}
        <View style={{ width: 32 }} />
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <ComingSoon />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#020819",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    flex: 1,
  },
});
