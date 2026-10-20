import React, { useEffect, useState, useRef } from 'react';
import { Timer } from './components/Timer';
import { ExtraTimeTimer } from './components/ExtraTimeTimer';
import { AlertBanner } from './components/AlertBanner';
import { NextProgramNotification } from './components/NextProgramNotification';

function TimerDisplay() {
  const [timerState, setTimerState] = useState({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    isAttention: false,
    isComplete: false,
    programName: '',
  });
  const [timerDeadline, setTimerDeadline] = useState<number | null>(() => {
    const s = localStorage.getItem('timerDeadline');
    return s ? Number(s) : null;
  });
  const deadlineRef = useRef<number | null>(null);
  useEffect(() => {
    deadlineRef.current = timerDeadline;
  }, [timerDeadline]);
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
  const [nextProgram, setNextProgram] = useState<string | { name: string; duration: number } | null>(null);
  const [autoTimerDisplay, setAutoTimerDisplay] = useState<{ enabled: boolean; nextProgramName: string; deadline: number | null }>(() => {
    try {
      return JSON.parse(localStorage.getItem('autoTimerDisplay') || '{"enabled":false,"nextProgramName":"","deadline":null}');
    } catch {
      return { enabled: false, nextProgramName: '', deadline: null };
    }
  });
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  const [handoffFadeUntil, setHandoffFadeUntil] = useState<number | null>(null);
  const [background, setBackground] = useState({ type: 'default', source: null });
  const [showClock, setShowClock] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [clockScale, setClockScale] = useState(100);
  const [programNameScale, setProgramNameScale] = useState(100);
  const [showProgramName, setShowProgramName] = useState(true);
  const [churchLogo, setChurchLogo] = useState<string | null>(null);
  const [textCase, setTextCase] = useState<'normal' | 'uppercase' | 'lowercase' | 'capitalize'>(() => {
    return (localStorage.getItem('textCase') as 'normal' | 'uppercase' | 'lowercase' | 'capitalize') || 'normal';
  });

  // Clock update refs removed - time updates are now handled by App.tsx

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
      const storedDeadline = localStorage.getItem('timerDeadline');
      const storedAutoTimerDisplay = localStorage.getItem('autoTimerDisplay');

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
        setProgramNameScale(sizes.programName || 100);
        setShowProgramName(sizes.showProgramName !== undefined ? sizes.showProgramName : true);
      }
      if (storedDeadline) setTimerDeadline(Number(storedDeadline));
      if (storedAutoTimerDisplay) setAutoTimerDisplay(JSON.parse(storedAutoTimerDisplay));
      
      const storedLogo = localStorage.getItem('churchLogo');
      if (storedLogo) {
        setChurchLogo(storedLogo);
      }
    };

    loadInitialStates();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) {
        // Handle generic storage event by reloading all states
        loadInitialStates();
        return;
      }

      let newValue;
      try {
        newValue = e.newValue ? JSON.parse(e.newValue) : null;
      } catch {
        // If it's not JSON, use the raw value (for strings like churchLogo if they are not JSON)
        newValue = e.newValue;
      }
      
      switch (e.key) {
        case 'timerState':
          if (newValue) setTimerState(newValue);
          break;
        case 'timerDeadline':
          setTimerDeadline(newValue ? Number(newValue) : null);
          break;
        case 'autoTimerDisplay':
          if (newValue) {
            if (autoTimerDisplay.deadline && !newValue.deadline && newValue.enabled) {
              setHandoffFadeUntil(Date.now() + 900);
            }
            setAutoTimerDisplay(newValue);
          }
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
          if (newValue !== null) {
            // Ensure newValue is boolean if it was stringified
            setShowClock(typeof newValue === 'string' ? JSON.parse(newValue) : newValue);
          }
          break;
        case 'currentTime':
          if (newValue) setCurrentTime(newValue);
          break;
        case 'displaySizes':
          if (newValue) {
            // newValue is already parsed by the try-catch block above
            setClockScale(newValue.clock || 100);
            setProgramNameScale(newValue.programName || 100);
            setShowProgramName(newValue.showProgramName !== undefined ? newValue.showProgramName : true);
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
  }, [autoTimerDisplay.deadline]);

  useEffect(() => {
    if ((!autoTimerDisplay.enabled || !autoTimerDisplay.deadline) && !handoffFadeUntil) return;
    const interval = setInterval(() => setCurrentTimestamp(Date.now()), 250);
    const fadeTimeout = handoffFadeUntil
      ? setTimeout(() => setHandoffFadeUntil(null), Math.max(0, handoffFadeUntil - Date.now()))
      : null;
    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [autoTimerDisplay.enabled, autoTimerDisplay.deadline, handoffFadeUntil]);

  // REMOVED: Conflicting clock update effect
  // The main App.tsx effect handles time updates with consistent 24-hour format

  // Deadline-based ticking to avoid background freezes
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timerState.isRunning && !timerState.isPaused && deadlineRef.current) {
      const tick = () => {
        const now = Date.now();
        const deadline = deadlineRef.current!;
        const remainingMs = Math.max(0, deadline - now);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        setTimerState(prev => ({
          ...prev,
          minutes: mins,
          seconds: secs,
          isComplete: remainingSec <= 0 ? true : prev.isComplete,
        }));
      };
      tick();
      interval = setInterval(tick, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.isPaused, timerDeadline]);

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

  // Clock display automatically shows time when showClock is true
  // with consistent 24-hour format

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {(autoTimerDisplay.enabled && autoTimerDisplay.deadline && currentTimestamp < autoTimerDisplay.deadline + 900) || (handoffFadeUntil !== null && currentTimestamp < handoffFadeUntil) ? (
        <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-black px-6 pb-28 pt-12 text-center text-white sm:px-10 ${handoffFadeUntil ? 'animate-handoff-out' : 'animate-handoff-in'}`}>
          <div className="w-full max-w-[94vw] animate-next-program-enter">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-300 sm:text-xl">Next Program</p>
            <h1 className="mt-6 break-words font-black leading-[0.92] text-white" style={{ fontSize: 'clamp(5rem, 14vw, 12rem)' }}>{autoTimerDisplay.nextProgramName}</h1>
            <p className="mt-7 text-xl font-semibold text-white/80 sm:text-3xl">{currentTimestamp >= (autoTimerDisplay.deadline || 0) ? 'Starting now' : 'Starts in'}</p>
            <p className="mt-1 font-black tabular-nums text-amber-300" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}>
              {Math.max(0, Math.ceil(((autoTimerDisplay.deadline || currentTimestamp) - currentTimestamp) / 1000))} <span className="text-xl font-bold text-white/60 sm:text-3xl">seconds</span>
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center gap-1 text-white/60 sm:bottom-8 sm:flex-row sm:gap-3">
            <span className="text-xs font-bold uppercase tracking-widest sm:text-sm">Previous program ended</span>
            <span className="font-mono text-3xl font-black text-white/80 sm:text-5xl">00:00</span>
          </div>
        </div>
      ) : !extraTime.isRunning ? (
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
          {showProgramName && timerState.programName && (
            <div 
              className="absolute top-10 left-0 right-0 text-center z-10 pointer-events-none"
              style={{
                fontSize: `${3 * programNameScale / 100}vw`,
                color: 'rgba(255, 255, 255, 0.8)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              Now: {timerState.programName}
            </div>
          )}
          {showClock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-20 [container-type:size]">
              <span 
                className="font-bold text-white"
                style={{
                  fontSize: `min(${Math.min(8 * clockScale / 100, 96 / Math.max(1, currentTime.length * 0.62))}cqw, 32cqh)`,
                  whiteSpace: 'nowrap',
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
