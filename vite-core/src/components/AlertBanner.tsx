import React, { useEffect, useState } from 'react';

interface AlertBannerProps {
  message: string;
  isFlashing: boolean;
}

export function AlertBanner({ message, isFlashing }: AlertBannerProps) {
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

  return (
    <div 
      className={`w-full bg-red-600 text-white py-4 overflow-hidden ${isFlashing ? 'animate-flash' : ''}`}
    >
      <div 
        className="whitespace-nowrap font-bold uppercase animate-marquee"
        style={{
          fontSize: `${2 * scale/100}rem`,
          animationDuration: `${getAnimationDuration()}s`,
          width: 'fit-content',
          transform: `scale(${scale/100})`,
          transformOrigin: 'left center',
        }}
      >
        {message}
      </div>
    </div>
  );
}