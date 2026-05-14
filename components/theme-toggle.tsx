"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="relative border border-transparent bg-background/20 text-foreground hover:border-border hover:bg-background/55"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunMedium className="size-4 scale-100 opacity-100 transition-all dark:scale-75 dark:opacity-0" />
      <MoonStar className="absolute size-4 scale-75 opacity-0 transition-all dark:scale-100 dark:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
