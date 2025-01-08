import React, { useState, useEffect, useRef } from 'react';
import { Timer } from './components/Timer';
import { TimerControls } from './components/TimerControls';
import { AlertBanner } from './components/AlertBanner';
import { ProgramList } from './components/ProgramList';
import { ExtraTimeTimer } from './components/ExtraTimeTimer';
import { Program, TimerState, ExtraTimeState } from './types';
import { Play, Pause, RefreshCw, AlertTriangle, Clock, Image, Settings, Bell, Plus, Minus } from 'lucide-react';
import { DisplaySettings } from './components/DisplaySettings';
import { NextProgramNotification } from './components/NextProgramNotification';
import { DeleteConfirmation } from './components/DeleteConfirmation';

function App() {
  const [setupTimer, setSetupTimer] = useState<TimerState>({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    isAttention: false,
  });

  const [liveTimer, setLiveTimer] = useState<TimerState>({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    isAttention: false,
  });

  const [extraTime, setExtraTime] = useState<ExtraTimeState>({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    isPaused: false,
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertFlashing, setIsAlertFlashing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showNextProgram, setShowNextProgram] = useState<string | null>(null);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDuration, setProgramDuration] = useState(0);
  const [background, setBackground] = useState<{ type: string; source: string | null }>({
    type: 'default',
    source: null
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    programId: string;
    programName: string;
  }>({
    isOpen: false,
    programId: '',
    programName: '',
  });

  const clockTimeoutRef = useRef<NodeJS.Timeout>();

  const handleBackgroundChange = (type: string, source: string | null) => {
    setBackground({ type, source });
    if (type === 'webcam' && !source) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          const video = document.getElementById('webcam-video') as HTMLVideoElement;
          if (video) {
            video.srcObject = stream;
          }
        })
        .catch(err => console.error('Error:', err));
    }
  };

  const handleProgramDelete = (id: string) => {
    const program = programs.find(p => p.id === id);
    if (program) {
      setDeleteConfirmation({
        isOpen: true,
        programId: id,
        programName: program.name,
      });
    }
  };

  const confirmDelete = () => {
    setPrograms(prev => prev.filter(p => p.id !== deleteConfirmation.programId));
    setDeleteConfirmation({
      isOpen: false,
      programId: '',
      programName: '',
    });
  };

  const handleSetupTimerAdjust = (minutes: number) => {
    setSetupTimer(prev => ({
      ...prev,
      minutes: Math.max(0, prev.minutes + minutes),
    }));
  };

  const adjustProgramDuration = (minutes: number) => {
    setProgramDuration(prev => Math.max(0, prev + minutes));
  };

  const addProgram = () => {
    if (programName && programDuration > 0) {
      setPrograms(prev => [...prev, {
        id: Date.now().toString(),
        name: programName,
        duration: programDuration,
      }]);
      setProgramName('');
      setProgramDuration(0);
    }
  };

  const startLiveTimer = () => {
    setLiveTimer({
      ...setupTimer,
      isRunning: true,
      isPaused: false,
    });
    setExtraTime(prev => ({ ...prev, isRunning: false }));
  };

  const pauseLiveTimer = () => {
    setLiveTimer(prev => ({ ...prev, isPaused: true }));
  };

  const resumeLiveTimer = () => {
    setLiveTimer(prev => ({ ...prev, isPaused: false }));
  };

  const resetLiveTimer = () => {
    setLiveTimer({
      minutes: 0,
      seconds: 0,
      isRunning: false,
      isPaused: false,
      isAttention: false,
    });
  };

  const toggleAttention = () => {
    setLiveTimer(prev => ({ ...prev, isAttention: !prev.isAttention }));
    if (!liveTimer.isAttention) {
      setTimeout(() => {
        setLiveTimer(prev => ({ ...prev, isAttention: false }));
      }, 2000);
    }
  };

  const startExtraTime = () => {
    if (!liveTimer.isRunning || (liveTimer.minutes === 0 && liveTimer.seconds === 0)) {
      setExtraTime(prev => ({ ...prev, isRunning: true, isPaused: false }));
      setLiveTimer({
        minutes: 0,
        seconds: 0,
        isRunning: false,
        isPaused: false,
        isAttention: false,
      });
    }
  };

  const stopExtraTime = () => {
    setExtraTime(prev => ({ ...prev, isRunning: false }));
  };

  const startProgram = (program: Program) => {
    setLiveTimer({
      minutes: program.duration,
      seconds: 0,
      isRunning: true,
      isPaused: false,
      isAttention: false,
    });
    setExtraTime(prev => ({ ...prev, isRunning: false }));
  };

  useEffect(() => {
    if (showClock) {
      const updateTime = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString());
      };
      updateTime();
      clockTimeoutRef.current = setTimeout(() => {
        setShowClock(false);
        setCurrentTime('');
      }, 3000);
    }
    return () => {
      if (clockTimeoutRef.current) {
        clearTimeout(clockTimeoutRef.current);
      }
    };
  }, [showClock]);

  useEffect(() => {
    if (liveTimer.isRunning && liveTimer.minutes === 0 && liveTimer.seconds === 0) {
      setIsTimerComplete(true);
      setTimeout(() => setIsTimerComplete(false), 2500);
    }
  }, [liveTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (liveTimer.isRunning && !liveTimer.isPaused) {
      interval = setInterval(() => {
        setLiveTimer(prev => {
          if (prev.seconds === 0 && prev.minutes === 0) {
            return { ...prev, isRunning: false };
          }

          let newSeconds = prev.seconds - 1;
          let newMinutes = prev.minutes;

          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes--;
          }

          return {
            ...prev,
            minutes: newMinutes,
            seconds: newSeconds,
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [liveTimer.isRunning, liveTimer.isPaused]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (extraTime.isRunning && !extraTime.isPaused) {
      interval = setInterval(() => {
        setExtraTime(prev => {
          if (prev.seconds === 0 && prev.minutes === 0) {
            return { ...prev, isRunning: false };
          }

          let newSeconds = prev.seconds - 1;
          let newMinutes = prev.minutes;

          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes--;
          }

          return {
            ...prev,
            minutes: newMinutes,
            seconds: newSeconds,
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [extraTime.isRunning, extraTime.isPaused]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Setup Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Setup</h2>
            <Timer
              minutes={setupTimer.minutes}
              seconds={setupTimer.seconds}
              isAttention={false}
              isComplete={false}
            />
            <TimerControls
              onAdjustTime={handleSetupTimerAdjust}
              onReset={() => setSetupTimer(prev => ({ ...prev, minutes: 0, seconds: 0 }))}
              showStartButton={true}
              onStart={startLiveTimer}
            />
          </div>

          {/* Live Preview Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Live Preview</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowClock(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                >
                  <Clock className="inline-block mr-2" size={18} />
                  Show Clock
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500"
                >
                  <Settings className="inline-block mr-2" size={18} />
                  Display Settings
                </button>
              </div>
            </div>
            <div className={`relative rounded-lg ${isTimerComplete ? 'animate-[timerComplete_0.5s_ease-in-out_5]' : ''}`}>
              {showClock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-10">
                  <span className="text-6xl font-bold text-white">{currentTime}</span>
                </div>
              )}
              {!extraTime.isRunning ? (
                <Timer
                  minutes={liveTimer.minutes}
                  seconds={liveTimer.seconds}
                  isAttention={liveTimer.isAttention}
                  isComplete={isTimerComplete}
                  background={background}
                />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-black">
                  <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">EXTRA TIME</h2>
                  <ExtraTimeTimer
                    minutes={extraTime.minutes}
                    seconds={extraTime.seconds}
                    isRunning={extraTime.isRunning}
                  />
                </div>
              )}
              {showNextProgram && (
                <NextProgramNotification programName={showNextProgram} />
              )}
              {(showAlert || isAlertFlashing) && (
                <div className="absolute bottom-0 left-0 right-0">
                  <AlertBanner message={alertMessage} isFlashing={isAlertFlashing} />
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {!liveTimer.isRunning ? (
                <button
                  onClick={startLiveTimer}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
                >
                  <Play className="inline-block mr-2" size={18} />
                  Start
                </button>
              ) : (
                <>
                  <button
                    onClick={liveTimer.isPaused ? resumeLiveTimer : pauseLiveTimer}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-500"
                  >
                    {liveTimer.isPaused ? (
                      <>
                        <Play className="inline-block mr-2" size={18} />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="inline-block mr-2" size={18} />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetLiveTimer}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                  >
                    <RefreshCw className="inline-block mr-2" size={18} />
                    Reset
                  </button>
                </>
              )}
              <button
                onClick={toggleAttention}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500"
              >
                <AlertTriangle className="inline-block mr-2" size={18} />
                Attention
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Alert message..."
                className="w-full p-2 rounded bg-gray-800 text-white"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAlert(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                >
                  Show Alert
                </button>
                <button
                  onClick={() => {
                    setIsAlertFlashing(true);
                    setTimeout(() => setIsAlertFlashing(false), 2500);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500"
                >
                  Flash Alert
                </button>
                <button
                  onClick={() => {
                    setAlertMessage('');
                    setShowAlert(false);
                    setIsAlertFlashing(false);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Clear Alert
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          {/* Program List */}
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl text-white mb-4">Order of Program</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Program name"
                className="flex-grow p-2 rounded bg-gray-700 text-white"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => adjustProgramDuration(-1)}
                  className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600"
                >
                  -1m
                </button>
                <span className="bg-gray-700 text-white px-4 py-2 rounded min-w-[60px] text-center">
                  {programDuration}m
                </span>
                <button
                  onClick={() => adjustProgramDuration(1)}
                  className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600"
                >
                  +1m
                </button>
                <button
                  onClick={() => adjustProgramDuration(5)}
                  className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600"
                >
                  +5m
                </button>
              </div>
              <button
                onClick={addProgram}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                Add
              </button>
            </div>
            <ProgramList
              programs={programs}
              onDelete={handleProgramDelete}
              onEdit={() => {}}
              onStart={startProgram}
              onNotify={(program) => {
                setShowNextProgram(program.name);
                // Auto-hide after 5 seconds
                setTimeout(() => {
                  setShowNextProgram(null);
                }, 5000);
              }}
            />
          </div>

          {/* Extra Time */}
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl text-white mb-4">Extra Time</h2>
            <div className="text-2xl text-white mb-4 text-center">
              {String(extraTime.minutes).padStart(2, '0')}:{String(extraTime.seconds).padStart(2, '0')}
            </div>
            <div className="space-y-2">
              <TimerControls
                onAdjustTime={(minutes) => setExtraTime(prev => ({
                  ...prev,
                  minutes: Math.max(0, prev.minutes + minutes),
                }))}
                onReset={() => setExtraTime({
                  minutes: 0,
                  seconds: 0,
                  isRunning: false,
                  isPaused: false,
                })}
              />
              <div className="flex space-x-2">
                <button
                  onClick={startExtraTime}
                  disabled={liveTimer.isRunning && (liveTimer.minutes > 0 || liveTimer.seconds > 0)}
                  className={`w-full px-4 py-2 rounded ${
                    liveTimer.isRunning && (liveTimer.minutes > 0 || liveTimer.seconds > 0)
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500'
                  } text-white`}
                >
                  Start Extra Time
                </button>
                {extraTime.isRunning && (
                  <button
                    onClick={stopExtraTime}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                  >
                    Stop Extra Time
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <DisplaySettings 
          onClose={() => setShowSettings(false)} 
          onBackgroundChange={handleBackgroundChange}
        />
      )}

      {deleteConfirmation.isOpen && (
        <DeleteConfirmation
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDelete}
          programName={deleteConfirmation.programName}
        />
      )}
    </div>
  );
}

export default App;