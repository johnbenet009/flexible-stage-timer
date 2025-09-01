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
  isRunning?: boolean;
}

export function Timer({ minutes, seconds, isAttention, isComplete, background, fullscreen = false, isRunning = false }: TimerProps) {
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
          const constraints = {
            video: background.source ? { deviceId: { exact: background.source } } : true
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
  }, [background?.type, background?.source]);

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

  // Calculate timer color states
  const totalSeconds = minutes * 60 + seconds;
  const isLastMinute = totalSeconds <= 60 && totalSeconds > 0 && isRunning;
  const isWarningTime = totalSeconds <= 120 && totalSeconds > 60 && isRunning; // 2 minutes to 1 minute
  const isCriticalTime = totalSeconds <= 60 && totalSeconds > 0 && isRunning; // Below 1 minute
  const isFlashTime = totalSeconds <= 120 && totalSeconds > 60 && isRunning; // Flash at 2 minutes and below
  const isBackgroundFlash = totalSeconds <= 60 && totalSeconds > 0 && isRunning; // Background flash at 1 minute
  
  // Get timer color based on time remaining
  const getTimerColor = () => {
    if (!isRunning) return '#ffffff'; // White when not running
    if (isCriticalTime) return '#ef4444'; // Red
    if (isWarningTime) return '#eab308'; // Yellow
    return '#84cc16'; // Lemon/Lime green
  };

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
          ${isBackgroundFlash ? 'animate-lastMinute' : 'bg-black bg-opacity-80'}
          text-white
        `}
        style={{
          ...getBackgroundStyle(),
        }}
      >
        <div 
          className={`${isFlashTime && totalSeconds <= 120 && totalSeconds > 60 ? 'animate-pulse' : ''}`}
          style={{ 
            fontSize: getFontSize(),
            color: getTimerColor(),
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}