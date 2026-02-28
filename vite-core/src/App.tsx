import React, { useState, useEffect, useRef } from 'react';
import { Timer } from './components/Timer';
import { TimerControls } from './components/TimerControls';
import { AlertBanner } from './components/AlertBanner';
import { ProgramList } from './components/ProgramList';
import { ExtraTimeTimer } from './components/ExtraTimeTimer';
import { Program, TimerState, ExtraTimeState, Category, GreenScreenTimerState, OverlaySettings } from './types';
import { Play, Pause, RefreshCw, AlertTriangle, Clock, Settings, Bell, FolderPlus, FileText, HelpCircle, Plus, RotateCcw, Layout, Monitor, Watch, Type, Trash2, Edit2, Check, X, User, Minus, Square } from 'lucide-react';
import { DisplaySettings } from './components/DisplaySettings';
import { NextProgramNotification } from './components/NextProgramNotification';
import { DeleteConfirmation } from './components/DeleteConfirmation';
import { CategoryManager } from './components/CategoryManager';
import { ExportImportManager } from './components/ExportImportManager';
import { HowToGuide } from './components/HowToGuide';
import { AddProgramModal } from './components/AddProgramModal';
import TimerDisplay from './TimerDisplay';
import GreenScreenTimer from './GreenScreenTimer';

