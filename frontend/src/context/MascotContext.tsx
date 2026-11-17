import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  MascotContext,
  type MascotState,
  RAPIT_TIMINGS,
} from './MascotTypes';

export const MascotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MascotState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [onRetry, setOnRetry] = useState<(() => void) | null>(null);

  const stateStartTimeRef = useRef<number>(0);
  const currentStateRef = useRef<MascotState>('idle');
  const isVisibleRef = useRef<boolean>(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    currentStateRef.current = state;
    isVisibleRef.current = visible;
  }, [state, visible]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const waitForCurrentStateMinDuration = useCallback((): Promise<void> => {
    if (!isVisibleRef.current) return Promise.resolve();

    const minDuration = RAPIT_TIMINGS[currentStateRef.current] || 1200;
    const elapsed = Date.now() - stateStartTimeRef.current;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining <= 0) return Promise.resolve();

    return new Promise((resolve) => {
      window.setTimeout(resolve, remaining);
    });
  }, []);

  const hideCompanion = useCallback(
    async (respectMinDuration: boolean = false): Promise<void> => {
      clearHideTimer();

      if (respectMinDuration) {
        await waitForCurrentStateMinDuration();
      }

      isVisibleRef.current = false;
      setVisible(false);
      setOnRetry(null);
    },
    [clearHideTimer, waitForCurrentStateMinDuration]
  );

  const showCompanion = useCallback(
    (
      newState: MascotState,
      newMessage?: string,
      options?: { autoHideMs?: number; onRetry?: () => void }
    ) => {
      clearHideTimer();

      stateStartTimeRef.current = Date.now();
      currentStateRef.current = newState;
      isVisibleRef.current = true;
      setState(newState);

      if (newMessage !== undefined) {
        setMessage(newMessage);
      }
      setOnRetry(options?.onRetry ? () => options.onRetry! : null);
      setVisible(true);

      if (options?.autoHideMs && options.autoHideMs > 0) {
        const minDuration = RAPIT_TIMINGS[newState] || 1200;
        const duration = Math.max(options.autoHideMs, minDuration);

        hideTimerRef.current = window.setTimeout(() => {
          isVisibleRef.current = false;
          setVisible(false);
          hideTimerRef.current = null;
        }, duration);
      }
    },
    [clearHideTimer]
  );

  const transitionCompanion = useCallback(
    async (
      nextState: MascotState,
      nextMessage?: string,
      options?: { autoHideMs?: number; onRetry?: () => void }
    ): Promise<void> => {
      // First ensure the previous state has fulfilled its minimum duration
      await waitForCurrentStateMinDuration();
      showCompanion(nextState, nextMessage, options);
    },
    [waitForCurrentStateMinDuration, showCompanion]
  );

  return (
    <MascotContext.Provider
      value={{
        state,
        message,
        visible,
        onRetry: onRetry || undefined,
        showCompanion,
        transitionCompanion,
        waitForCurrentStateMinDuration,
        hideCompanion,
      }}
    >
      {children}
    </MascotContext.Provider>
  );
};
