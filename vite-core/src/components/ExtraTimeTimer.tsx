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
  const [scale, setScale] = React.useState(100);

  useEffect(() => {
    const updateScale = () => {
      const savedSizes = localStorage.getItem('displaySizes');
      if (savedSizes) {
        const sizes = JSON.parse(savedSizes);
        setScale(sizes.timer);
      }
    };

    updateScale();
    window.addEventListener('storage', updateScale);
    return () => window.removeEventListener('storage', updateScale);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && showAnimation) {
      interval = setInterval(() => {
        setMilliseconds(prev => (prev + 1) % 60);
      }, 16);
    }
    return () => clearInterval(interval);
  }, [isRunning, showAnimation]);

  const getFontSize = () => {
    const baseSize = fullscreen ? 20 : 5;
    const scaledSize = (baseSize * scale) / 100;
    return fullscreen ? `${scaledSize}vw` : `${scaledSize}rem`;
  };

  const getMsFontSize = () => {
    const baseSize = fullscreen ? 8 : 2;
    const scaledSize = (baseSize * scale) / 100;
    return fullscreen ? `${scaledSize}vw` : `${scaledSize}rem`;
  };

  const containerClasses = showAnimation 
    ? 'w-full h-full flex flex-col items-center justify-center'
    : 'w-full h-full flex flex-col items-center justify-center bg-black text-white';

  const titleAnimationClass = showAnimation ? 'animate-extraTimeText' : '';
  
  // Check if timer is less than 1 minute for rapid zoom effect
  const totalSeconds = minutes * 60 + seconds;
  const isLessThanMinute = totalSeconds < 60 && totalSeconds > 0;

  return (
    <div className={containerClasses}>
      {!hideTitle && (
        <div className={`font-bold text-white text-7xl font-bold font-mono tracking-tight`}>
          EXTRA TIME
        </div>
      )}
      <div 
        className={`
          font-bold text-white font-mono tracking-tight 
          transition-all duration-500 ease-in-out transform
          ${isLessThanMinute ? 'animate-pulse scale-110' : 'scale-100'}
        `}
        style={{
          fontSize: getFontSize(),
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        {showAnimation && (
          <span 
            style={{
              fontSize: getMsFontSize()
            }}
          >
            .{String(milliseconds).padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  );
}