import React from 'react';

interface AlertBannerProps {
  message: string;
  isFlashing: boolean;
}

export function AlertBanner({ message, isFlashing }: AlertBannerProps) {
  if (!message) return null;

  return (
    <div 
      className={`
        w-full bg-red-600 text-white py-4 overflow-hidden
        ${isFlashing ? 'animate-[flash_0.5s_ease-in-out_5]' : ''}
      `}
    >
      <div className="whitespace-nowrap text-xl font-bold animate-[marquee_10s_linear_infinite] uppercase">
        {message}
      </div>
    </div>
  );
}