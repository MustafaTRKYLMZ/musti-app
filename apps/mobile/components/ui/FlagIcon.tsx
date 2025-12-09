// components/ui/FlagIcon.tsx
import React from "react";
import { Image, ImageSourcePropType } from "react-native";
import { colors } from "@budget/ui-native";
import { IconButton } from "./AppIcon";

export type LangCode = "en" | "tr";

const FLAG_SOURCES: Record<LangCode, ImageSourcePropType> = {
  en: require("../../assets/flags/en.png"),
  tr: require("../../assets/flags/tr.png"),
};

interface FlagIconProps {
  code: LangCode;
  size?: number;
  onPress?: () => void;
  style?: any;
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
      }
    />
  );
}
