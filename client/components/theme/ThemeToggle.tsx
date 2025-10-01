import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "linguasphere-theme";

const getInitialDarkMode = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored === "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const root = window.document.documentElement;
    root.classList.toggle("dark", isDark);
    window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsDark(media.matches);
      }
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative h-11 w-11 rounded-full border-border/70 bg-background/80 text-foreground shadow-sm transition hover:border-border hover:shadow-md"
    >
      <Sun
        className={cn(
          "absolute h-5 w-5 rotate-0 scale-100 transition-all",
          isDark && "-rotate-90 scale-0 opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-5 w-5 rotate-90 scale-0 opacity-0 transition-all",
          isDark && "rotate-0 scale-100 opacity-100",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
