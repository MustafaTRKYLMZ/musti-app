// apps/mobile/components/LanguageSelector.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTranslation } from "@budget/core";
import { spacing, radii } from "@budget/ui-native";
import { FlagIcon, type LangCode } from "@/components/ui/FlagIcon";

type Props = {
  onLanguageChange?: (msg: string) => void;
};

export default function LanguageSelector({ onLanguageChange }: Props) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const currentLang: LangCode = language === "tr" ? "tr" : "en";

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: open ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [open, dropdownAnim]);

  const changeLanguage = (lng: LangCode) => {
    setLanguage(lng);
    if (onLanguageChange) {
      onLanguageChange(
        lng === "en" ? "Language changed to English" : "Dil Türkçe yapıldı"
      );
    }
    setOpen(false);
  };

  const dropdownStyle = {
    opacity: dropdownAnim,
    transform: [
      {
        scale: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.wrapper}>
      {/* MAIN BUTTON - direkt FlagIcon kullan */}
      <FlagIcon code={currentLang} size={34} onPress={toggleDropdown} />

      {/* DROPDOWN */}
      {open && (
        <Animated.View style={[styles.dropdown, dropdownStyle]}>
          {currentLang !== "en" && (
            <View style={styles.dropdownItem}>
              <FlagIcon
                code="en"
                size={30}
                onPress={() => changeLanguage("en")}
              />
            </View>
          )}

          {currentLang !== "tr" && (
            <View style={styles.dropdownItem}>
              <FlagIcon
                code="tr"
                size={30}
                onPress={() => changeLanguage("tr")}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginLeft: spacing.sm,
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: 46,
    right: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    zIndex: 20,
    minWidth: 0,
    alignItems: "center",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  dropdownItem: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.xs / 2,
  },
});
