import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useRef } from 'react';

export const useBikeLocking = () => {
  const sessionId = useRef<string>(crypto.randomUUID());
  const lockedBikes = useRef<Set<number>>(new Set());

  // Lock a bike for booking
  const lockBike = useCallback(async (bikeId: number): Promise<boolean> => {
    const { data, error } = await (supabase.rpc as any)('lock_bike_for_booking', {
      _bike_id: bikeId,
      _session_id: sessionId.current,
      _lock_duration_minutes: 5
    });

    if (error) {
      console.error('Failed to lock bike:', error);
      return false;
    }

    if (data) {
      lockedBikes.current.add(bikeId);
    }

    return data as boolean;
  }, []);

  // Lock multiple bikes atomically
  const lockBikes = useCallback(async (bikeIds: number[]): Promise<boolean> => {
    // Try to lock all bikes - if any fails, release all
    const results = await Promise.all(bikeIds.map(id => lockBike(id)));
    
    if (results.some(r => !r)) {
      // Some locks failed, release all that succeeded
      await releaseAllLocks();
      return false;
    }

    return true;
  }, []);

  // Release a specific bike lock
  const releaseBikeLock = useCallback(async (bikeId: number): Promise<boolean> => {
    const { data, error } = await (supabase.rpc as any)('release_bike_lock', {
      _bike_id: bikeId,
      _session_id: sessionId.current
    });

    if (error) {
      console.error('Failed to release bike lock:', error);
      return false;
    }

    lockedBikes.current.delete(bikeId);
    return data as boolean;
  }, []);

  // Release all locks held by this session
  const releaseAllLocks = useCallback(async (): Promise<void> => {
    const bikesToRelease = Array.from(lockedBikes.current);
    await Promise.all(bikesToRelease.map(id => releaseBikeLock(id)));
    lockedBikes.current.clear();
  }, [releaseBikeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Release all locks when component unmounts
      if (lockedBikes.current.size > 0) {
        releaseAllLocks();
      }
    };
  }, [releaseAllLocks]);

  return {
    sessionId: sessionId.current,
    lockBike,
    lockBikes,
    releaseBikeLock,
    releaseAllLocks,
    lockedBikeIds: Array.from(lockedBikes.current),
  };
};
