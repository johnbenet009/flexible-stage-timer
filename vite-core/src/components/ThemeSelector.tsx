import React from 'react';

export interface Theme {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
}

const themes: Theme[] = [
  { id: 'light', name: 'Light', backgroundColor: '#ffffff', textColor: '#000000' },
  { id: 'dark', name: 'Dark', backgroundColor: '#000000', textColor: '#ffffff' },
  { id: 'blue', name: 'Blue', backgroundColor: '#1e3a8a', textColor: '#ffffff' },
];

interface Props {
  selectedTheme: string;
  onChange: (themeId: string) => void;
}

export const ThemeSelector: React.FC<Props> = ({ selectedTheme, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-300">Theme:</div>
      <div className="flex flex-wrap gap-2">
        {themes.map(theme => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={`px-3 py-1 rounded border transition-shadow flex items-center space-x-2 ${
              selectedTheme === theme.id
                ? 'ring-2 ring-blue-400 shadow-lg'
                : 'hover:ring-1 hover:ring-gray-400'
            }`}
            style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
          >
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
