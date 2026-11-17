import React, { useState, useCallback, useRef } from 'react';
import {
  MascotContext,
  type MascotState,
} from './MascotTypes';

export const MascotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MascotState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [onRetry, setOnRetry] = useState<(() => void) | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const hideCompanion = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setVisible(false);
    setOnRetry(null);
  }, []);

  const showCompanion = useCallback(
    (
      newState: MascotState,
      newMessage?: string,
      options?: { autoHideMs?: number; onRetry?: () => void }
    ) => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      setState(newState);
      if (newMessage !== undefined) {
        setMessage(newMessage);
      }
      setOnRetry(options?.onRetry ? () => options.onRetry! : null);
      setVisible(true);

      if (options?.autoHideMs && options.autoHideMs > 0) {
        hideTimerRef.current = window.setTimeout(() => {
          setVisible(false);
          hideTimerRef.current = null;
        }, options.autoHideMs);
      }
    },
    []
  );

  return (
    <MascotContext.Provider
      value={{
        state,
        message,
        visible,
        onRetry: onRetry || undefined,
        showCompanion,
        hideCompanion,
      }}
    >
      {children}
    </MascotContext.Provider>
  );
};
