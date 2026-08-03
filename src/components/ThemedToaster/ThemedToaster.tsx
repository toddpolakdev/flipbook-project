"use client";

import { useComputedColorScheme } from "@mantine/core";
import { Toaster } from "sonner";

/** Keeps sonner's toast chrome in step with the app's theme toggle. */
export default function ThemedToaster() {
  const scheme = useComputedColorScheme("dark");

  return (
    <Toaster
      position="top-right"
      theme={scheme}
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: "var(--radius)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
