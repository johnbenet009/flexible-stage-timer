import { useEffect, useState } from 'react';

export interface ProjectionSettings {
  backgroundType: 'color' | 'image' | 'video' | 'camera';
  fontFamily: string;
  fontScale: number;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  lowercase: boolean;
  textColor: string;
  bgColor: string;
  bgImage: string;
  bgVideo: string;
  cameraDeviceId: string;
  cameraFlipHorizontal: boolean;
  cameraFlipVertical: boolean;
  bgDim: number;
  position: 'top' | 'center' | 'bottom' | 'left' | 'right';
  align: 'left' | 'center' | 'right' | 'justify';
  referenceFontScale: number;
  referenceColor: string;
  outlineSize: number;
  outlineColor: string;
  shadowColor: string;
  shadowSize: number;
  shadowDirection: number;
  referencePosition: 'top-full' | 'top-center' | 'top-left' | 'top-right' | 'bottom-full' | 'bottom-center' | 'bottom-left' | 'bottom-right';
  referenceBackground: 'none' | 'color';
  referenceBgColor: string;
  showVerseNumbers: boolean;
  showReference: boolean;
  showBookName: boolean;
  textShadow: boolean;
  lineSpacing: number;
}

export const DEFAULT_PROJECTION_SETTINGS: ProjectionSettings = {
  backgroundType: 'color',
  fontFamily: 'sans',
  fontScale: 100,
  bold: true,
  italic: false,
  uppercase: false,
  lowercase: false,
  textColor: '#ffffff',
  bgColor: '#000000',
  bgImage: '',
  bgVideo: '',
  cameraDeviceId: '',
  cameraFlipHorizontal: false,
  cameraFlipVertical: false,
  bgDim: 45,
  position: 'center',
  align: 'center',
  referenceFontScale: 100,
  referenceColor: '',
  outlineSize: 0,
  outlineColor: '#000000',
  shadowColor: '#000000',
  shadowSize: 8,
  shadowDirection: 135,
  referencePosition: 'top-center',
  referenceBackground: 'none',
  referenceBgColor: '#000000',
  showVerseNumbers: true,
  showReference: true,
  showBookName: true,
  textShadow: true,
  lineSpacing: 1.25,
};

export const PROJECTION_SETTINGS_KEY = 'bibleScreenSettings';

export function loadProjectionSettings(): ProjectionSettings {
  try {
    const raw = localStorage.getItem(PROJECTION_SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        ...DEFAULT_PROJECTION_SETTINGS,
        ...saved,
        backgroundType: saved.backgroundType || (saved.bgImage ? 'image' : 'color'),
      };
    }
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

export const FONT_STACKS: Record<string, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'Arial, Helvetica, sans-serif',
  mono: '"Courier New", Courier, monospace',
};

export const projectionFontStack = (fontFamily: string) =>
  FONT_STACKS[fontFamily] || `"${fontFamily.replace(/["\\]/g, '')}", sans-serif`;