import { ThemeMode } from "../types";

type ThemePalette = {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    subtext: string;
    accent: string;
    accentSoft: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    badge: string;
    shadow: string;
  };
};

export const createTheme = (mode: ThemeMode): ThemePalette =>
  mode === "dark"
    ? {
        mode,
        colors: {
          background: "#071318",
          surface: "#102229",
          surfaceAlt: "#18343B",
          text: "#EEF7F8",
          subtext: "#A9BEC4",
          accent: "#FF6F3C",
          accentSoft: "#44271F",
          border: "#2A454D",
          success: "#7FD39B",
          warning: "#F4B45F",
          danger: "#EA7E75",
          badge: "#132B31",
          shadow: "rgba(0,0,0,0.35)",
        },
      }
    : {
        mode,
        colors: {
          background: "#FBF7EF",
          surface: "#FFFEFA",
          surfaceAlt: "#F3ECE0",
          text: "#18292D",
          subtext: "#796755",
          accent: "#F05A2A",
          accentSoft: "#FFE8D8",
          border: "#E8DCCB",
          success: "#3D9365",
          warning: "#C88735",
          danger: "#C55445",
          badge: "#122D35",
          shadow: "rgba(74, 56, 38, 0.12)",
        },
      };

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
};
