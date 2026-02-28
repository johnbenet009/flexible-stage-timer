import React, { useEffect, useState } from 'react';
import { OverlaySettings } from './types';
import { User } from 'lucide-react';

function GreenScreenTimer() {
  const [timerState, setTimerState] = useState({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    isAttention: false,
    isComplete: false,
  });
  const [currentTime, setCurrentTime] = useState('');
  const [settings, setSettings] = useState<OverlaySettings>({
    timer: 100,
    x: 50,
    y: 92,
    bgColor: '#00ff00',
    mode: 'timer',
    show: true,
    lowerThirdTitle: '',
    lowerThirdSubtitle: '',
    lowerThirdDate: '',
    lowerThirdTheme: 'dark',
    lowerThirdTitleSize: 14,
    lowerThirdSubtitleSize: 48,
    lowerThirdDateSize: 20,
    lowerThirdFont: 'JetBrains Mono',
    lowerThirdDisplaySeconds: 10,
    lowerThirdSleepSeconds: 5,
    timerFontSize: 10,
    clockFontSize: 10,
    isLive: false,
  });

  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (settings.mode !== 'lowerThird' || settings.lowerThirdSleepSeconds === 0) {
      setIsSleeping(false);
      setIsAnimatingOut(false);
      return;
    }

    const displayMs = settings.lowerThirdDisplaySeconds * 1000;
    const sleepMs = settings.lowerThirdSleepSeconds * 1000;

    const cycle = async () => {
      // Wait for display time
      await new Promise(resolve => setTimeout(resolve, displayMs));
      
      // Start animate out
      setIsAnimatingOut(true);
      await new Promise(resolve => setTimeout(resolve, 600)); // Match animation duration
      
      // Set sleeping
      setIsSleeping(true);
      setIsAnimatingOut(false);
      
      // Wait for sleep time
      await new Promise(resolve => setTimeout(resolve, sleepMs));
      
      // Show again
      setIsSleeping(false);
    };

    const interval = setInterval(() => {
      if (!isSleeping && !isAnimatingOut) {
        cycle();
      }
    }, (settings.lowerThirdDisplaySeconds + settings.lowerThirdSleepSeconds) * 1000);

    // Initial run
    cycle();

    return () => clearInterval(interval);
  }, [settings.mode, settings.lowerThirdDisplaySeconds, settings.lowerThirdSleepSeconds]);

  useEffect(() => {
    const loadInitialStates = () => {
      try {
        const storedTimerState = localStorage.getItem('greenScreenTimerState');
        const storedDisplaySizes = localStorage.getItem('displaySizes');

        if (storedTimerState) setTimerState(JSON.parse(storedTimerState));
        if (storedDisplaySizes) {
          const sizes = JSON.parse(storedDisplaySizes);
          const overlay = sizes.overlay || {};
          setSettings(prev => ({
            ...prev,
            ...overlay
          }));
        }
      } catch (err) {
        console.error('Error loading initial states:', err);
      }
    };

    loadInitialStates();
    
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (!e.key) {
          loadInitialStates();
          return;
        }

        let newValue;
        try {
          newValue = e.newValue ? JSON.parse(e.newValue) : null;
        } catch (err) {
          newValue = e.newValue;
        }
        
        switch (e.key) {
          case 'greenScreenTimerState':
            if (newValue) setTimerState(newValue);
            break;
          case 'displaySizes':
            if (newValue && newValue.overlay) {
              setSettings(prev => ({
                ...prev,
                ...newValue.overlay
              }));
            }
            break;
        }
      } catch (err) {
        console.error('Error handling storage change:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!settings.show) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white font-bold">
        Broadcast Overlay Hidden (Check Settings)
      </div>
    );
  }

  if (isSleeping && !isAnimatingOut) return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: settings.bgColor }}
    />
  );
  
  // Hide timer/clock when it reaches 00:00 (for timer mode)
  if (settings.mode === 'timer' && timerState.minutes === 0 && timerState.seconds === 0 && timerState.isRunning) {
    return (
      <div 
        className="fixed inset-0 overflow-hidden"
        style={{ backgroundColor: settings.bgColor }}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: settings.bgColor }}
    >
      {/* Background Grid for VMix-like feel */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {settings.mode === 'lowerThird' ? (
        /* Lower Third Display */
        <div 
          className={`absolute transition-all duration-700 ease-out ${isAnimatingOut ? 'animate-slide-out-bottom' : 'animate-slide-in-bottom'}`}
          style={{ 
            left: `${settings.x}%`,
            top: `${settings.y}%`,
            transform: `translate(-50%, -50%) scale(${settings.timer / 100})`,
            transformOrigin: 'center center'
          }}
        >
          <div className={`
            flex items-center space-x-6 p-1 rounded-2xl shadow-2xl border-l-[12px] border-blue-600
            ${settings.lowerThirdTheme === 'light' ? 'bg-white text-black' : 'bg-black text-white'}
          `}>
            {/* Logo/Image Area */}
            <div className="w-24 h-24 bg-blue-600/10 rounded-xl flex items-center justify-center overflow-hidden border border-blue-600/20">
              {settings.lowerThirdImage ? (
                <img src={settings.lowerThirdImage} alt="Minister" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="opacity-40" />
              )}
            </div>

            <div className="pr-12 py-4">
              <div 
                className="font-black uppercase tracking-[0.3em] opacity-60 mb-1"
                style={{ fontSize: `${settings.lowerThirdTitleSize}px` }}
              >
                {settings.lowerThirdTitle}
              </div>
              <div 
                className="font-black tracking-tight leading-none mb-2"
                style={{ fontSize: `${settings.lowerThirdSubtitleSize}px` }}
              >
                {settings.lowerThirdSubtitle}
              </div>
              <div 
                className="font-bold opacity-80 border-t border-current/10 pt-2 inline-block uppercase tracking-wider"
                style={{ fontSize: `${settings.lowerThirdDateSize}px` }}
              >
                {settings.lowerThirdDate}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Timer/Clock Display */
        <div 
          className={`absolute transition-all duration-500 ease-out ${settings.mode === 'timer' && timerState.minutes === 0 && timerState.isRunning && !timerState.isPaused ? 'animate-flash-zoom' : ''}`}
          style={{
            left: `${settings.x}%`,
            top: `${settings.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${(settings.mode === 'timer' ? settings.timerFontSize : settings.clockFontSize) * settings.timer / 100}vw`,
            fontWeight: 800,
            color: 'white',
            textShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}
        >
          <div className="relative group">
            {settings.mode === 'timer' ? (
              <div className="flex items-center">
                <span className="tabular-nums">
                  {String(timerState.minutes).padStart(2, '0')}:{String(timerState.seconds).padStart(2, '0')}
                </span>
              </div>
            ) : (
              <span className="tabular-nums">{currentTime}</span>
            )}
            
            {/* Subtle Glow Effect */}
            <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

export default GreenScreenTimer;
