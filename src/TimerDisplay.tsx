import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const loadInitialStates = () => {
      const storedTimerState = localStorage.getItem('timerState');
      const storedExtraTime = localStorage.getItem('extraTime');
      const storedAlertState = localStorage.getItem('alertState');
      const storedNextProgram = localStorage.getItem('nextProgram');
      const storedBackground = localStorage.getItem('background');

      if (storedTimerState) setTimerState(JSON.parse(storedTimerState));
      if (storedExtraTime) setExtraTime(JSON.parse(storedExtraTime));
      if (storedAlertState) setAlertState(JSON.parse(storedAlertState));
      if (storedNextProgram) setNextProgram(JSON.parse(storedNextProgram));
      if (storedBackground) setBackground(JSON.parse(storedBackground));
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
          setNextProgram(newValue); // Can be null
          break;
        case 'background':
          if (newValue) setBackground(newValue);
          break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {!extraTime.isRunning ? (
        <Timer
          minutes={timerState.minutes}
          seconds={timerState.seconds}
          isAttention={timerState.isAttention}
          isComplete={timerState.isComplete}
          background={background}
          fullscreen={true}
        />
      ) : (
        <div className="h-screen flex flex-col items-center justify-center">
          <h2 className="text-8xl font-bold text-white mb-12 animate-pulse">EXTRA TIME</h2>
          <div className="transform scale-150">
            <ExtraTimeTimer
              minutes={extraTime.minutes}
              seconds={extraTime.seconds}
              isRunning={extraTime.isRunning}
            />
          </div>
        </div>
      )}
      
      {nextProgram && (
        <div className="fixed top-8 right-8 scale-150 transform origin-top-right z-50">
          <NextProgramNotification programName={nextProgram} />
        </div>
      )}
      
      {(alertState.show || alertState.isFlashing) && (
        <div className="fixed bottom-0 left-0 right-0 transform scale-150 origin-bottom z-50">
          <AlertBanner 
            message={alertState.message} 
            isFlashing={alertState.isFlashing} 
          />
        </div>
      )}
    </div>
  );
}

export default TimerDisplay;