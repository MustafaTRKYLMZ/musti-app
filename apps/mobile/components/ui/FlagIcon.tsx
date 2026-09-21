import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { colors, MText } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native/src/components/AppIcon";
import type { LanguageCode } from "@musti/core";

export type LangCode = LanguageCode;

const FLAG_SOURCES: Partial<Record<LangCode, ImageSourcePropType>> = {
  en: require("../../assets/flags/en.png"),
  tr: require("../../assets/flags/tr.png"),
};

interface FlagIconProps {
  code: LangCode;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function FlagFallback({ code, size }: { code: LangCode; size: number }) {
  const label = code.toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surfaceElevated ?? colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MText variant="caption" style={{ fontSize: size * 0.32, fontWeight: "700" }}>
        {label}
      </MText>
    </View>
  );
}

export function FlagIcon({ code, size = 28, onPress, style }: FlagIconProps) {
  const src = FLAG_SOURCES[code];

  return (
    <IconButton
      onPress={onPress}
      style={style}
      padding={0}
      backgroundColor="transparent"
      iconNode={
        src ? (
          <Image
            source={src}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
            resizeMode="cover"
          />
        ) : (
          <FlagFallback code={code} size={size} />
        )
      }
    />
  );
}
