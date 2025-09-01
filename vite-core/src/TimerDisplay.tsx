import React, { useEffect, useState } from 'react';
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
  const [nextProgram, setNextProgram] = useState<string | null>(null);
  const [background, setBackground] = useState({ type: 'default', source: null });
  const [showClock, setShowClock] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const loadInitialStates = () => {
      const storedTimerState = localStorage.getItem('timerState');
      const storedExtraTime = localStorage.getItem('extraTime');
      const storedAlertState = localStorage.getItem('alertState');
      const storedNextProgram = localStorage.getItem('nextProgram');
      const storedBackground = localStorage.getItem('background');
      const storedShowClock = localStorage.getItem('showClock');
      const storedCurrentTime = localStorage.getItem('currentTime');

      if (storedTimerState) setTimerState(JSON.parse(storedTimerState));
      if (storedExtraTime) setExtraTime(JSON.parse(storedExtraTime));
      if (storedAlertState) setAlertState(JSON.parse(storedAlertState));
      if (storedNextProgram) setNextProgram(JSON.parse(storedNextProgram));
      if (storedBackground) setBackground(JSON.parse(storedBackground));
      if (storedShowClock) setShowClock(JSON.parse(storedShowClock));
      if (storedCurrentTime) setCurrentTime(JSON.parse(storedCurrentTime));
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
                  fontSize: '8vw',
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
          programName={nextProgram}
          fullscreen={true}
        />
      )}
      
      {(alertState.show || alertState.isFlashing) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
          <div className="w-full overflow-hidden">
            <AlertBanner 
              message={alertState.message} 
              isFlashing={alertState.isFlashing} 
              fullscreen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TimerDisplay;