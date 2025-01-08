import React from 'react';

interface TimerProps {
  minutes: number;
  seconds: number;
  isAttention: boolean;
  isComplete: boolean;
  background?: {
    type: string;
    source: string | null;
  };
}

export function Timer({ minutes, seconds, isAttention, isComplete, background }: TimerProps) {
  const getBackgroundStyle = () => {
    if (!background) return {};
    
    switch (background.type) {
      case 'image':
        return {
          backgroundImage: `url(${background.source})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      case 'video':
        return {};
      case 'webcam':
        return {};
      default:
        return {};
    }
  };

  return (
    <div className="relative w-full h-48">
      {background?.type === 'video' && background.source && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
        >
          <source src={background.source} type="video/mp4" />
        </video>
      )}
      {background?.type === 'webcam' && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          id="webcam-video"
        />
      )}
      <div
        className={`
          absolute inset-0 flex items-center justify-center text-6xl font-bold transition-colors duration-300
          ${isAttention ? 'animate-[attention_0.4s_ease-in-out_5] bg-red-600 bg-opacity-90' : 'bg-black bg-opacity-80'}
          ${isComplete ? 'animate-[timerComplete_0.5s_ease-in-out_5]' : ''}
          text-white
        `}
        style={getBackgroundStyle()}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}