import type { BikeSize } from './types';

// Global inventory configuration
export const TOTAL_FLEET = 15;          // Total physical bikes in fleet
export const RESERVE_BIKES = 0;         // Reserve bikes concept deprecated in favor of explicit status
export const ONLINE_AVAILABLE_CAP = 15; // Base capacity, but real availability counts 'status=available'

// Legacy alias for backwards compatibility
export const TOTAL_BIKES = ONLINE_AVAILABLE_CAP;

// Bikes per size - approximate distribution for reference (actual source of truth is DB)
export const BIKES_PER_SIZE: Record<BikeSize, number> = {
  XS: 0,
  S: 4,
  M: 5,
  L: 4,
  XL: 2,
};

// Maximum height deviation allowed when matching bikes (30%)
export const MAX_HEIGHT_DEVIATION = 0.30;

// Occupancy thresholds for color coding
export const OCCUPANCY_THRESHOLDS = {
  LOW: 0.4,      // 0-40% = Green
  MEDIUM: 0.8,   // 41-80% = Orange  
  HIGH: 1.0,     // 81-99% = Red
  // 100% = Black/Gray (Sold Out)
};

export type OccupancyLevel = 'low' | 'medium' | 'high' | 'full';

export function getOccupancyLevel(bookedBikes: number, totalBikes: number = TOTAL_BIKES): OccupancyLevel {
  const occupancy = bookedBikes / totalBikes;

  if (occupancy >= 1) return 'full';
  if (occupancy > OCCUPANCY_THRESHOLDS.MEDIUM) return 'high';
  if (occupancy > OCCUPANCY_THRESHOLDS.LOW) return 'medium';
  return 'low';
}

export function getOccupancyColor(level: OccupancyLevel): string {
  switch (level) {
    case 'low': return 'bg-green-500';
    case 'medium': return 'bg-orange-500';
    case 'high': return 'bg-red-500';
    case 'full': return 'bg-gray-500';
  }
}

export function getOccupancyTextColor(level: OccupancyLevel): string {
  switch (level) {
    case 'low': return 'text-green-500';
    case 'medium': return 'text-orange-500';
    case 'high': return 'text-red-500';
    case 'full': return 'text-gray-500';
  }
}

export function getOccupancyBorderColor(level: OccupancyLevel): string {
  switch (level) {
    case 'low': return 'border-green-500';
    case 'medium': return 'border-orange-500';
    case 'high': return 'border-red-500';
    case 'full': return 'border-gray-500';
  }
}

export function getAvailableBikesCount(bookedBikes: number, totalBikes: number = TOTAL_BIKES): number {
  return Math.max(0, totalBikes - bookedBikes);
}
