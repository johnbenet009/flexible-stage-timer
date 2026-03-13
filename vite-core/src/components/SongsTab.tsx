import React from 'react';
import { ThemeSelector } from './ThemeSelector';

interface Props {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

export const SongsTab: React.FC<Props> = ({ selectedTheme, onThemeChange }) => {
  return (
    <div className="space-y-4">
      <ThemeSelector selectedTheme={selectedTheme} onChange={onThemeChange} />
      <div className="text-gray-300">
        <p>Songs projection is coming soon.</p>
        <p>You can still pick a theme above which will be shared when the feature is ready.</p>
      </div>
    </div>
  );
};
