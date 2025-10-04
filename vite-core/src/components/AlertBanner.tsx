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
    <div className={`relative bg-red-600 overflow-hidden w-full ${isFlashing ? 'animate-flash' : ''}`}
         style={{ 
           height: fullscreen ? `${Math.max(60, 2 * scale/100 * 20)}px` : `${Math.max(40, 1.5 * scale/100 * 20)}px`
         }}>
      <div 
          className={`absolute text-white font-bold flex items-center w-full ${
            isShortMessage ? 'justify-center' : 'whitespace-nowrap animate-marquee'
          }`}
          style={{
            fontSize: fullscreen ? `${Math.max(32, 3 * scale/100 * 12)}px` : `${Math.max(18, 2 * scale/100 * 12)}px`,
            animationDuration: isShortMessage ? 'none' : `${animationDuration}s`,
            fontFamily: 'Arial, sans-serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            letterSpacing: '0.02em',
            lineHeight: '1',
            height: fullscreen ? `${Math.max(60, 2 * scale/100 * 20)}px` : `${Math.max(40, 1.5 * scale/100 * 20)}px`,
            paddingLeft: '10px',
            paddingRight: '10px'
          }}
      >
        {message}
      </div>
    </div>
  );
}