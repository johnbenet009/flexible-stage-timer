export interface Program {
  id: string;
  name: string;
  duration: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isAttention: boolean;
  isComplete?: boolean;
  programName?: string;
}

export interface GreenScreenTimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
  programName?: string;
}

export interface ExtraTimeState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface OverlaySettings {
  timer: number;
  x: number;
  y: number;
  bgColor: string;
  mode: 'timer' | 'clock' | 'lowerThird';
  show: boolean;
  lowerThirdTitle: string;
  lowerThirdSubtitle: string;
  lowerThirdDate: string;
  lowerThirdLogo?: string;
  lowerThirdTheme: 'light' | 'dark';
  lowerThirdTitleSize: number;
  lowerThirdSubtitleSize: number;
  lowerThirdDateSize: number;
  lowerThirdFont: string;
  lowerThirdImage?: string;
  lowerThirdDisplaySeconds: number;
  lowerThirdSleepSeconds: number;
  timerFontSize: number;
  clockFontSize: number;
  isLive: boolean;
}

export interface DisplaySizeSettings {
  timer: number;
  alert: number;
  nextProgram: number;
  alertSpeed: number;
  clock: number;
  programName: number;
  showProgramName: boolean;
  overlay: OverlaySettings;
}