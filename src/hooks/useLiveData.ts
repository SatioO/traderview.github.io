import { useContext } from 'react';
import { LiveDataContext } from '../contexts/LiveDataContext';
import type { LiveDataContextType } from '../contexts/LiveDataContext';

// Hook to use live data context
export const useLiveData = (): LiveDataContextType => {
  const context = useContext(LiveDataContext);
  if (context === undefined) {
    throw new Error('useLiveData must be used within a LiveDataProvider');
  }
  return context;
};

export default useLiveData;
