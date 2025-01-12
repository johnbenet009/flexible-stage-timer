import React, { useState, useEffect } from 'react';

interface ExtraTimeTimerProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  fullscreen?: boolean;
  showAnimation?: boolean;
  hideTitle?: boolean;
}

export function ExtraTimeTimer({ 
  minutes, 
  seconds, 
  isRunning, 
  fullscreen = false,
  showAnimation = true,
  hideTitle = false
}: ExtraTimeTimerProps) {
  const [milliseconds, setMilliseconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && showAnimation) {
      interval = setInterval(() => {
        setMilliseconds(prev => (prev + 1) % 60);
      }, 16);
    }
    return () => clearInterval(interval);
  }, [isRunning, showAnimation]);

  const timeClasses = fullscreen ? 'text-[20vw]' : 'text-5xl';
  const msClasses = fullscreen ? 'text-[8vw]' : 'text-2xl';

  const containerClasses = showAnimation 
    ? 'w-full h-full flex flex-col items-center justify-center'
    : 'w-full h-full flex flex-col items-center justify-center bg-black text-white';

  const titleAnimationClass = showAnimation ? 'animate-extraTimeText' : '';

  return (
    <div className={containerClasses}>
      {!hideTitle && (
        <div className={`font-bold text-white text-7xl font-bold font-mono tracking-tight`}>
          EXTRA TIME
        </div>
      )}
      <div className={`${timeClasses} font-bold text-white font-mono tracking-tight`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        {showAnimation && (
          <span className={`${msClasses}`}>.{String(milliseconds).padStart(2, '0')}</span>
        )}
      </div>
    </div>
  );
}