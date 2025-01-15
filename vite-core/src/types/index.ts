export interface Program {
  id: string;
  name: string;
  duration: number;
}

export interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isAttention: boolean;
}

export interface ExtraTimeState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface DisplaySizeSettings {
  timer: number;
  alert: number;
  nextProgram: number;
  alertSpeed: number; // Added alert speed setting
}