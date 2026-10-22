"use client";

import { ThemeProvider } from "@emotion/react";
import { QueryClientProvider } from "@tanstack/react-query";
import EmotionRegistry from "@/lib/emotion/registry";
import { getQueryClient } from "@/lib/query/queryClient";
import { useStorageSync } from "@/lib/store";
import GlobalStyle from "@/styles/GlobalStyle";
import { theme } from "@/styles/theme";

function StorageSync() {
  useStorageSync();
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <QueryClientProvider client={getQueryClient()}>
          <StorageSync />
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </EmotionRegistry>
  );
}
