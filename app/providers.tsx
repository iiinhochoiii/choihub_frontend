"use client";

import { ThemeProvider } from "@emotion/react";
import EmotionRegistry from "@/lib/emotion/registry";
import { StoreProvider } from "@/lib/store";
import GlobalStyle from "@/styles/GlobalStyle";
import { theme } from "@/styles/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <StoreProvider>{children}</StoreProvider>
      </ThemeProvider>
    </EmotionRegistry>
  );
}
