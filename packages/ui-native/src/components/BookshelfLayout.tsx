import { View } from "react-native";
import { BookshelfBackground } from "./BookshelfBackground";
import { WoodGrainOverlay } from "./WoodGrainOverlay";

import { ReactNode } from "react";

interface BookshelfLayoutProps {
  children: ReactNode;
}

export function BookshelfLayout({ children }: BookshelfLayoutProps) {
  return (
    <View style={{ flex: 1 }}>
      <BookshelfBackground />
      <WoodGrainOverlay />
      <View
        style={{ flex: 1, position: "absolute", width: "100%", height: "100%" }}
      >
        {children}
      </View>
    </View>
  );
}
