import { useMemo } from 'react';
import type { Bike, Booking, HeightRange, BikeSize, SessionType } from '@/lib/types';
import { MAX_HEIGHT_DEVIATION, TOTAL_FLEET, BIKES_PER_SIZE } from '@/lib/inventory';

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
    // 1. Not in maintenance or permanently unavailable
    // 2. Not already booked based on session overlap logic
    // Note: A bike with status 'rented' is currently out but IS available for future/other slots
    return bikes.filter(
      (b) => b.status !== 'maintenance' && b.status !== 'unavailable' && !rentedBikeIds.includes(b.id)
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

  // Returns total bikes available for online booking (based on active fleet)
  const getTotalActiveBikes = (): number => {
    return bikes.filter(b => b.status !== 'unavailable' && b.status !== 'maintenance').length;
  };

  // Returns actual physical bikes that are available (for internal use)
  const getPhysicalActiveBikes = (): number => {
    return bikes.filter(b => b.status !== 'unavailable' && b.status !== 'maintenance').length;
  };

  const checkInventoryAvailability = (date: string, session: string, requestedBikes: number): { available: boolean; remainingBikes: number } => {
    const bookedCount = getBookedBikesCount(date, session);
    // Use dynamic active fleet count as connection limit
    const onlineCapacity = bikes.filter(b => b.status !== 'unavailable' && b.status !== 'maintenance').length;
    const remainingBikes = Math.max(0, onlineCapacity - bookedCount);

    return {
      available: requestedBikes <= remainingBikes,
      remainingBikes,
    };
  };

  const getBikesCountBySize = (): Record<BikeSize, number> => {
    const counts: Record<BikeSize, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
    bikes.forEach(b => {
      if (b.status !== 'unavailable') {
        counts[b.size]++;
      }
    });
    return counts;
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
      // Total for this size comes dynamically from DB
      const dbTotal = bikes.filter(b => b.size === size && b.status !== 'unavailable').length;

      // Available physical (already filtered by status=available in getAvailableBikesBySize)
      const availablePhysical = getAvailableBikesBySize(date, session, size).length;

      // Get height range for this size
      const heightRange = heightRanges.find(r => r.size === size);

      return {
        size,
        available: availablePhysical,
        total: dbTotal, // Use dynamic DB total instead of config
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
