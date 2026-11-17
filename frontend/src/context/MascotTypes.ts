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
  hideCompanion: () => void;
}

export const MascotContext = createContext<MascotContextType | undefined>(undefined);
