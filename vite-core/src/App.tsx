import React, { useState, useEffect, useRef } from 'react';
import { Timer } from './components/Timer';
import { TimerControls } from './components/TimerControls';
import { AlertBanner } from './components/AlertBanner';
import { ProgramList } from './components/ProgramList';
import { ExtraTimeTimer } from './components/ExtraTimeTimer';
import { Program, TimerState, ExtraTimeState, Category } from './types';
import { Play, Pause, RefreshCw, AlertTriangle, Clock, Settings, Bell, FolderPlus, FileText, HelpCircle, Plus, RotateCcw } from 'lucide-react';
import { DisplaySettings } from './components/DisplaySettings';
import { NextProgramNotification } from './components/NextProgramNotification';
import { DeleteConfirmation } from './components/DeleteConfirmation';
import { CategoryManager } from './components/CategoryManager';
import { ExportImportManager } from './components/ExportImportManager';
import { HowToGuide } from './components/HowToGuide';
import { AddProgramModal } from './components/AddProgramModal';
import TimerDisplay from './TimerDisplay';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isTimerDisplayMode, setIsTimerDisplayMode] = useState(false);
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

  const [programs, setPrograms] = useState<Program[]>(() => {
    const savedPrograms = localStorage.getItem('programs');
    return savedPrograms ? JSON.parse(savedPrograms) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const savedCategories = localStorage.getItem('categories');
    return savedCategories ? JSON.parse(savedCategories) : [];
  });
  
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertFlashing, setIsAlertFlashing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [textCase, setTextCase] = useState<'normal' | 'uppercase' | 'lowercase' | 'capitalize'>(() => {
    return (localStorage.getItem('textCase') as 'normal' | 'uppercase' | 'lowercase' | 'capitalize') || 'normal';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [clockScale, setClockScale] = useState(100);
  const [showNextProgram, setShowNextProgram] = useState<Program | null>(null);

  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showExportImportManager, setShowExportImportManager] = useState(false);
  const [showHowToGuide, setShowHowToGuide] = useState(false);
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [background, setBackground] = useState<{ type: string; source: string | null }>(() => {
    const savedBackground = localStorage.getItem('background');
    return savedBackground ? JSON.parse(savedBackground) : { type: 'default', source: null };
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

  const [setupTab, setSetupTab] = useState<'timer' | 'extra'>('timer');
  const [timerHistory, setTimerHistory] = useState<Array<{
    id: string;
    programName: string;
    duration: number;
    timestamp: number;
  }>>(() => {
    const saved = localStorage.getItem('timerHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const clockTimeoutRef = useRef<NodeJS.Timeout>();
  const clockIntervalRef = useRef<NodeJS.Timeout>();

  // Case changer functions
  const handleCaseChange = () => {
    const cases: ('normal' | 'uppercase' | 'lowercase' | 'capitalize')[] = ['normal', 'uppercase', 'lowercase', 'capitalize'];
    const currentIndex = cases.indexOf(textCase);
    const nextIndex = (currentIndex + 1) % cases.length;
    const newCase = cases[nextIndex];
    setTextCase(newCase);
    localStorage.setItem('textCase', newCase);
    window.dispatchEvent(new Event('storage'));
  };

  const getProcessedAlertMessage = () => {
    switch (textCase) {
      case 'uppercase':
        return alertMessage.toUpperCase();
      case 'lowercase':
        return alertMessage.toLowerCase();
      case 'capitalize':
        return alertMessage.replace(/\b\w/g, l => l.toUpperCase());
      default:
        return alertMessage;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle routing for timer display mode
  useEffect(() => {
    const checkRoute = () => {
      if (window.location.hash === '#/timer') {
        setIsTimerDisplayMode(true);
      } else {
        setIsTimerDisplayMode(false);
      }
    };
    
    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  useEffect(() => {
    localStorage.setItem('programs', JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify({
      minutes: liveTimer.minutes,
      seconds: liveTimer.seconds,
      isRunning: liveTimer.isRunning,
      isPaused: liveTimer.isPaused,
      isAttention: liveTimer.isAttention,
      isComplete: isTimerComplete,
    }));
    
    // Dispatch storage event for timer display windows
    localStorage.setItem('liveTimer', JSON.stringify({
      minutes: liveTimer.minutes,
      seconds: liveTimer.seconds,
      isRunning: liveTimer.isRunning,
      isPaused: liveTimer.isPaused,
      isAttention: liveTimer.isAttention,
      isComplete: isTimerComplete,
    }));
    window.dispatchEvent(new Event('storage'));
  }, [liveTimer, isTimerComplete]);

  useEffect(() => {
    localStorage.setItem('extraTime', JSON.stringify(extraTime));
    window.dispatchEvent(new Event('storage'));
  }, [extraTime]);

  useEffect(() => {
    localStorage.setItem('alertState', JSON.stringify({
      message: alertMessage,
      isFlashing: isAlertFlashing,
      show: showAlert,
    }));
    
    // Dispatch storage events for timer display windows
    localStorage.setItem('alertMessage', alertMessage);
    localStorage.setItem('showAlert', JSON.stringify(showAlert));
    window.dispatchEvent(new Event('storage'));
  }, [alertMessage, isAlertFlashing, showAlert]);

  useEffect(() => {
    localStorage.setItem('nextProgram', JSON.stringify(showNextProgram));
  }, [showNextProgram]);

  useEffect(() => {
    localStorage.setItem('showClock', JSON.stringify(showClock));
    localStorage.setItem('currentTime', JSON.stringify(currentTime));
    window.dispatchEvent(new Event('storage'));
  }, [showClock, currentTime]);

  useEffect(() => {
    const updateClockScale = () => {
      const savedSizes = localStorage.getItem('displaySizes');
      if (savedSizes) {
        const sizes = JSON.parse(savedSizes);
        setClockScale(sizes.clock || 100);
      }
    };

    updateClockScale();
    window.addEventListener('storage', updateClockScale);
    return () => window.removeEventListener('storage', updateClockScale);
  }, []);

  useEffect(() => {
    localStorage.setItem('timerHistory', JSON.stringify(timerHistory));
  }, [timerHistory]);

  // Clean up expired timer history entries (48 hours)
  useEffect(() => {
    const cleanupHistory = () => {
      const now = Date.now();
      const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
      
      setTimerHistory(prev => 
        prev.filter(entry => now - entry.timestamp < fortyEightHours)
      );
    };

    // Clean up immediately and then every hour
    cleanupHistory();
    const interval = setInterval(cleanupHistory, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showClock) {
      const updateTime = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString());
      };
      
      updateTime();
      clockIntervalRef.current = setInterval(updateTime, 1000);
    
    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
    }
  }, [showClock]);

  // Smart clock display logic - when timer is running
  useEffect(() => {
    if (showClock && liveTimer.isRunning) {
      const totalSeconds = liveTimer.minutes * 60 + liveTimer.seconds;
      
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
  }, [liveTimer.isRunning, liveTimer.minutes, liveTimer.seconds, showClock]);

  // Handle clock display when timer finishes
  useEffect(() => {
    if (liveTimer.isComplete && showClock) {
      // If timer finished and clock is activated, switch to clock permanently
      setShowClock(true);
      if (clockCycleIntervalRef.current) clearInterval(clockCycleIntervalRef.current);
      if (clockTimeoutRef.current) clearTimeout(clockTimeoutRef.current);
    }
  }, [liveTimer.isComplete, showClock]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key.toLowerCase()) {
        case ' ': // Spacebar - Start/Pause timer
          event.preventDefault();
          if (!liveTimer.isRunning) {
            startLiveTimer();
          } else {
            liveTimer.isPaused ? resumeLiveTimer() : pauseLiveTimer();
          }
          break;
        case 's': // S - Stop timer
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with Ctrl+S
          resetLiveTimer();
          break;
        case 'r': // R - Reset timer
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with Ctrl+R
          resetLiveTimer();
          break;
        case 'a': // A - Toggle attention
          toggleAttention();
          break;
        case 'c': // C - Show clock
          setShowClock(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [liveTimer.isRunning, liveTimer.isPaused]);

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

  const handleBackgroundChange = async (type: string, source: string | null) => {
    try {
      if (type === 'webcam') {
        const constraints = {
          video: source ? { deviceId: { exact: source } } : true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('webcam-video') as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      }
      
      const backgroundData = { type, source };
      localStorage.setItem('background', JSON.stringify(backgroundData));
      setBackground(backgroundData);
    } catch (err) {
      console.error('Error setting background:', err);
      setBackground({ type: 'default', source: null });
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

  const handleSetupSecondsAdjust = (seconds: number) => {
    setSetupTimer(prev => {
      const totalSeconds = prev.minutes * 60 + prev.seconds + seconds;
      if (totalSeconds < 0) return { ...prev, minutes: 0, seconds: 0 };
      return {
        ...prev,
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60,
      };
    });
  };

  const handleLiveSecondsAdjust = (seconds: number) => {
    setLiveTimer(prev => {
      const totalSeconds = prev.minutes * 60 + prev.seconds + seconds;
      if (totalSeconds < 0) return { ...prev, minutes: 0, seconds: 0 };
      return {
        ...prev,
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60,
      };
    });
  };


  const addProgram = (programData: Omit<Program, 'id'>) => {
    const newProgram: Program = {
        id: Date.now().toString(),
      ...programData
    };
    setPrograms(prev => [...prev, newProgram]);
  };

  const addCategory = (name: string) => {
    setCategories(prev => [...prev, {
      id: Date.now().toString(),
      name
    }]);
  };

  const updateCategory = (category: Category) => {
    setCategories(prev => prev.map(c => 
      c.id === category.id ? category : c
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setPrograms(prev => prev.filter(p => p.categoryId !== id));
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
    
    // Add to timer history
    const historyEntry = {
      id: Date.now().toString(),
      programName: program.name,
      duration: program.duration,
      timestamp: Date.now()
    };
    setTimerHistory(prev => [historyEntry, ...prev]);
  };

  const addTimeToLiveTimer = (minutes: number) => {
    if (liveTimer.isRunning) {
      setLiveTimer(prev => ({
        ...prev,
        minutes: Math.max(0, prev.minutes + minutes)
      }));
    }
  };

  const addSecondsToLiveTimer = (seconds: number) => {
    if (liveTimer.isRunning) {
      setLiveTimer(prev => {
        const totalSeconds = prev.minutes * 60 + prev.seconds + seconds;
        const newMinutes = Math.floor(Math.max(0, totalSeconds) / 60);
        const newSeconds = Math.max(0, totalSeconds) % 60;
        return {
          ...prev,
          minutes: newMinutes,
          seconds: newSeconds
        };
      });
    }
  };

  const clearCacheAndRefresh = () => {
    // Clear all localStorage data
    localStorage.clear();
    // Refresh the page
    window.location.reload();
  };

  const handleProgramEdit = (program: Program) => {
    setPrograms(prev => prev.map(p => 
      p.id === program.id ? program : p
    ));
  };

  const runTimerFromHistory = (historyEntry: { programName: string; duration: number }) => {
    setLiveTimer({
      minutes: historyEntry.duration,
      seconds: 0,
      isRunning: true,
      isPaused: false,
      isAttention: false,
    });
    setExtraTime(prev => ({ ...prev, isRunning: false }));
    
    // Add new entry to history
    const newHistoryEntry = {
      id: Date.now().toString(),
      programName: historyEntry.programName,
      duration: historyEntry.duration,
      timestamp: Date.now()
    };
    setTimerHistory(prev => [newHistoryEntry, ...prev]);
  };

  const clearTimerHistory = () => {
    setTimerHistory([]);
  };

  const clearCache = async () => {
    if (window.electronAPI?.clearCache) {
      await window.electronAPI.clearCache();
    } else {
      // Fallback for development
      window.location.reload();
    }
  };

  const handleImportPrograms = (importedPrograms: Program[]) => {
    setPrograms(prev => [...prev, ...importedPrograms]);
  };

  const handleImportCategories = (importedCategories: Category[]) => {
    setCategories(prev => {
      const existingNames = new Set(prev.map(cat => cat.name.toLowerCase()));
      const newCategories = importedCategories.filter(cat => !existingNames.has(cat.name.toLowerCase()));
      return [...prev, ...newCategories];
    });
  };

  if (showSplash) {
    // Check for custom splash image
    const customSplashImage = localStorage.getItem('splashImage');
    
    if (customSplashImage) {
    return (
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center"
        style={{ 
            backgroundImage: `url(${customSplashImage})`,
          backgroundSize: 'cover'
        }}
      >
        <div className="bg-black bg-opacity-50 p-8 rounded-lg text-center">
            <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm mb-6 animate-pulse">
              <span className="text-4xl">⏱️</span>
            </div>
          <h1 className="text-6xl font-bold text-white mb-4">Stage Timer App</h1>
          <p className="text-xl text-white opacity-80">
            Developed by Positive Developer (Mr Positive)
          </p>
          </div>
        </div>
      );
    }

    // Default gradient splash screen
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Main content */}
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm mb-6 animate-pulse">
              <span className="text-4xl">⏱️</span>
            </div>
            <h1 className="text-7xl font-bold text-white mb-4 tracking-wide">
              Stage Timer
            </h1>
            <h2 className="text-2xl font-light text-blue-200 mb-8 tracking-wider">
              Professional Event Management
            </h2>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-white opacity-80 mb-2">
              Developed by
            </p>
            <p className="text-xl text-blue-200 font-medium">
              Positive Developer (Mr Positive)
            </p>
          </div>
          
          {/* Loading animation */}
          <div className="mt-12">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-400"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render timer display mode
  if (isTimerDisplayMode) {
    return <TimerDisplay />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-2 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Setup</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setSetupTab('timer')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  setupTab === 'timer'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Timer Setup
              </button>
              <button
                onClick={() => setSetupTab('extra')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  setupTab === 'extra'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Extra Time Setup
              </button>
            </div>

            {/* Tab Content */}
            {setupTab === 'timer' && (
              <div className="space-y-4">
            <Timer
              minutes={setupTimer.minutes}
              seconds={setupTimer.seconds}
              isAttention={false}
              isComplete={false}
            />
            <TimerControls
              onAdjustTime={handleSetupTimerAdjust}
              onAdjustSeconds={handleSetupSecondsAdjust}
              onReset={() => setSetupTimer(prev => ({ ...prev, minutes: 0, seconds: 0 }))}
              showStartButton={true}
              onStart={startLiveTimer}
            />
              </div>
            )}

            {setupTab === 'extra' && (
              <div className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden">
                  <ExtraTimeTimer
                    minutes={extraTime.minutes}
                    seconds={extraTime.seconds}
                    isRunning={extraTime.isRunning}
                  />
                </div>
                <TimerControls
                  onAdjustTime={(minutes) => setExtraTime(prev => ({
                    ...prev,
                    minutes: Math.max(0, prev.minutes + minutes),
                  }))}
                  onAdjustSeconds={(seconds) => setExtraTime(prev => {
                    const totalSeconds = prev.minutes * 60 + prev.seconds + seconds;
                    if (totalSeconds < 0) return { ...prev, minutes: 0, seconds: 0 };
                    return {
                      ...prev,
                      minutes: Math.floor(totalSeconds / 60),
                      seconds: totalSeconds % 60,
                    };
                  })}
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
            )}
          </div>

          {/* Live Preview Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Live</h2>
              <div className="flex flex-wrap gap-1 justify-center sm:justify-end">
                <button
                  onClick={() => window.electronAPI?.openAdvancedMultiScreen()}
                  className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-opacity-80 transition-all duration-300 flex items-center gap-1"
                >
                  <Settings size={14} />
                  Display
                </button>
                <button
                  onClick={() => setShowClock(!showClock)}
                  className={`${showClock ? 'bg-red-600 animate-pulse shadow-lg ring-2 ring-red-400' : 'bg-blue-600'} text-white px-3 py-2 rounded text-sm hover:bg-opacity-80 transition-all duration-300 flex items-center gap-1`}
                >
                  <Clock size={14} />
                  Clock
                </button>
                <button
                  onClick={() => setShowHowToGuide(true)}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-500 flex items-center gap-1"
                >
                  <HelpCircle size={14} />
                  Guide
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-500 text-sm flex items-center gap-1"
                  title="Settings"
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            </div>
            <div className={`relative rounded-lg ${isTimerComplete ? 'animate-[timerComplete_0.5s_ease-in-out_5]' : ''}`}>
              {showClock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-10 pointer-events-none">
                  <span 
                    className="font-bold text-white"
                    style={{
                      fontSize: `${2.5 * clockScale / 100}rem`, // Scale based on clock size setting
                      fontFamily: 'Arial, sans-serif',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      letterSpacing: '0.02em',
                      maxWidth: '90%',
                      textAlign: 'center'
                    }}
                  >
                    {currentTime}
                  </span>
                </div>
              )}
              {!extraTime.isRunning ? (
                <Timer
                  minutes={liveTimer.minutes}
                  seconds={liveTimer.seconds}
                  isAttention={liveTimer.isAttention}
                  isComplete={isTimerComplete}
                  background={background}
                  isRunning={liveTimer.isRunning}
                />
              ) : (
                <div className="bg-black animate-extraTimeBg rounded-lg overflow-hidden">
                  <ExtraTimeTimer
                    minutes={extraTime.minutes}
                    seconds={extraTime.seconds}
                    isRunning={extraTime.isRunning}
                  />
                </div>
              )}
              {showNextProgram && (
                <NextProgramNotification 
                  programName={showNextProgram.name}
                  fullscreen={false}
                  compact={true}
                  duration={showNextProgram.duration}
                />
              )}
              {(showAlert || isAlertFlashing) && (
                <div className="absolute bottom-0 left-0 right-0 z-10">
                  <AlertBanner 
                    message={getProcessedAlertMessage()}
                    isFlashing={isAlertFlashing}
                    fullscreen={false}
                  />
                </div>
              )}
            </div>
            

              
              {/* Live Timer Controls - Mobile Friendly Layout */}
            <div className="space-y-4">
              {/* Primary Controls */}
              <div className="flex space-x-2">
                {!liveTimer.isRunning ? (
                  <button
                    onClick={startLiveTimer}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
                  >
                    <Play className="inline-block mr-2" size={18} />
                    Start
                  </button>
                ) : (
                  <>
                    <button
                      onClick={liveTimer.isPaused ? resumeLiveTimer : pauseLiveTimer}
                      className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-500"
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
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                    >
                      <RefreshCw className="inline-block mr-2" size={18} />
                      Stop
                    </button>
                  </>
                )}
                <button
                  onClick={toggleAttention}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500"
                >
                  <AlertTriangle className="inline-block mr-2" size={18} />
                  Attention!
                </button>
              </div>
              
              {/* Minute Controls - Grid Layout */}
              {liveTimer.isRunning && (
                <div className="grid grid-cols-6 gap-1">
                  <button
                    onClick={() => addTimeToLiveTimer(-10)}
                    className="bg-red-800 text-white px-2 py-2 rounded hover:bg-red-700 text-sm"
                  >
                    -10m
                  </button>
                  <button
                    onClick={() => addTimeToLiveTimer(-5)}
                    className="bg-red-600 text-white px-2 py-2 rounded hover:bg-red-500 text-sm"
                  >
                    -5m
                  </button>
                  <button
                    onClick={() => addTimeToLiveTimer(-1)}
                    className="bg-orange-500 text-white px-2 py-2 rounded hover:bg-orange-400 text-sm"
                  >
                    -1m
                  </button>
                  <button
                    onClick={() => addTimeToLiveTimer(1)}
                    className="bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-400 text-sm"
                  >
                    +1m
                  </button>
                  <button
                    onClick={() => addTimeToLiveTimer(5)}
                    className="bg-green-600 text-white px-2 py-2 rounded hover:bg-green-500 text-sm"
                  >
                    +5m
                  </button>
                  <button
                    onClick={() => addTimeToLiveTimer(10)}
                    className="bg-green-800 text-white px-2 py-2 rounded hover:bg-green-700 text-sm"
                  >
                    +10m
                  </button>
                </div>
              )}
              
              {/* Second Controls - Grid Layout */}
              {liveTimer.isRunning && (
                <div className="grid grid-cols-6 gap-1">
                  <button
                    onClick={() => addSecondsToLiveTimer(-10)}
                    className="bg-red-700 text-white px-2 py-2 rounded hover:bg-red-600 text-sm"
                  >
                    -10s
                  </button>
                  <button
                    onClick={() => addSecondsToLiveTimer(-5)}
                    className="bg-red-500 text-white px-2 py-2 rounded hover:bg-red-400 text-sm"
                  >
                    -5s
                  </button>
                  <button
                    onClick={() => addSecondsToLiveTimer(-1)}
                    className="bg-orange-500 text-white px-2 py-2 rounded hover:bg-orange-400 text-sm"
                  >
                    -1s
                  </button>
                  <button
                    onClick={() => addSecondsToLiveTimer(1)}
                    className="bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-400 text-sm"
                  >
                    +1s
                  </button>
                  <button
                    onClick={() => addSecondsToLiveTimer(5)}
                    className="bg-green-500 text-white px-2 py-2 rounded hover:bg-green-400 text-sm"
                  >
                    +5s
                  </button>
                  <button
                    onClick={() => addSecondsToLiveTimer(10)}
                    className="bg-green-700 text-white px-2 py-2 rounded hover:bg-green-600 text-sm"
                  >
                    +10s
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleCaseChange}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    textCase === 'normal' ? 'bg-gray-600 text-white' :
                    textCase === 'uppercase' ? 'bg-blue-600 text-white' :
                    textCase === 'lowercase' ? 'bg-green-600 text-white' :
                    'bg-purple-600 text-white'
                  }`}
                  title={`Case: ${textCase}`}
                >
                  {textCase === 'normal' ? 'Aa' : textCase === 'uppercase' ? 'AA' : textCase === 'lowercase' ? 'aa' : 'Aa'}
                </button>
              <input
                type="text"
                placeholder="Alert message..."
                  className="flex-1 p-2 rounded bg-gray-800 text-white"
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
              />
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 bg-gray-800 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white">Order of Program</h2>
              <div className="flex gap-2">
              <button
                  onClick={() => setShowAddProgramModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 flex items-center space-x-2 transition-colors"
              >
                  <Plus size={16} />
                  <span>Add Program</span>
              </button>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 flex items-center space-x-2 transition-colors"
                >
                  <FolderPlus size={16} />
                  <span>Categories</span>
                </button>
                <button
                  onClick={() => setShowExportImportManager(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 flex items-center space-x-2 transition-colors"
                >
                  <FileText size={16} />
                  <span>Export/Import</span>
                </button>
              </div>
            </div>
            <ProgramList
              programs={programs}
              categories={categories}
              onDelete={handleProgramDelete}
              onStart={startProgram}
              onNotify={(program) => {
                setShowNextProgram(program);
                setTimeout(() => {
                  setShowNextProgram(null);
                }, 5000);
              }}
              onEdit={handleProgramEdit}
            />
          </div>

          {/* Timer History */}
          <div className="bg-gray-800 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white">Timer History</h2>
                <button
                onClick={clearTimerHistory}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 text-sm"
                disabled={timerHistory.length === 0}
              >
                Clear All
                </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
              {timerHistory.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No timer history yet
                </div>
              ) : (
                timerHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <div className="text-white font-medium">{entry.programName}</div>
                      <div className="text-gray-400 text-sm">
                        {entry.duration} min • {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  <button
                      onClick={() => runTimerFromHistory(entry)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 text-sm"
                  >
                      Run Again
                  </button>
                  </div>
                ))
                )}
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
          <DisplaySettings 
            onClose={() => setShowSettings(false)} 
            onBackgroundChange={handleBackgroundChange}
            onClearCache={clearCacheAndRefresh}
          />
      )}

      {showCategoryManager && (
        <CategoryManager
          isOpen={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
          categories={categories}
          programs={programs}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
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

      {showExportImportManager && (
        <ExportImportManager
          isOpen={showExportImportManager}
          onClose={() => setShowExportImportManager(false)}
          programs={programs}
          categories={categories}
          onImportPrograms={handleImportPrograms}
          onImportCategories={handleImportCategories}
        />
      )}

      {showHowToGuide && (
        <HowToGuide
          isOpen={showHowToGuide}
          onClose={() => setShowHowToGuide(false)}
        />
      )}


      {showAddProgramModal && (
        <AddProgramModal
          isOpen={showAddProgramModal}
          onClose={() => setShowAddProgramModal(false)}
          onSave={addProgram}
          categories={categories}
          initialCategory={selectedCategory}
        />
      )}
    </div>
  );
}

export default App;