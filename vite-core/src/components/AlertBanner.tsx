import React, { useEffect, useState } from 'react';

interface AlertBannerProps {
  message: string;
  isFlashing: boolean;
  fullscreen?: boolean;
}

export function AlertBanner({ message, isFlashing, fullscreen = false }: AlertBannerProps) {
  const [scale, setScale] = useState(100);
  const [speed, setSpeed] = useState(100);

  useEffect(() => {
    const updateSettings = () => {
      const savedSizes = localStorage.getItem('displaySizes');
      if (savedSizes) {
        const sizes = JSON.parse(savedSizes);
        setScale(sizes.alert);
        setSpeed(sizes.alertSpeed || 100);
      }
    };

    updateSettings();
    window.addEventListener('storage', updateSettings);
    return () => window.removeEventListener('storage', updateSettings);
  }, []);

  if (!message) return null;

  const getAnimationDuration = () => {
    const baseSpeed = 10;
    const speedMultiplier = speed / 100;
    const messageLength = message.length;
    const lengthMultiplier = Math.max(1, messageLength / 20);
    return baseSpeed * lengthMultiplier / speedMultiplier;
  };

  const animationDuration = getAnimationDuration();
  const isShortMessage = message.length < 30;

  return (
    <div className={`relative h-20 bg-red-600 overflow-hidden w-full ${isFlashing ? 'animate-flash' : ''}`}>
      <div 
          className={`absolute text-white font-bold flex items-center h-full ${
            isShortMessage ? 'justify-center w-full' : 'whitespace-nowrap animate-marquee'
          }`}
          style={{
            fontSize: fullscreen ? `${Math.max(48, 4 * scale/100 * 16)}px` : `${Math.max(24, 2 * scale/100 * 16)}px`,
            animationDuration: isShortMessage ? 'none' : `${animationDuration}s`,
            fontFamily: 'Arial, sans-serif',
            textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
            letterSpacing: '0.03em',
            lineHeight: '1.1',
            minHeight: fullscreen ? '120px' : '80px',
            paddingLeft: '20px',
            paddingRight: '20px'
          }}
      >
        {message}
      </div>
    </div>
  );
}