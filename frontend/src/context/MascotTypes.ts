import { createContext } from 'react';

export type MascotState =
  | 'idle'
  | 'got-files'
  | 'reading'
  | 'scanning'
  | 'analyzing'
  | 'masking'
  | 'success'
  | 'backend-error'
  | 'error'
  | 'taking-bit'
  | 'peeking'
  | 'happy'
  | 'confused';

export const RAPIT_TIMINGS: Record<MascotState, number> = {
  idle: 1200,
  'got-files': 1500,
  reading: 1500,
  scanning: 1800,
  analyzing: 1500,
  masking: 1800,
  success: 2000,
  'backend-error': 2000,
  error: 2000,
  'taking-bit': 1500,
  peeking: 1500,
  happy: 1200,
  confused: 1500,
};

export interface MascotContextType {
  state: MascotState;
  message: string | null;
  visible: boolean;
  onRetry?: (() => void) | null;
  showCompanion: (
    state: MascotState,
    message?: string,
    options?: { autoHideMs?: number; onRetry?: () => void }
  ) => void;
  transitionCompanion: (
    nextState: MascotState,
    nextMessage?: string,
    options?: { autoHideMs?: number; onRetry?: () => void }
  ) => Promise<void>;
  waitForCurrentStateMinDuration: () => Promise<void>;
  hideCompanion: (respectMinDuration?: boolean) => Promise<void>;
}

export const MascotContext = createContext<MascotContextType | undefined>(undefined);
