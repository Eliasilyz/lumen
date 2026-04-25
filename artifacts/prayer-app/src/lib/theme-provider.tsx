import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, useUpdatePreferences } from "@workspace/api-client-react";

type Theme = "dark" | "light" | "system";
type FontScale = "sm" | "md" | "lg" | "xl";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultFontScale?: FontScale;
  storageKey?: string;
  fontScaleStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  fontScale: FontScale;
  setTheme: (theme: Theme) => void;
  setFontScale: (scale: FontScale) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  fontScale: "md",
  setTheme: () => null,
  setFontScale: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultFontScale = "md",
  storageKey = "vite-ui-theme",
  fontScaleStorageKey = "vite-ui-font-scale",
  ...props
}: ThemeProviderProps) {
  const { data: me } = useGetMe();
  const updatePrefs = useUpdatePreferences();

  const [theme, setThemeState] = useState<Theme>(() => {
    if (me?.preferences?.theme) return me.preferences.theme as Theme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    if (me?.preferences?.fontScale) return me.preferences.fontScale as FontScale;
    return (localStorage.getItem(fontScaleStorageKey) as FontScale) || defaultFontScale;
  });

  useEffect(() => {
    if (me?.preferences?.theme && me.preferences.theme !== theme) {
      setThemeState(me.preferences.theme as Theme);
    }
    if (me?.preferences?.fontScale && me.preferences.fontScale !== fontScale) {
      setFontScaleState(me.preferences.fontScale as FontScale);
    }
  }, [me?.preferences?.theme, me?.preferences?.fontScale]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    // Set Font Scale on root for prose usage if needed, or specific CSS variables
    root.setAttribute("data-font-scale", fontScale);

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, fontScale]);

  const setTheme = (theme: Theme) => {
    localStorage.setItem(storageKey, theme);
    setThemeState(theme);
    if (me) {
      updatePrefs.mutate({ data: { theme } });
    }
  };

  const setFontScale = (scale: FontScale) => {
    localStorage.setItem(fontScaleStorageKey, scale);
    setFontScaleState(scale);
    if (me) {
      updatePrefs.mutate({ data: { fontScale: scale } });
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, setTheme, fontScale, setFontScale }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
