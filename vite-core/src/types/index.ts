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
  alertSpeed: number;
  clock: number;
}