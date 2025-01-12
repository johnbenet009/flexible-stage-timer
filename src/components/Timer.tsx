import React, { useEffect, useRef } from 'react';

interface TimerProps {
  minutes: number;
  seconds: number;
  isAttention: boolean;
  isComplete: boolean;
  background?: {
    type: string;
    source: string | null;
  };
  fullscreen?: boolean;
}

export function Timer({ minutes, seconds, isAttention, isComplete, background, fullscreen = false }: TimerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (background?.type === 'webcam') {
      const startWebcam = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing webcam:', err);
        }
      };
      startWebcam();

      return () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      };
    }
  }, [background?.type]);

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
      case 'webcam':
        return {};
      default:
        return {};
    }
  };

  const timerClasses = fullscreen
    ? 'fixed inset-0 flex items-center justify-center'
    : 'relative w-full h-48';

  const getFontSize = () => {
    const baseSize = fullscreen ? 25 : 8;
    const scaledSize = (baseSize * scale) / 100;
    return fullscreen ? `${scaledSize}vw` : `${scaledSize}rem`;
  };

  // Calculate if we're in the last minute
  const totalSeconds = minutes * 60 + seconds;
  const isLastMinute = totalSeconds <= 60 && totalSeconds > 0;

  return (
    <div className={timerClasses}>
      {background?.type === 'video' && background.source && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={background.source} type="video/mp4" />
        </video>
      )}
      {background?.type === 'webcam' && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      )}
      <div
        className={`
          absolute inset-0 flex items-center justify-center font-bold transition-colors duration-300
          ${isAttention ? 'animate-[attention_0.4s_ease-in-out_5]' : ''}
          ${isComplete ? 'animate-[timerComplete_0.5s_ease-in-out_5]' : ''}
          ${isLastMinute ? 'animate-lastMinute' : 'bg-black bg-opacity-80'}
          text-white
        `}
        style={{
          ...getBackgroundStyle(),
        }}
      >
        <div style={{ fontSize: getFontSize() }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}