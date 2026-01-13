import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bike, Booking, MechanicIssue, HeightRange, Pricing, BikeSize, Coupon, BikeMaintenanceLog, PartInventory, SessionType } from './types';
import { MAX_HEIGHT_DEVIATION } from './inventory';

// NOTE: Admin users are now managed through Supabase Auth
// The initialAdminUsers and related functions have been removed for security
// All authentication is now handled server-side

// Initial fleet of 20 bikes
const initialBikes: Bike[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  size: (['S', 'M', 'L', 'XL'] as BikeSize[])[Math.floor(i / 5)],
  lockCode: String(1000 + Math.floor(Math.random() * 9000)),
  status: 'available' as const,
  stickerNumber: `R${String(i + 1).padStart(2, '0')}`,
}));

const initialHeightRanges: HeightRange[] = [
  { size: 'S', minHeight: 140, maxHeight: 155 },
  { size: 'M', minHeight: 156, maxHeight: 170 },
  { size: 'L', minHeight: 171, maxHeight: 185 },
  { size: 'XL', minHeight: 186, maxHeight: 210 },
];

const initialPricing: Pricing = {
  morningSession: 80,
  dailySession: 120,
  picnic: 160,
  lateFee: 120,
  theftFee: 2500,
  securityHold: 500,
};

// Generate unique coupon code
const generateCouponCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RAMON5-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const initialParts: PartInventory[] = [
  { id: '1', name: 'צמיג 26"', quantity: 10, minQuantity: 5, needsOrder: false },
  { id: '2', name: 'צמיג 29"', quantity: 8, minQuantity: 4, needsOrder: false },
  { id: '3', name: 'שרשרת', quantity: 6, minQuantity: 3, needsOrder: false },
  { id: '4', name: 'רפידות בלם', quantity: 12, minQuantity: 6, needsOrder: false },
  { id: '5', name: 'פנימית 26"', quantity: 15, minQuantity: 8, needsOrder: false },
  { id: '6', name: 'פנימית 29"', quantity: 12, minQuantity: 6, needsOrder: false },
];

interface AppState {
  bikes: Bike[];
  bookings: Booking[];
  mechanicIssues: MechanicIssue[];
  heightRanges: HeightRange[];
  pricing: Pricing;
  currentBooking: Partial<Booking> | null;
  coupons: Coupon[];
  maintenanceLogs: BikeMaintenanceLog[];
  partsInventory: PartInventory[];
  
  // Bike actions
  updateBike: (id: number, updates: Partial<Bike>) => void;
  setBikeStatus: (id: number, status: Bike['status']) => void;
  addBike: () => void;
  removeBike: (id: number) => void;
  
  // Booking actions
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  setCurrentBooking: (booking: Partial<Booking> | null) => void;
  
  // Mechanic actions
  addMechanicIssue: (issue: MechanicIssue) => void;
  resolveIssue: (id: string) => void;
  addMaintenanceLog: (log: BikeMaintenanceLog) => void;
  updateMaintenanceLog: (id: string, updates: Partial<BikeMaintenanceLog>) => void;
  deleteMaintenanceLog: (id: string) => void;
  updatePartsInventory: (parts: PartInventory[]) => void;
  
  // NOTE: Admin users are now managed through Supabase Auth
  // The following functions have been deprecated and removed for security
  
  // Settings actions
  updateHeightRanges: (ranges: HeightRange[]) => void;
  updatePricing: (pricing: Pricing) => void;
  
  // Coupon actions
  createCoupon: (bookingId: string) => string;
  createManualCoupon: (amount: number, discountType: 'percent' | 'fixed', verificationEmail: string) => Coupon;
  verifyCoupon: (couponId: string) => void;
  validateCouponCode: (code: string) => { valid: boolean; coupon?: Coupon; error?: string };
  markCouponUsed: (code: string, bookingId: string) => void;
  
  // Utility functions
  getAvailableBikes: (date: string, session: string) => Bike[];
  getSizeForHeight: (height: number) => BikeSize | null;
  findBestBike: (height: number, date: string, session: string, excludeBikeIds?: number[]) => Bike | null;
  isHeightWithinTolerance: (height: number, size: BikeSize, tolerance?: number) => boolean;
  getAvailableBikesBySize: (date: string, session: string, size: BikeSize) => Bike[];
  
  // Inventory functions
  getBookedBikesCount: (date: string, session?: string) => number;
  getBookingsForDate: (date: string) => Booking[];
  checkInventoryAvailability: (date: string, session: string, requestedBikes: number) => { available: boolean; remainingBikes: number };
  getTotalBikes: () => number;
  
  // Dynamic availability functions
  getBikesCountBySize: () => Record<BikeSize, number>;
  getAvailabilityBySize: (date: string, session: SessionType) => Array<{
    size: BikeSize;
    available: number;
    total: number;
    minHeight: number;
    maxHeight: number;
  }>;
  getTotalActiveBikes: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      bikes: initialBikes,
      bookings: [],
      mechanicIssues: [],
      heightRanges: initialHeightRanges,
      pricing: initialPricing,
      currentBooking: null,
      coupons: [],
      maintenanceLogs: [],
      partsInventory: initialParts,
      // NOTE: adminUsers removed - now managed through Supabase Auth

