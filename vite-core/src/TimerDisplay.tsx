import React, { useEffect, useState, useRef } from 'react';
import { Timer } from './components/Timer';
import { ExtraTimeTimer } from './components/ExtraTimeTimer';
import { AlertBanner } from './components/AlertBanner';
import { NextProgramNotification } from './components/NextProgramNotification';
import { Clock } from 'lucide-react';

function TimerDisplay() {
  const [timerState, setTimerState] = useState({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    isAttention: false,
    isComplete: false,
  });
  const [extraTime, setExtraTime] = useState({
    minutes: 0,
    seconds: 0,
    isRunning: false,
  });
  const [alertState, setAlertState] = useState({
    message: '',
    isFlashing: false,
    show: false,
  });
  const [nextProgram, setNextProgram] = useState<any>(null);
  const [background, setBackground] = useState({ type: 'default', source: null });
  const [showClock, setShowClock] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [clockScale, setClockScale] = useState(100);
  const [churchLogo, setChurchLogo] = useState<string | null>(null);
  const [textCase, setTextCase] = useState<'normal' | 'uppercase' | 'lowercase' | 'capitalize'>(() => {
    return (localStorage.getItem('textCase') as 'normal' | 'uppercase' | 'lowercase' | 'capitalize') || 'normal';
  });

  const clockIntervalRef = useRef<NodeJS.Timeout>();
  const clockTimeoutRef = useRef<NodeJS.Timeout>();

  // Text case processing function
  const getProcessedAlertMessage = (message: string) => {
    switch (textCase) {
      case 'uppercase':
        return message.toUpperCase();
      case 'lowercase':
        return message.toLowerCase();
      case 'capitalize':
        return message.replace(/\b\w/g, l => l.toUpperCase());
      default:
        return message;
    }
  };

  useEffect(() => {
    const loadInitialStates = () => {
      const storedTimerState = localStorage.getItem('timerState');
      const storedExtraTime = localStorage.getItem('extraTime');
      const storedAlertState = localStorage.getItem('alertState');
      const storedNextProgram = localStorage.getItem('nextProgram');
      const storedBackground = localStorage.getItem('background');
      const storedShowClock = localStorage.getItem('showClock');
      const storedCurrentTime = localStorage.getItem('currentTime');
      const storedDisplaySizes = localStorage.getItem('displaySizes');

      if (storedTimerState) setTimerState(JSON.parse(storedTimerState));
      if (storedExtraTime) setExtraTime(JSON.parse(storedExtraTime));
      if (storedAlertState) setAlertState(JSON.parse(storedAlertState));
      if (storedNextProgram) setNextProgram(JSON.parse(storedNextProgram));
      if (storedBackground) setBackground(JSON.parse(storedBackground));
      if (storedShowClock) setShowClock(JSON.parse(storedShowClock));
      if (storedCurrentTime) setCurrentTime(JSON.parse(storedCurrentTime));
      if (storedDisplaySizes) {
        const sizes = JSON.parse(storedDisplaySizes);
        setClockScale(sizes.clock || 100);
      }
      
      const storedLogo = localStorage.getItem('churchLogo');
      if (storedLogo) {
        setChurchLogo(storedLogo);
      }
    };

    loadInitialStates();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;

      const newValue = e.newValue ? JSON.parse(e.newValue) : null;
      
      switch (e.key) {
        case 'timerState':
          if (newValue) setTimerState(newValue);
          break;
        case 'extraTime':
          if (newValue) setExtraTime(newValue);
          break;
        case 'alertState':
          if (newValue) setAlertState(newValue);
          break;
        case 'nextProgram':
          setNextProgram(newValue);
          break;
        case 'background':
          if (newValue) setBackground(newValue);
          break;
        case 'showClock':
          if (newValue !== null) setShowClock(newValue);
          break;
        case 'currentTime':
          if (newValue) setCurrentTime(newValue);
          break;
        case 'displaySizes':
          if (newValue) {
            const sizes = JSON.parse(newValue);
            setClockScale(sizes.clock || 100);
          }
          break;
        case 'textCase':
          if (newValue) {
            setTextCase(newValue as 'normal' | 'uppercase' | 'lowercase' | 'capitalize');
          }
          break;
        case 'churchLogo':
          setChurchLogo(newValue);
          break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update clock
  useEffect(() => {
    if (showClock) {
      const updateTime = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString());
      };
      
      updateTime();
      const interval = setInterval(updateTime, 1000);
      
      return () => clearInterval(interval);
    }
  }, [showClock]);

  // Smart clock display logic - when timer is running
  useEffect(() => {
    if (showClock && timerState.isRunning) {
      const totalSeconds = timerState.minutes * 60 + timerState.seconds;
      
      if (totalSeconds < 60) {
        // Timer is in final minute - hide clock to not interfere with time-up animation
        setShowClock(false);
        return;
      }
      
      // Timer has more than 1 minute - show clock for 3 seconds then hide
      const hideTimeout = setTimeout(() => {
        setShowClock(false);
      }, 3000); // Show clock for 3 seconds
      
      return () => clearTimeout(hideTimeout);
    }
  }, [timerState.isRunning, timerState.minutes, timerState.seconds, showClock]);

  // Handle clock display when timer finishes
  useEffect(() => {
    if (timerState.isComplete && showClock) {
      // If timer finished and clock is activated, switch to clock permanently
      setShowClock(true);
      if (clockCycleIntervalRef.current) clearInterval(clockCycleIntervalRef.current);
      if (clockTimeoutRef.current) clearTimeout(clockTimeoutRef.current);
    }
  }, [timerState.isComplete, showClock]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {!extraTime.isRunning ? (
        <>
          <Timer
            minutes={timerState.minutes}
            seconds={timerState.seconds}
            isAttention={timerState.isAttention}
            isComplete={timerState.isComplete}
            background={background}
            fullscreen={true}
            isRunning={timerState.isRunning}
          />
          {showClock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-20">
              <span 
                className="font-bold text-white"
                style={{
                  fontSize: `${8 * clockScale / 100}vw`,
                  fontFamily: 'Arial, sans-serif',
                  textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}
              >
                {currentTime}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-black animate-extraTimeFlash">
          <ExtraTimeTimer
            minutes={extraTime.minutes}
            seconds={extraTime.seconds}
            isRunning={extraTime.isRunning}
            fullscreen={true}
            showAnimation={true}
          />
        </div>
      )}
      
      {nextProgram && (
        <NextProgramNotification 
          programName={typeof nextProgram === 'string' ? nextProgram : nextProgram.name}
          fullscreen={true}
          duration={typeof nextProgram === 'object' ? nextProgram.duration : 0}
        />
      )}
      
      {(alertState.show || alertState.isFlashing) && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <AlertBanner 
            message={getProcessedAlertMessage(alertState.message)}
            isFlashing={alertState.isFlashing}
            fullscreen={true}
          />
        </div>
      )}
      
      {/* Church Logo Display */}
      {churchLogo && (
        <div className="absolute top-6 left-6 z-50">
          <img 
            src={churchLogo} 
            alt="Church Logo" 
            className="max-h-20 max-w-40 object-contain opacity-90"
            style={{
              filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default TimerDisplay;