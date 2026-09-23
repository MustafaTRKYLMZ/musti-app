import React from "react";
import { ViewStyle, ScrollViewProps } from "react-native";
import { AppModal } from "@musti/ui-native";

type CreateModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sheetStyle?: ViewStyle;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  heightPct?: number;
};

/** @deprecated Prefer AppModal directly. Thin wrapper for legacy call sites. */
export const CreateModal = ({
  visible,
  onClose,
  title,
  headerRight,
  children,
  footer,
  sheetStyle,
  contentContainerStyle,
  heightPct = 86,
}: CreateModalProps) => {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={title}
      variant="sheet"
      heightPct={heightPct}
      headerRight={headerRight}
      footer={footer}
      contentContainerStyle={contentContainerStyle}
      cardStyle={sheetStyle}
      actions={{
        showCancel: false,
        showSave: false,
        showDelete: false,
      }}
    >
      {children}
    </AppModal>
  );
};
