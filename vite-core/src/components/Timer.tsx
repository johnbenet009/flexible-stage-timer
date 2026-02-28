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
  const [scale, setScale] = React.useState(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    if (savedSizes) {
      const sizes = JSON.parse(savedSizes);
      return sizes.timer || 100;
    }
    return 100;
  });
  const [backgroundOpacity, setBackgroundOpacity] = React.useState(80);
  const [churchLogo, setChurchLogo] = React.useState<string | null>(null);

  useEffect(() => {
    const updateSettings = () => {
      const savedSizes = localStorage.getItem('displaySizes');
      if (savedSizes) {
        const sizes = JSON.parse(savedSizes);
        setScale(sizes.timer);
      }
      
      const savedOpacity = localStorage.getItem('backgroundOpacity');
      if (savedOpacity) {
        setBackgroundOpacity(parseInt(savedOpacity));
      }
      
      const savedLogo = localStorage.getItem('churchLogo');
      if (savedLogo) {
        setChurchLogo(savedLogo);
      }
    };

    updateSettings();
    window.addEventListener('storage', updateSettings);
    return () => window.removeEventListener('storage', updateSettings);
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
    : 'relative w-full h-48 overflow-hidden';

  const getFontSize = () => {
    const baseSize = fullscreen ? 25 : 6; // Reduced from 8 for better preview fit
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
          absolute inset-0 flex items-center justify-center font-bold 
          transition-all duration-500 ease-in-out
          ${isAttention ? 'animate-[attention_0.4s_ease-in-out_5]' : ''}
          ${isComplete ? 'animate-[timerComplete_0.5s_ease-in-out_5]' : ''}
          ${isBackgroundFlash ? 'animate-lastMinute' : ''}
          text-white pointer-events-none
        `}
        style={{
          ...getBackgroundStyle(),
          backgroundColor: isBackgroundFlash ? 'transparent' : `rgba(0, 0, 0, ${backgroundOpacity / 100})`,
        }}
      >
        <div 
          className={`
            transition-all duration-300 ease-in-out transform
            ${isFlashTime && totalSeconds <= 120 && totalSeconds > 60 ? 'animate-pulse' : ''}
            ${isAttention ? 'scale-105' : 'scale-100'}
            ${isComplete ? 'scale-110' : ''}
          `}
          style={{ 
            fontSize: getFontSize(),
            color: getTimerColor(),
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      
      {/* Church Logo Display */}
      {churchLogo && (
        <div className="absolute top-4 left-4 z-10">
          <img 
            src={churchLogo} 
            alt="Church Logo" 
            className="max-h-16 max-w-32 object-contain opacity-90"
            style={{
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
            }}
          />
        </div>
      )}
    </div>
  );
}