      updateBike: (id, updates) =>
        set((state) => ({
          bikes: state.bikes.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      setBikeStatus: (id, status) =>
        set((state) => ({
          bikes: state.bikes.map((b) => (b.id === id ? { ...b, status } : b)),
        })),

      addBike: () =>
        set((state) => {
          const newId = Math.max(...state.bikes.map(b => b.id)) + 1;
          const newBike: Bike = {
            id: newId,
            size: 'M',
            lockCode: String(1000 + Math.floor(Math.random() * 9000)),
            status: 'available',
            stickerNumber: `R${String(newId).padStart(2, '0')}`,
          };
          return { bikes: [...state.bikes, newBike] };
        }),

      removeBike: (id) =>
        set((state) => ({
          bikes: state.bikes.filter((b) => b.id !== id),
        })),

      addBooking: (booking) =>
        set((state) => ({ bookings: [...state.bookings, booking] })),

      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b as any)),
        })),

      setCurrentBooking: (booking) => set({ currentBooking: booking }),

      addMechanicIssue: (issue) =>
        set((state) => {
          const updatedBikes = state.bikes.map((b) =>
            b.id === issue.bikeId ? { ...b, status: 'maintenance' as const } : b
          );
          return {
            mechanicIssues: [...state.mechanicIssues, issue],
            bikes: updatedBikes,
          };
        }),

      resolveIssue: (id) =>
        set((state) => {
          const issue = state.mechanicIssues.find((i) => i.id === id);
          if (!issue) return state;
          
          return {
            mechanicIssues: state.mechanicIssues.map((i) =>
              i.id === id ? { ...i, resolved: true, resolvedAt: new Date().toISOString() } : i
            ),
            bikes: state.bikes.map((b) =>
              b.id === issue.bikeId ? { ...b, status: 'available' as const } : b
            ),
          };
        }),

      addMaintenanceLog: (log) =>
        set((state) => ({ maintenanceLogs: [...state.maintenanceLogs, log] })),

      updateMaintenanceLog: (id, updates) =>
        set((state) => ({
          maintenanceLogs: state.maintenanceLogs.map((log) =>
            log.id === id ? { ...log, ...updates } : log
          ),
        })),

      deleteMaintenanceLog: (id) =>
        set((state) => ({
          maintenanceLogs: state.maintenanceLogs.filter((log) => log.id !== id),
        })),

      updatePartsInventory: (parts) =>
        set(() => ({ partsInventory: parts })),

      // NOTE: Admin user management has been removed
      // Users are now managed through Supabase Auth (see useAuth hook)

      updateHeightRanges: (ranges) => set({ heightRanges: ranges }),
      updatePricing: (pricing) => set({ pricing }),

      createCoupon: (bookingId) => {
        const code = generateCouponCode();
        const coupon: Coupon = {
          id: String(Date.now()),
          code,
          discount: 5,
          discountType: 'percent',
          createdAt: new Date().toISOString(),
          bookingId,
        };
        set((state) => ({
          coupons: [...state.coupons, coupon],
          bookings: state.bookings.map((b) => 
            b.id === bookingId ? { ...b, couponCode: code } : b
          ),
        }));
        return code;
      },

      createManualCoupon: (amount, discountType, verificationEmail) => {
        const code = generateCouponCode();
        const coupon: Coupon = {
          id: String(Date.now()),
          code,
          discount: amount,
          discountType,
          createdAt: new Date().toISOString(),
          isManual: true,
          verificationEmail,
          verified: false,
        };
        set((state) => ({ coupons: [...state.coupons, coupon] }));
        return coupon;
      },

      verifyCoupon: (couponId) =>
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.id === couponId ? { ...c, verified: true } : c
          ),
        })),

      validateCouponCode: (code) => {
        const state = get();
        const coupon = state.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
        
        if (!coupon) {
          return { valid: false, error: 'couponNotFound' };
        }
        
        if (coupon.usedAt) {
          return { valid: false, error: 'couponAlreadyUsed' };
        }
        
        return { valid: true, coupon };
      },

      markCouponUsed: (code, bookingId) =>
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.code.toUpperCase() === code.toUpperCase() 
              ? { ...c, usedAt: new Date().toISOString(), usedByBookingId: bookingId } 
              : c
          ),
        })),

      getAvailableBikes: (date, session) => {
        const state = get();
        
        // Get all bike IDs that are already booked for this date/session
        const rentedBikeIds = state.bookings
          .filter((b) => b.date === date && b.session === session && b.status !== 'cancelled' && b.status !== 'completed')
          .flatMap((b) => b.riders.map((r) => r.assignedBike))
          .filter(Boolean) as number[];

        // Only return bikes that are:
        // 1. Status is 'available' (not maintenance, rented, or unavailable)
        // 2. Not already booked for this date/session
        return state.bikes.filter(
          (b) => b.status === 'available' && !rentedBikeIds.includes(b.id)
        );
      },

      getSizeForHeight: (height) => {
        const { heightRanges } = get();
        const range = heightRanges.find(
          (r) => height >= r.minHeight && height <= r.maxHeight
        );
        return range?.size || null;
      },

      findBestBike: (height, date, session, excludeBikeIds: number[] = []) => {
        const state = get();
        const idealSize = state.getSizeForHeight(height);
        if (!idealSize) return null;

        // Get available bikes and exclude any already selected in this booking
        const availableBikes = state.getAvailableBikes(date, session)
          .filter(b => !excludeBikeIds.includes(b.id));
        
        // Try ideal size first
        let bike = availableBikes.find((b) => b.size === idealSize);
        if (bike) return bike;

        // Try adjacent sizes - but only if within 30% height tolerance
        const sizeOrder: BikeSize[] = ['S', 'M', 'L', 'XL'];
        const idealIndex = sizeOrder.indexOf(idealSize);
        
        // Try one size up, then one size down (only within tolerance)
        for (const offset of [1, -1, 2, -2]) {
          const tryIndex = idealIndex + offset;
          if (tryIndex >= 0 && tryIndex < sizeOrder.length) {
            const trySize = sizeOrder[tryIndex];
            
            // Only consider this size if height is within tolerance
            if (state.isHeightWithinTolerance(height, trySize, MAX_HEIGHT_DEVIATION)) {
              bike = availableBikes.find((b) => b.size === trySize);
              if (bike) return bike;
            }
          }
        }

        return null;
      },

      isHeightWithinTolerance: (height, size, tolerance = MAX_HEIGHT_DEVIATION) => {
        const { heightRanges } = get();
        const sizeRange = heightRanges.find(r => r.size === size);
        if (!sizeRange) return false;
        
        // Calculate center of the size range
        const sizeCenter = (sizeRange.minHeight + sizeRange.maxHeight) / 2;
        
        // Calculate deviation percentage
        const deviation = Math.abs(height - sizeCenter) / sizeCenter;
        
        return deviation <= tolerance;
      },

      getAvailableBikesBySize: (date, session, size) => {
        return get().getAvailableBikes(date, session).filter(b => b.size === size);
      },

      // Get total number of bikes booked for a specific date (optionally filtered by session)
      getBookedBikesCount: (date, session?) => {
        const state = get();
        let filteredBookings = state.bookings.filter(
          (b) => b.date === date && b.status !== 'cancelled' && b.status !== 'completed'
        );
        
        if (session) {
          filteredBookings = filteredBookings.filter((b) => b.session === session);
        }
        
        return filteredBookings.reduce((sum, b) => sum + b.riders.length, 0);
      },

      // Get all bookings for a specific date
      getBookingsForDate: (date) => {
        const state = get();
        return state.bookings.filter(
          (b) => b.date === date && b.status !== 'cancelled'
        );
      },

      // Check if requested number of bikes is available for date/session
      checkInventoryAvailability: (date, session, requestedBikes) => {
        const state = get();
        const bookedCount = state.getBookedBikesCount(date, session);
        const totalActive = state.getTotalActiveBikes();
        const remainingBikes = Math.max(0, totalActive - bookedCount);
        
        return {
          available: requestedBikes <= remainingBikes,
          remainingBikes,
        };
      },

      // Get total bikes in inventory (using TOTAL_BIKES constant for backward compat)
      getTotalBikes: () => {
        return get().getTotalActiveBikes();
      },

      // Get count of bikes by size (only available/rented status)
      getBikesCountBySize: () => {
        const state = get();
        const countableStatuses = ['available', 'rented'];
        const countable = state.bikes.filter(b => countableStatuses.includes(b.status));
        
        return {
          XS: countable.filter(b => b.size === 'XS').length,
          S: countable.filter(b => b.size === 'S').length,
          M: countable.filter(b => b.size === 'M').length,
          L: countable.filter(b => b.size === 'L').length,
          XL: countable.filter(b => b.size === 'XL').length,
        };
      },

      // Get availability by size for a specific date/session
      getAvailabilityBySize: (date, session) => {
        const state = get();
        const sizes: BikeSize[] = ['S', 'M', 'L', 'XL'];
        
        return sizes.map(size => {
          // All bikes in this size (excluding unavailable)
          const totalInSize = state.bikes.filter(
            b => b.size === size && b.status !== 'unavailable'
          ).length;
          
          // Available bikes for this date/session
          const availableInSize = state.getAvailableBikesBySize(date, session, size).length;
          
          // Get height range for this size
          const heightRange = state.heightRanges.find(r => r.size === size);
          
          return {
            size,
            available: availableInSize,
            total: totalInSize,
            minHeight: heightRange?.minHeight || 0,
            maxHeight: heightRange?.maxHeight || 0,
          };
        });
      },

      // Get total active bikes (not unavailable)
      getTotalActiveBikes: () => {
        const state = get();
        return state.bikes.filter(b => b.status !== 'unavailable').length;
      },
    }),
    {
      name: 'bikerentramon-storage-v3',
    }
  )
);
