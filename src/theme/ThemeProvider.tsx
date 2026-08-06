import { createContext, useContext, type ReactNode } from 'react';
import { theme, type Theme } from './tokens';

// Dark-only for now. The context indirection is here so screens never import
// tokens directly — swap `theme` for a light variant later without touching them.
const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