function App() {
  const [showSplash, setShowSplash] = useState(true);
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

  const [greenScreenTimer, setGreenScreenTimer] = useState<GreenScreenTimerState>(() => {
    const saved = localStorage.getItem('greenScreenTimerState');
    return saved ? JSON.parse(saved) : {
      minutes: 0,
      seconds: 0,
      isRunning: false,
      isPaused: false,
    };
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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  const [clockScale, setClockScale] = useState(100);
  const [programNameScale, setProgramNameScale] = useState(100);
  const [showProgramName, setShowProgramName] = useState(true);
  const [showNextProgram, setShowNextProgram] = useState<Program | null>(null);
  const [availableDisplays, setAvailableDisplays] = useState<any[]>([]);
  const [selectedGreenScreenDisplay, setSelectedGreenScreenDisplay] = useState<number | null>(null);
  const [isGreenScreenActive, setIsGreenScreenActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'overlay' | 'guide'>('main');
  const [guideSection, setGuideSection] = useState<'main' | 'overlay'>('main');
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    const parsed = savedSizes ? JSON.parse(savedSizes) : {};
    const overlay = parsed.overlay || {};
    return {
      timer: overlay.timer || parsed.greenScreenTimer || 100,
      x: overlay.x !== undefined ? overlay.x : (parsed.greenScreenX !== undefined ? parsed.greenScreenX : 50),
      y: overlay.y !== undefined ? overlay.y : (parsed.greenScreenY !== undefined ? parsed.greenScreenY : 92),
      bgColor: overlay.bgColor || parsed.greenScreenBgColor || '#00ff00',
      mode: overlay.mode || parsed.greenScreenMode || 'timer',
      show: overlay.show !== undefined ? overlay.show : (parsed.showGreenScreen !== undefined ? parsed.showGreenScreen : true),
      lowerThirdTitle: overlay.lowerThirdTitle || 'SUNDAY, FEBRUARY 22, 2026',
      lowerThirdSubtitle: overlay.lowerThirdSubtitle || 'FAITH OF THE FAITHFUL',
      lowerThirdDate: overlay.lowerThirdDate || 'PASTOR VOTE MIKOYO V.',
      lowerThirdTheme: overlay.lowerThirdTheme || 'dark',
      lowerThirdLogo: overlay.lowerThirdLogo || '',
      lowerThirdTitleSize: overlay.lowerThirdTitleSize || 14,
      lowerThirdSubtitleSize: overlay.lowerThirdSubtitleSize || 48,
      lowerThirdDateSize: overlay.lowerThirdDateSize || 20,
      lowerThirdFont: overlay.lowerThirdFont || 'JetBrains Mono',
      lowerThirdDisplaySeconds: overlay.lowerThirdDisplaySeconds || 10,
      lowerThirdSleepSeconds: overlay.lowerThirdSleepSeconds || 5,
      timerFontSize: overlay.timerFontSize || 10,
      clockFontSize: overlay.clockFontSize || 10,
      isLive: overlay.isLive !== undefined ? overlay.isLive : false,
    };
  });

  const [stagedOverlaySettings, setStagedOverlaySettings] = useState<OverlaySettings>(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    const parsed = savedSizes ? JSON.parse(savedSizes) : {};
    const overlay = parsed.overlay || {};
    return {
      timer: overlay.timer || parsed.greenScreenTimer || 100,
      x: overlay.x !== undefined ? overlay.x : (parsed.greenScreenX !== undefined ? parsed.greenScreenX : 50),
      y: overlay.y !== undefined ? overlay.y : (parsed.greenScreenY !== undefined ? parsed.greenScreenY : 92),
      bgColor: overlay.bgColor || parsed.greenScreenBgColor || '#00ff00',
      mode: overlay.mode || parsed.greenScreenMode || 'timer',
      show: overlay.show !== undefined ? overlay.show : (parsed.showGreenScreen !== undefined ? parsed.showGreenScreen : true),
      lowerThirdTitle: overlay.lowerThirdTitle || 'SUNDAY, FEBRUARY 22, 2026',
      lowerThirdSubtitle: overlay.lowerThirdSubtitle || 'FAITH OF THE FAITHFUL',
      lowerThirdDate: overlay.lowerThirdDate || 'PASTOR VOTE MIKOYO V.',
      lowerThirdTheme: overlay.lowerThirdTheme || 'dark',
      lowerThirdLogo: overlay.lowerThirdLogo || '',
      lowerThirdTitleSize: overlay.lowerThirdTitleSize || 14,
      lowerThirdSubtitleSize: overlay.lowerThirdSubtitleSize || 48,
      lowerThirdDateSize: overlay.lowerThirdDateSize || 20,
      lowerThirdFont: overlay.lowerThirdFont || 'JetBrains Mono',
      lowerThirdDisplaySeconds: overlay.lowerThirdDisplaySeconds || 10,
      lowerThirdSleepSeconds: overlay.lowerThirdSleepSeconds || 5,
      timerFontSize: overlay.timerFontSize || 10,
      clockFontSize: overlay.clockFontSize || 10,
      isLive: overlay.isLive !== undefined ? overlay.isLive : false,
    };
  });

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
  const clockCycleIntervalRef = useRef<NodeJS.Timeout>();

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
      programName: liveTimer.programName,
    }));
    
    // Dispatch storage event for timer display windows
    localStorage.setItem('liveTimer', JSON.stringify({
      minutes: liveTimer.minutes,
      seconds: liveTimer.seconds,
      isRunning: liveTimer.isRunning,
      isPaused: liveTimer.isPaused,
      isAttention: liveTimer.isAttention,
      isComplete: isTimerComplete,
      programName: liveTimer.programName,
    }));
    window.dispatchEvent(new Event('storage'));
  }, [liveTimer, isTimerComplete]);

  useEffect(() => {
    localStorage.setItem('extraTime', JSON.stringify(extraTime));
    window.dispatchEvent(new Event('storage'));
  }, [extraTime]);

  useEffect(() => {
    localStorage.setItem('greenScreenTimerState', JSON.stringify(greenScreenTimer));
    window.dispatchEvent(new Event('storage'));
  }, [greenScreenTimer]);

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
    if (window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setAvailableDisplays);
    }
  }, []);
  useEffect(() => {
    if (activeTab === 'overlay' && window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setAvailableDisplays);
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('greenScreenTimerState', JSON.stringify(greenScreenTimer));
  }, [greenScreenTimer]);

  useEffect(() => {
    if (greenScreenTimer.isRunning && !greenScreenTimer.isPaused) {
      const interval = setInterval(() => {
        setGreenScreenTimer(prev => {
          if (prev.minutes === 0 && prev.seconds === 0) {
            return { ...prev, isRunning: false };
          }
          const totalSeconds = prev.minutes * 60 + prev.seconds - 1;
          return {
            ...prev,
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60,
          };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [greenScreenTimer.isRunning, greenScreenTimer.isPaused]);

  const handleGreenScreenTimeAdjust = (minutes: number) => {
    setGreenScreenTimer(prev => ({
      ...prev,
      minutes: Math.max(0, prev.minutes + minutes),
    }));
  };

  const handleGreenScreenSecondsAdjust = (seconds: number) => {
    setGreenScreenTimer(prev => {
      const totalSeconds = prev.minutes * 60 + prev.seconds + seconds;
      if (totalSeconds < 0) return { ...prev, minutes: 0, seconds: 0 };
      return {
        ...prev,
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60,
      };
    });
  };

  const startGreenScreenTimer = () => {
    setGreenScreenTimer(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const pauseGreenScreenTimer = () => {
    setGreenScreenTimer(prev => ({ ...prev, isPaused: true }));
  };

  const resumeGreenScreenTimer = () => {
    setGreenScreenTimer(prev => ({ ...prev, isPaused: false }));
  };

  const resetGreenScreenTimer = () => {
    setGreenScreenTimer({
      minutes: 0,
      seconds: 0,
      isRunning: false,
      isPaused: false,
    });
  };

  const handleGreenScreenToggle = () => {
    if (isGreenScreenActive) {
      window.electronAPI?.closeGreenScreenTimer();
      setIsGreenScreenActive(false);
    } else if (selectedGreenScreenDisplay !== null) {
      window.electronAPI?.openGreenScreenTimer(selectedGreenScreenDisplay);
      setIsGreenScreenActive(true);
    }
  };

  const updateOverlaySetting = (key: string, value: any) => {
    const newSettings = { ...overlaySettings, [key]: value };
    setOverlaySettings(newSettings);
    setStagedOverlaySettings(newSettings);
    
    const savedSizes = localStorage.getItem('displaySizes');
    const sizes = savedSizes ? JSON.parse(savedSizes) : {};
    
    const updatedSizes = {
      ...sizes,
      overlay: newSettings
    };
    
    localStorage.setItem('displaySizes', JSON.stringify(updatedSizes));
    window.dispatchEvent(new Event('storage'));
  };

  const updateStagedOverlaySetting = <K extends keyof OverlaySettings>(key: K, value: OverlaySettings[K]) => {
    setStagedOverlaySettings(prev => ({ ...prev, [key]: value }));
    
    // Live update for positioning and scale if broadcast is active
    const liveKeys: (keyof OverlaySettings)[] = ['x', 'y', 'timer', 'timerFontSize', 'clockFontSize', 'lowerThirdTitleSize', 'lowerThirdSubtitleSize', 'lowerThirdDateSize'];
    if (liveKeys.includes(key)) {
      const newLiveSettings = { ...overlaySettings, [key]: value };
      setOverlaySettings(newLiveSettings);
      
      const savedSizes = localStorage.getItem('displaySizes');
      const sizes = savedSizes ? JSON.parse(savedSizes) : {};
      const updatedSizes = { ...sizes, overlay: newLiveSettings };
      
      localStorage.setItem('displaySizes', JSON.stringify(updatedSizes));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateStagedOverlaySetting('lowerThirdImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyOverlaySettings = () => {
    const newSettings = { ...stagedOverlaySettings, isLive: true };
    setOverlaySettings(newSettings);
    
    const savedSizes = localStorage.getItem('displaySizes');
    const sizes = savedSizes ? JSON.parse(savedSizes) : {};
    
    const updatedSizes = {
      ...sizes,
      overlay: newSettings
    };
    
    localStorage.setItem('displaySizes', JSON.stringify(updatedSizes));
    window.dispatchEvent(new Event('storage'));
    
    // Brief reset of isLive so we can re-trigger animations if needed
    setTimeout(() => {
      const resetLive = { ...newSettings, isLive: false };
      setOverlaySettings(resetLive);
      localStorage.setItem('displaySizes', JSON.stringify({ ...updatedSizes, overlay: resetLive }));
      window.dispatchEvent(new Event('storage'));
    }, 100);
  };

  useEffect(() => {
    const updateDisplaySettings = () => {
      const savedSizes = localStorage.getItem('displaySizes');
      if (savedSizes) {
        const sizes = JSON.parse(savedSizes);
        setClockScale(sizes.clock || 100);
        setProgramNameScale(sizes.programName || 100);
        setShowProgramName(sizes.showProgramName !== undefined ? sizes.showProgramName : true);
      }
    };

    updateDisplaySettings();
    window.addEventListener('storage', updateDisplaySettings);
    return () => window.removeEventListener('storage', updateDisplaySettings);
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
    if (greenScreenTimer.isRunning && !greenScreenTimer.isPaused) {
      interval = setInterval(() => {
        setGreenScreenTimer(prev => {
          if (prev.minutes === 0 && prev.seconds === 0) {
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
  }, [greenScreenTimer.isRunning, greenScreenTimer.isPaused]);

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
      programName: undefined,
    });
    setIsTimerComplete(false);
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
      programName: program.name,
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
      programName: historyEntry.programName,
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

  // Render control panel
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 px-6 py-3 flex items-center justify-between shadow-md select-none" style={{ WebkitAppRegion: 'drag' as any }}>
        <div className="flex items-center space-x-3" style={{ WebkitAppRegion: 'no-drag' as any }}>
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-lg">⏱️</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Stage Timer <span className="text-xs text-blue-400 font-normal">v2.1.0</span></h1>
        </div>
        
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700" style={{ WebkitAppRegion: 'no-drag' as any }}>
          <button 
            onClick={() => setActiveTab('main')}
            className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'main' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Layout size={16} />
            <span>Timer Control</span>
          </button>
          <button 
            onClick={() => setActiveTab('overlay')}
            className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'overlay' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Monitor size={16} />
            <span>Overlay Control</span>
          </button>
          <button 
            onClick={() => {
              setGuideSection(activeTab === 'overlay' ? 'overlay' : 'main');
              setActiveTab('guide');
            }}
            className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'guide' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <HelpCircle size={16} />
            <span>Guide</span>
          </button>
        </div>

        <div className="flex items-center space-x-4" style={{ WebkitAppRegion: 'no-drag' as any }}>
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">System Clock</div>
            <div className="text-sm text-blue-400 font-mono font-bold">{currentTime}</div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => window.electronAPI?.windowMinimize?.()}
              className="w-10 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="Minimize"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => window.electronAPI?.windowToggleMaximize?.()}
              className="w-10 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded"
              title="Maximize"
            >
              <Square size={14} />
            </button>
            <button
              onClick={() => window.electronAPI?.windowClose?.()}
              className="w-10 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-red-600 rounded"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full p-2 sm:p-4 overflow-y-auto">
        {activeTab === 'main' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Setup Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Setup</h2>
            
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
                <>
                  <Timer
                    minutes={liveTimer.minutes}
                    seconds={liveTimer.seconds}
                    isAttention={liveTimer.isAttention}
                    isComplete={isTimerComplete}
                    background={background}
                    fullscreen={false}
                    isRunning={liveTimer.isRunning}
                  />
                  {showProgramName && liveTimer.programName && (
                    <div 
                      className="absolute top-4 left-0 right-0 text-center z-10 pointer-events-none"
                      style={{
                        fontSize: `${1.2 * programNameScale / 100}rem`,
                        color: 'rgba(255, 255, 255, 0.8)',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        fontFamily: 'Arial, sans-serif'
                      }}
                    >
                      Now: {liveTimer.programName}
                    </div>
                  )}
                </>
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
              currentProgramName={liveTimer.programName}
              isRunning={liveTimer.isRunning}
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
      </>
    ) : activeTab === 'overlay' ? (
          /* Overlay Controller Tab */
        <div className="bg-gray-800 p-6 md:p-8 rounded-2xl space-y-8 border border-gray-700 shadow-2xl mx-auto mb-10 w-full max-w-none xl:max-w-[1600px] 2xl:max-w-[1900px]">
          <div className="flex justify-between items-center border-b border-gray-700 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-3xl">
                📺
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">Broadcast Overlay</h3>
                <p className="text-gray-400 font-medium">Lower-thirds & production timers for live stream</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={applyOverlaySettings}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-green-900/40"
              >
                APPLY CHANGES
              </button>
              <button
                onClick={handleGreenScreenToggle}
                disabled={selectedGreenScreenDisplay === null && !isGreenScreenActive}
                className={`px-10 py-4 rounded-xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${
                  isGreenScreenActive 
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-blue-900/40'
                }`}
              >
                {isGreenScreenActive ? 'Stop Broadcast' : 'Go Live'}
              </button>
            </div>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Settings Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-700 space-y-6">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Target Display</label>
                    <select
                      value={selectedGreenScreenDisplay || ''}
                      onChange={(e) => setSelectedGreenScreenDisplay(Number(e.target.value))}
                      disabled={isGreenScreenActive}
                      className="w-full bg-gray-800 text-white px-5 py-4 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-bold"
                    >
                      <option value="">Choose Screen...</option>
                      {availableDisplays
                        .filter(d => !d.isPrimary)
                        .map(display => {
                          const suffix = display.isUsedByMainTimer
                            ? '(In-use: Timer)'
                            : display.isUsedByOverlay
                              ? '(In-use: Overlay)'
                              : '(Available)';
                          return (
                            <option
                              key={display.id}
                              value={display.id}
                              disabled={display.isUsedByMainTimer || display.isUsedByOverlay}
                            >
                              {display.label} {suffix}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Chroma Key Background</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['#00ff00', '#0000ff', '#ff0000', '#000000', '#ffffff'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateStagedOverlaySetting('bgColor', color)}
                          className={`h-10 rounded-lg border-2 transition-all ${stagedOverlaySettings.bgColor === color ? 'border-white scale-110 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : 'border-transparent opacity-40 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <label className="col-span-5 mt-2 block">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Custom Color</span>
                        <input
                          type="color"
                          value={stagedOverlaySettings.bgColor}
                          onChange={(e) => updateStagedOverlaySetting('bgColor', e.target.value)}
                          className="w-full h-10 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer"
                          title="Pick any chroma key color"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Overlay Mode</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'timer', label: 'Countdown Timer', icon: <Clock size={16} /> },
                        { id: 'clock', label: 'System Clock', icon: <Watch size={16} /> },
                        { id: 'lowerThird', label: 'Program Info', icon: <Type size={16} /> }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => updateStagedOverlaySetting('mode', m.id)}
                          className={`flex items-center space-x-3 px-5 py-3 rounded-xl font-bold transition-all border ${stagedOverlaySettings.mode === m.id ? 'bg-blue-600 text-white border-blue-400 shadow-lg scale-[1.02]' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Window (Simulated) */}
                <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-700">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4 text-center">STAGING PREVIEW</label>
                  <div 
                    className="aspect-video rounded-lg relative overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-700 shadow-inner"
                    style={{ backgroundColor: stagedOverlaySettings.bgColor }}
                  >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    
                    {stagedOverlaySettings.mode === 'lowerThird' ? (
                      <div 
                        className="absolute transform transition-all"
                        style={{ 
                          left: `${stagedOverlaySettings.x}%`,
                          top: `${stagedOverlaySettings.y}%`,
                          transform: `translate(-50%, -50%) scale(${(stagedOverlaySettings.timer / 100) * 0.35})`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <div className={`flex items-center space-x-4 p-1 rounded-xl shadow-2xl border-l-[8px] border-blue-600 ${stagedOverlaySettings.lowerThirdTheme === 'light' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                          <div className="w-16 h-16 bg-blue-600/10 rounded-lg flex items-center justify-center overflow-hidden">
                            {stagedOverlaySettings.lowerThirdImage ? (
                              <img src={stagedOverlaySettings.lowerThirdImage} className="w-full h-full object-cover" />
                            ) : (
                              <User size={32} className="opacity-50" />
                            )}
                          </div>
                          <div className="pr-6 py-2">
                            <div className="font-black uppercase tracking-widest opacity-60" style={{ fontSize: `${stagedOverlaySettings.lowerThirdTitleSize}px` }}>{stagedOverlaySettings.lowerThirdTitle || 'PROGRAM TITLE'}</div>
                            <div className="font-black tracking-tight leading-none" style={{ fontSize: `${stagedOverlaySettings.lowerThirdSubtitleSize}px` }}>{stagedOverlaySettings.lowerThirdSubtitle || 'MAIN SUBTITLE'}</div>
                            <div className="font-bold opacity-80 border-t border-current/10 pt-1 uppercase tracking-wider" style={{ fontSize: `${stagedOverlaySettings.lowerThirdDateSize}px` }}>{stagedOverlaySettings.lowerThirdDate || 'MINISTER NAME'}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`font-mono font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all ${stagedOverlaySettings.mode === 'timer' && greenScreenTimer.minutes === 0 && greenScreenTimer.isRunning && !greenScreenTimer.isPaused ? 'animate-flash-zoom' : ''}`}
                        style={{ 
                          fontSize: `${(stagedOverlaySettings.mode === 'timer' ? stagedOverlaySettings.timerFontSize : stagedOverlaySettings.clockFontSize) * (stagedOverlaySettings.timer / 100) * 0.8}px`,
                          position: 'absolute',
                          left: `${stagedOverlaySettings.x}%`,
                          top: `${stagedOverlaySettings.y}%`,
                          transform: 'translate(-50%, -50%)',
                          display: stagedOverlaySettings.mode === 'timer' && greenScreenTimer.minutes === 0 && greenScreenTimer.seconds === 0 && greenScreenTimer.isRunning ? 'none' : 'block',
                          animationDelay: '0s'
                        }}
                      >
                        {stagedOverlaySettings.mode === 'timer' ? '00:00' : currentTime}
                      </div>
                    )}
                  </div>
                </div>
              </div>

                {/* Control Column */}
                <div className="lg:col-span-8 space-y-6">
                  {stagedOverlaySettings.mode === 'lowerThird' ? (
                    <div className="bg-gray-900/80 p-8 rounded-3xl border border-gray-700 space-y-10 shadow-2xl">
                      <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                            <Type size={24} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white tracking-tight">Program Info Editor</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Content & Metadata</p>
                          </div>
                        </div>
                        <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                          <button 
                            onClick={() => updateStagedOverlaySetting('lowerThirdTheme', 'dark')}
                            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${stagedOverlaySettings.lowerThirdTheme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                          >
                            DARK
                          </button>
                          <button 
                            onClick={() => updateStagedOverlaySetting('lowerThirdTheme', 'light')}
                            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${stagedOverlaySettings.lowerThirdTheme === 'light' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                          >
                            LIGHT
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Text Fields Column (7 cols) */}
                        <div className="md:col-span-7 space-y-6">
                          {[
                            { label: 'Program Name', key: 'lowerThirdTitle', sizeKey: 'lowerThirdTitleSize', placeholder: 'e.g. SUNDAY SERVICE' },
                            { label: 'Message Title', key: 'lowerThirdSubtitle', sizeKey: 'lowerThirdSubtitleSize', placeholder: 'e.g. FAITH OF THE FAITHFUL', isLarge: true },
                            { label: 'Minister/Speaker', key: 'lowerThirdDate', sizeKey: 'lowerThirdDateSize', placeholder: 'e.g. PASTOR JOHN DOE' }
                          ].map((field) => (
                            <div key={field.key} className="space-y-2">
                              <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{field.label}</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black text-gray-600 uppercase">Size</span>
                                  <input 
                                    type="number" 
                                    value={stagedOverlaySettings[field.sizeKey as keyof OverlaySettings] as number}
                                    onChange={(e) => updateStagedOverlaySetting(field.sizeKey as any, parseInt(e.target.value))}
                                    className="w-14 bg-gray-800 text-blue-400 border border-gray-700 rounded-lg px-2 py-1 text-xs font-black focus:ring-1 focus:ring-blue-500 outline-none text-center"
                                  />
                                </div>
                              </div>
                              <input 
                                type="text"
                                value={stagedOverlaySettings[field.key as keyof OverlaySettings] as string}
                                onChange={(e) => updateStagedOverlaySetting(field.key as any, e.target.value)}
                                placeholder={field.placeholder}
                                className={`w-full bg-gray-800/50 text-white px-5 py-4 rounded-2xl border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all ${field.isLarge ? 'text-lg font-black' : ''}`}
                              />
                            </div>
                          ))}

                          {/* Position & Scale Sliders */}
                          <div className="pt-8 space-y-6 border-t border-gray-800/50">
                            {[
                              { label: 'Horizontal Position (X)', key: 'x', min: 0, max: 100, unit: '%' },
                              { label: 'Vertical Position (Y)', key: 'y', min: 0, max: 100, unit: '%' },
                              { label: 'Overall Display Scale', key: 'timer', min: 10, max: 200, unit: '%' }
                            ].map((slider) => (
                              <div key={slider.key} className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{slider.label}</label>
                                  <span className="text-xs font-mono font-black text-blue-400">{stagedOverlaySettings[slider.key as keyof OverlaySettings]}{slider.unit}</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={slider.min} 
                                  max={slider.max} 
                                  value={stagedOverlaySettings[slider.key as keyof OverlaySettings] as number} 
                                  onChange={(e) => updateStagedOverlaySetting(slider.key as any, parseInt(e.target.value))} 
                                  className="range-knob" 
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Media & Timing Column (5 cols) */}
                        <div className="md:col-span-5 space-y-8">
                          <div className="bg-gray-800/30 p-6 rounded-3xl border border-gray-700/50 space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Minister Image</label>
                            <div className="relative group">
                              <div className="w-full aspect-square bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500/50">
                                {stagedOverlaySettings.lowerThirdImage ? (
                                  <img src={stagedOverlaySettings.lowerThirdImage} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center gap-3">
                                    <User size={48} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No Image Set</span>
                                  </div>
                                )}
                                <input 
                                  type="file" accept="image/*" onChange={handleImageUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                />
                                <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none z-10 gap-2">
                                  <Monitor size={24} className="text-white" />
                                  <span className="text-xs font-black text-white uppercase tracking-tighter">Click to Upload</span>
                                </div>
                              </div>
                              {stagedOverlaySettings.lowerThirdImage && (
                                <button 
                                  onClick={() => updateStagedOverlaySetting('lowerThirdImage', undefined)}
                                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-all z-30"
                                  title="Remove Image"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-600 font-bold text-center leading-relaxed">Square images (400x400) work best.</p>
                          </div>

                          <div className="bg-gray-800/30 p-6 rounded-3xl border border-gray-700/50 space-y-6">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Animation Cycle</label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <span className="text-[8px] font-black text-gray-600 uppercase block text-center">Display (s)</span>
                                <input 
                                  type="number" min="1"
                                  value={stagedOverlaySettings.lowerThirdDisplaySeconds}
                                  onChange={(e) => updateStagedOverlaySetting('lowerThirdDisplaySeconds', parseInt(e.target.value))}
                                  className="w-full bg-gray-900 text-white py-3 rounded-xl border border-gray-700 font-black focus:ring-2 focus:ring-blue-500 outline-none text-center"
                                />
                              </div>
                              <div className="space-y-2">
                                <span className="text-[8px] font-black text-gray-600 uppercase block text-center">Sleep (s)</span>
                                <input 
                                  type="number" min="0"
                                  value={stagedOverlaySettings.lowerThirdSleepSeconds}
                                  onChange={(e) => updateStagedOverlaySetting('lowerThirdSleepSeconds', parseInt(e.target.value))}
                                  className="w-full bg-gray-900 text-white py-3 rounded-xl border border-gray-700 font-black focus:ring-2 focus:ring-blue-500 outline-none text-center"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="bg-gray-900/80 p-8 rounded-2xl border border-gray-700 space-y-8">
                    <div 
                      className="flex flex-col items-center justify-center py-10 rounded-3xl border border-gray-800 shadow-inner relative overflow-hidden"
                      style={{ backgroundColor: stagedOverlaySettings.bgColor }}
                    >
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      <div className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-4 relative z-10">Live Output Preview</div>
                      <div 
                        className={`font-mono font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10 ${stagedOverlaySettings.mode === 'timer' && greenScreenTimer.minutes === 0 && greenScreenTimer.isRunning && !greenScreenTimer.isPaused ? 'animate-flash-zoom' : ''}`}
                        style={{ 
                          fontSize: `${(stagedOverlaySettings.mode === 'timer' ? stagedOverlaySettings.timerFontSize : stagedOverlaySettings.clockFontSize) * (stagedOverlaySettings.timer / 100)}px`,
                          position: 'absolute',
                          left: `${stagedOverlaySettings.x}%`,
                          top: `${stagedOverlaySettings.y}%`,
                          transform: 'translate(-50%, -50%)',
                          display: stagedOverlaySettings.mode === 'timer' && greenScreenTimer.minutes === 0 && greenScreenTimer.seconds === 0 && greenScreenTimer.isRunning ? 'none' : 'block',
                          animationDelay: '0s'
                        }}
                      >
                        {stagedOverlaySettings.mode === 'timer' 
                          ? `${String(greenScreenTimer.minutes).padStart(2, '0')}:${String(greenScreenTimer.seconds).padStart(2, '0')}`
                          : currentTime
                        }
                      </div>
                      
                      {stagedOverlaySettings.mode === 'timer' && (
                        <div className="mt-8 flex gap-4">
                          {!greenScreenTimer.isRunning ? (
                            <button onClick={startGreenScreenTimer} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl flex items-center gap-3 font-black transition-all shadow-xl shadow-green-900/20"><Play size={20} /> START</button>
                          ) : (
                            <>
                              <button onClick={greenScreenTimer.isPaused ? resumeGreenScreenTimer : pauseGreenScreenTimer} className={`px-8 py-3 rounded-xl flex items-center gap-3 font-black transition-all shadow-xl ${greenScreenTimer.isPaused ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20'} text-white`}>
                                {greenScreenTimer.isPaused ? <Play size={20} /> : <Pause size={20} />} {greenScreenTimer.isPaused ? 'RESUME' : 'PAUSE'}
                              </button>
                              <button onClick={resetGreenScreenTimer} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl flex items-center gap-3 font-black transition-all shadow-xl shadow-red-900/20"><RotateCcw size={20} /> RESET</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {stagedOverlaySettings.mode === 'timer' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {[-10, -5, -1].map(m => (
                            <button key={m} onClick={() => handleGreenScreenTimeAdjust(m)} className="bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3 rounded-xl font-black border border-red-900/30 transition-all">{m}m</button>
                          ))}
                          {[1, 5, 10].map(m => (
                            <button key={m} onClick={() => handleGreenScreenTimeAdjust(m)} className="bg-green-600/10 hover:bg-green-600/20 text-green-500 py-3 rounded-xl font-black border border-green-900/30 transition-all">+{m}m</button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {[-30, -10, -5].map(s => (
                            <button key={s} onClick={() => handleGreenScreenSecondsAdjust(s)} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 py-2 rounded-xl font-bold border border-red-900/20 transition-all text-xs">{s}s</button>
                          ))}
                          {[5, 10, 30].map(s => (
                            <button key={s} onClick={() => handleGreenScreenSecondsAdjust(s)} className="bg-green-600/10 hover:bg-green-600/20 text-green-400 py-2 rounded-xl font-bold border border-green-900/20 transition-all text-xs">+{s}s</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-800">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Horizontal Position (X)</label>
                        <div className="flex items-center gap-4">
                          <input type="range" min="0" max="100" value={stagedOverlaySettings.x} onChange={(e) => updateStagedOverlaySetting('x', parseInt(e.target.value))} className="range-knob" />
                          <span className="text-xs font-mono font-black text-blue-400 w-10">{stagedOverlaySettings.x}%</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Vertical Position (Y)</label>
                        <div className="flex items-center gap-4">
                          <input type="range" min="0" max="100" value={stagedOverlaySettings.y} onChange={(e) => updateStagedOverlaySetting('y', parseInt(e.target.value))} className="range-knob" />
                          <span className="text-xs font-mono font-black text-blue-400 w-10">{stagedOverlaySettings.y}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Font Size</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" min="5" max="50" 
                            value={stagedOverlaySettings.mode === 'timer' ? stagedOverlaySettings.timerFontSize : stagedOverlaySettings.clockFontSize} 
                            onChange={(e) => updateStagedOverlaySetting(stagedOverlaySettings.mode === 'timer' ? 'timerFontSize' : 'clockFontSize', parseInt(e.target.value))} 
                            className="range-knob" 
                          />
                          <span className="text-xs font-mono font-black text-blue-400 w-10">{stagedOverlaySettings.mode === 'timer' ? stagedOverlaySettings.timerFontSize : stagedOverlaySettings.clockFontSize}vw</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Overall Scale</label>
                        <div className="flex items-center gap-4">
                          <input type="range" min="10" max="200" value={stagedOverlaySettings.timer} onChange={(e) => updateStagedOverlaySetting('timer', parseInt(e.target.value))} className="range-knob" />
                          <span className="text-xs font-mono font-black text-blue-400 w-10">{stagedOverlaySettings.timer}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full xl:max-w-[1600px] 2xl:max-w-[1900px]">
            <HowToGuide variant="page" initialSection={guideSection} />
          </div>
        )}
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
