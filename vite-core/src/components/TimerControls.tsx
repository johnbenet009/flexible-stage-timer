import React from 'react';
import { Plus, Minus, RefreshCw, Play } from 'lucide-react';

interface TimerControlsProps {
  onAdjustTime: (minutes: number) => void;
  onAdjustSeconds?: (seconds: number) => void;
  onReset: () => void;
  onStart?: () => void;
  showStartButton?: boolean;
}

export function TimerControls({ onAdjustTime, onAdjustSeconds, onReset, onStart, showStartButton }: TimerControlsProps) {
  const timeButtons = [
    { value: 1, label: '+1' },
    { value: -1, label: '-1' },
    { value: 5, label: '+5' },
    { value: -5, label: '-5' },
    { value: 10, label: '+10' },
    { value: -10, label: '-10' },
    { value: 30, label: '+30' },
    { value: -30, label: '-30' },
  ];

  const secondsButtons = [
    { value: 5, label: '+5s' },
    { value: -5, label: '-5s' },
    { value: 10, label: '+10s' },
    { value: -10, label: '-10s' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {timeButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => onAdjustTime(btn.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {btn.label}
          </button>
        ))}
      </div>
      {onAdjustSeconds && (
        <div className="grid grid-cols-4 gap-2">
          {secondsButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => onAdjustSeconds(btn.value)}
              className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex space-x-2">
        {showStartButton && onStart && (
          <button
            onClick={onStart}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
          >
            <Play className="inline-block mr-2" size={18} />
            Start
          </button>
        )}
        <button
          onClick={onReset}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
        >
          <RefreshCw className="inline-block mr-2" size={18} />
          Reset
        </button>
      </div>
    </div>
  );
}