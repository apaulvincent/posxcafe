import { useState, useEffect } from 'react';

export interface AppSettings {
  logoUrl?: string;
  brandName?: string;
  requireCashierMFA?: boolean;
  colors: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  logoUrl: '',
  brandName: 'POSX',
  requireCashierMFA: false,
  colors: {
    primary: '#11572c',
    secondary: '#eaf1eb',
    tertiary: '#2a7a44',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  }
};

export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('appSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        logoUrl: parsed.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
        brandName: parsed.brandName ?? DEFAULT_SETTINGS.brandName,
        requireCashierMFA: parsed.requireCashierMFA ?? DEFAULT_SETTINGS.requireCashierMFA,
        colors: { ...DEFAULT_SETTINGS.colors, ...(parsed.colors || {}) }
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => getSettings());

  const saveSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    applyThemeColors(newSettings.colors);
    // Dispatch a custom event so other components can know
    window.dispatchEvent(new Event('settings-updated'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      setSettingsState(getSettings());
    };
    window.addEventListener('settings-updated', handleUpdate);
    return () => window.removeEventListener('settings-updated', handleUpdate);
  }, []);

  return { settings, saveSettings };
}

export function hexToHsl(hex: string): string {
  // Convert hex to RGB first
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const THEME_COLOR_VARS: Array<[keyof AppSettings['colors'], string]> = [
  ['primary', '--primary'],
  ['secondary', '--secondary'],
  ['tertiary', '--tertiary'],
  ['error', '--destructive'],
  ['warning', '--warning'],
  ['info', '--info'],
];

export function applyThemeColors(colors: AppSettings['colors']) {
  const root = document.documentElement;
  for (const [key, cssVar] of THEME_COLOR_VARS) {
    const value = colors[key];
    if (value && HEX_COLOR_RE.test(value)) {
      root.style.setProperty(cssVar, hexToHsl(value));
    }
  }
}
