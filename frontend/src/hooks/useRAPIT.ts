import { useContext } from 'react';
import { MascotContext } from '../context/MascotTypes';

export const useRAPIT = () => {
  const context = useContext(MascotContext);
  if (!context) {
    throw new Error('useRAPIT must be used within a MascotProvider');
  }
  return context;
};
