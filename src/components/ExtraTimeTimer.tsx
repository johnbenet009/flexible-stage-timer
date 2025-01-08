import React from 'react';

interface ExtraTimeTimerProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
}

export function ExtraTimeTimer({ minutes, seconds, isRunning }: ExtraTimeTimerProps) {
  const totalSeconds = minutes * 60 + seconds;
  // Always start with a complete circle (progress = 0) when the timer starts
  const progress = isRunning ? (totalSeconds / (30 * 60)) : 1;

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full transform -rotate-90">
        {/* White progress circle */}
        <circle
          cx="96"
          cy="96"
          r="88"
          className="stroke-current text-white transition-all duration-1000"
          strokeWidth="16"
          fill="none"
          strokeDasharray={553}
          strokeDashoffset={553 * (1 - progress)} // Inverted progress calculation
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-white">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}