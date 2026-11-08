import { useEffect, useState } from 'react';

export interface ProjectionSettings {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontScale: number;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  textColor: string;
  bgColor: string;
  bgImage: string;
  bgDim: number;
  position: 'top' | 'center' | 'bottom';
  align: 'left' | 'center';
  showVerseNumbers: boolean;
  showReference: boolean;
  textShadow: boolean;
  lineSpacing: number;
}

export const DEFAULT_PROJECTION_SETTINGS: ProjectionSettings = {
  fontFamily: 'sans',
  fontScale: 100,
  bold: true,
  italic: false,
  uppercase: false,
  textColor: '#ffffff',
  bgColor: '#000000',
  bgImage: '',
  bgDim: 45,
  position: 'center',
  align: 'center',
  showVerseNumbers: true,
  showReference: true,
  textShadow: true,
  lineSpacing: 1.25,
};

export const PROJECTION_SETTINGS_KEY = 'bibleScreenSettings';

export function loadProjectionSettings(): ProjectionSettings {
  try {
    const raw = localStorage.getItem(PROJECTION_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_PROJECTION_SETTINGS, ...JSON.parse(raw) };
  } catch { /* corrupt settings */ }
  return DEFAULT_PROJECTION_SETTINGS;
}

export function saveProjectionSettings(settings: ProjectionSettings) {
  localStorage.setItem(PROJECTION_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new StorageEvent('storage', { key: PROJECTION_SETTINGS_KEY, newValue: JSON.stringify(settings) }));
}

export function useProjectionSettings(): [ProjectionSettings, (patch: Partial<ProjectionSettings>) => void] {
  const [settings, setSettings] = useState<ProjectionSettings>(loadProjectionSettings);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROJECTION_SETTINGS_KEY || e.key === null) setSettings(loadProjectionSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = (patch: Partial<ProjectionSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveProjectionSettings(next);
      return next;
    });
  };

  return [settings, update];
}

export const FONT_STACKS: Record<ProjectionSettings['fontFamily'], string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'Arial, Helvetica, sans-serif',
  mono: '"Courier New", Courier, monospace',
};