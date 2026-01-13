import { useMemo } from 'react';
import type { Bike, Booking, HeightRange, BikeSize, SessionType } from '@/lib/types';
import { MAX_HEIGHT_DEVIATION, TOTAL_BIKES } from '@/lib/inventory';

export function useBikeAvailability(
  bikes: Bike[] = [],
  bookings: Booking[] = [],
  heightRanges: HeightRange[] = []
) {
  const getAvailableBikes = (date: string, session: string): Bike[] => {
    // Calculate yesterday's date for checking daily bookings that haven't returned yet
    const currentDate = new Date(date);
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all bike IDs that are unavailable for this date/session
    // A bike is unavailable if:
    // 1. Booked for same date and same session
    // 2. Booked for daily session yesterday (not returned until morning)
    // 3. If checking morning session - also blocked by daily bookings for same day
    const rentedBikeIds = bookings
      .filter((b) => {
        if (b.status === 'cancelled' || b.status === 'completed') return false;
        
        // Same date and same session
        if (b.date === date && b.session === session) return true;
        
        // Daily booking from yesterday (bikes return in the morning)
        if (b.date === yesterdayStr && b.session === 'daily') return true;
        
        // If checking morning session, daily bookings for today also block
        if (session === 'morning' && b.date === date && b.session === 'daily') return true;
        
        // If checking daily session, morning bookings for today also block (two-way sync)
        if (session === 'daily' && b.date === date && b.session === 'morning') return true;
        
        return false;
      })
      .flatMap((b) => b.riders.map((r) => r.assignedBike))
      .filter(Boolean) as number[];

    // Only return bikes that are:
    // 1. Status is 'available' (not maintenance, rented, or unavailable)
    // 2. Not already booked based on session overlap logic
    return bikes.filter(
      (b) => b.status === 'available' && !rentedBikeIds.includes(b.id)
    );
  };

  const getSizeForHeight = (height: number): BikeSize | null => {
    const range = heightRanges.find(
      (r) => height >= r.minHeight && height <= r.maxHeight
    );
    return range?.size || null;
  };

  const isHeightWithinTolerance = (height: number, size: BikeSize, tolerance: number = MAX_HEIGHT_DEVIATION): boolean => {
    const sizeRange = heightRanges.find(r => r.size === size);
    if (!sizeRange) return false;
    
    // Calculate center of the size range
    const sizeCenter = (sizeRange.minHeight + sizeRange.maxHeight) / 2;
    
    // Calculate deviation percentage
    const deviation = Math.abs(height - sizeCenter) / sizeCenter;
    
    return deviation <= tolerance;
  };

  const findBestBike = (height: number, date: string, session: string, excludeBikeIds: number[] = []): Bike | null => {
    const idealSize = getSizeForHeight(height);
    if (!idealSize) return null;

    // Get available bikes and exclude any already selected in this booking
    const availableBikes = getAvailableBikes(date, session)
      .filter(b => !excludeBikeIds.includes(b.id));
    
    // Try ideal size first
    let bike = availableBikes.find((b) => b.size === idealSize);
    if (bike) return bike;

    // Try adjacent sizes - but only if within 30% height tolerance
    const sizeOrder: BikeSize[] = ['XS', 'S', 'M', 'L', 'XL'];
    const idealIndex = sizeOrder.indexOf(idealSize);
    
    // Try one size up, then one size down (only within tolerance)
    for (const offset of [1, -1, 2, -2]) {
      const tryIndex = idealIndex + offset;
      if (tryIndex >= 0 && tryIndex < sizeOrder.length) {
        const trySize = sizeOrder[tryIndex];
        
        // Only consider this size if height is within tolerance
        if (isHeightWithinTolerance(height, trySize, MAX_HEIGHT_DEVIATION)) {
          bike = availableBikes.find((b) => b.size === trySize);
          if (bike) return bike;
        }
      }
    }

    return null;
  };

  const getAvailableBikesBySize = (date: string, session: string, size: BikeSize): Bike[] => {
    return getAvailableBikes(date, session).filter(b => b.size === size);
  };

  const getBookedBikesCount = (date: string, session?: string): number => {
    // Calculate yesterday's date for checking daily bookings
    const currentDate = new Date(date);
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const filteredBookings = bookings.filter((b) => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      
      // If no session specified, count all bookings for this date
      if (!session) {
        return b.date === date;
      }
      
      // Same date and same session
      if (b.date === date && b.session === session) return true;
      
      // Daily booking from yesterday (bikes return in the morning)
      if (b.date === yesterdayStr && b.session === 'daily') return true;
      
      // If checking morning session, daily bookings for today also block
      if (session === 'morning' && b.date === date && b.session === 'daily') return true;
      
      // If checking daily session, morning bookings for today also block (two-way sync)
      if (session === 'daily' && b.date === date && b.session === 'morning') return true;
      
      return false;
    });
    
    return filteredBookings.reduce((sum, b) => sum + b.riders.length, 0);
  };

  const getBookingsForDate = (date: string): Booking[] => {
    return bookings.filter(
      (b) => b.date === date && b.status !== 'cancelled'
    );
  };

  // Returns total bikes available for online booking (capped at TOTAL_BIKES = 12)
  const getTotalActiveBikes = (): number => {
    // For online bookings, we always cap at TOTAL_BIKES (12) regardless of physical fleet size
    return TOTAL_BIKES;
  };

  // Returns actual physical bikes that are available (for internal use)
  const getPhysicalActiveBikes = (): number => {
    return bikes.filter(b => b.status !== 'unavailable').length;
  };

  const checkInventoryAvailability = (date: string, session: string, requestedBikes: number): { available: boolean; remainingBikes: number } => {
    const bookedCount = getBookedBikesCount(date, session);
    // Use online capacity (12) as the limit, not physical bike count
    const onlineCapacity = TOTAL_BIKES;
    const remainingBikes = Math.max(0, onlineCapacity - bookedCount);
    
    return {
      available: requestedBikes <= remainingBikes,
      remainingBikes,
    };
  };

  const getBikesCountBySize = (): Record<BikeSize, number> => {
    const countableStatuses = ['available', 'rented'];
    const countable = bikes.filter(b => countableStatuses.includes(b.status));
    
    return {
      XS: countable.filter(b => b.size === 'XS').length,
      S: countable.filter(b => b.size === 'S').length,
      M: countable.filter(b => b.size === 'M').length,
      L: countable.filter(b => b.size === 'L').length,
      XL: countable.filter(b => b.size === 'XL').length,
    };
  };

  const getAvailabilityBySize = (date: string, session: SessionType): Array<{
    size: BikeSize;
    available: number;
    total: number;
    minHeight: number;
    maxHeight: number;
  }> => {
    const sizes: BikeSize[] = ['XS', 'S', 'M', 'L', 'XL'];
    
    return sizes.map(size => {
      // All bikes in this size (excluding unavailable)
      const totalInSize = bikes.filter(
        b => b.size === size && b.status !== 'unavailable'
      ).length;
      
      // Available bikes for this date/session
      const availableInSize = getAvailableBikesBySize(date, session, size).length;
      
      // Get height range for this size
      const heightRange = heightRanges.find(r => r.size === size);
      
      return {
        size,
        available: availableInSize,
        total: totalInSize,
        minHeight: heightRange?.minHeight || 0,
        maxHeight: heightRange?.maxHeight || 0,
      };
    });
  };

  return {
    getAvailableBikes,
    getSizeForHeight,
    isHeightWithinTolerance,
    findBestBike,
    getAvailableBikesBySize,
    getBookedBikesCount,
    getBookingsForDate,
    getTotalActiveBikes,
    checkInventoryAvailability,
    getBikesCountBySize,
    getAvailabilityBySize,
  };
}
