"use client";

import { useEffect, useState } from "react";
import { useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme("dark");

  // The stored scheme is only known on the client, so hold the icon back until
  // after hydration rather than render one and swap it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = scheme === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setColorScheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}>
      {mounted ? (
        isDark ? (
          <Sun size={16} />
        ) : (
          <Moon size={16} />
        )
      ) : (
        <span className={styles.placeholder} />
      )}
    </button>
  );
}
