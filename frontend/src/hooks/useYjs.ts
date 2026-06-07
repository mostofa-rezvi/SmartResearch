import { useContext, useEffect, useState } from 'react';
import { YjsContext, YjsContextType } from '../context/YjsProvider';

export const useYjs = (): YjsContextType & { activeUsers: any[] } => {
  const context = useContext(YjsContext);
  if (!context) {
    throw new Error('useYjs must be used within a YjsProvider');
  }
  
  const { doc, provider, awareness, status, versionTrigger } = context;
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // Reactive awareness subscription
  useEffect(() => {
    if (!awareness) return;
    
    const handleAwarenessChange = () => {
      const states = Array.from(awareness.getStates().entries() as IterableIterator<[number, any]>).map(([clientId, state]) => ({
        clientId,
        ...(state as any)
      }));
      setActiveUsers(states);
    };

    awareness.on('change', handleAwarenessChange);
    // Initial populate
    handleAwarenessChange();
    
    return () => awareness.off('change', handleAwarenessChange);
  }, [awareness]);

  return { doc, provider, awareness, status, versionTrigger, activeUsers };
};
