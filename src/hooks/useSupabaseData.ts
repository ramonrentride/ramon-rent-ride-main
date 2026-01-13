import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Bike, Booking, Coupon, HeightRange, Pricing, PartInventory, BikeMaintenanceLog, BikeSize, SessionType, Rider, PicnicOrder, PicnicMenuItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Type converters for database <-> app types
const convertDbBikeToApp = (dbBike: any, lockCode: string = ''): Bike => ({
  id: dbBike.id,
  size: dbBike.size as BikeSize,
  lockCode: lockCode,
  status: dbBike.status as Bike['status'],
  stickerNumber: dbBike.sticker_number,
});

const convertDbBookingToApp = (dbBooking: any): Booking => ({
  id: dbBooking.id,
  date: dbBooking.date,
  session: dbBooking.session as SessionType,
  riders: (dbBooking.riders as any[] || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    height: r.height,
    birthDate: r.birthDate,
    isMinor: r.isMinor,
    signatureUrl: r.signatureUrl,
    guardianName: r.guardianName,
    guardianSignatureUrl: r.guardianSignatureUrl,
    assignedBike: r.assignedBike,
    assignedSize: r.assignedSize,
  })),
  picnic: dbBooking.picnic as PicnicOrder | undefined,
  status: dbBooking.status as Booking['status'],
  totalPrice: Number(dbBooking.total_price),
  securityHold: Number(dbBooking.security_hold || 0),
  safetyBriefingCompleted: dbBooking.safety_briefing_completed || false,
  bikeConditionConfirmed: dbBooking.bike_condition_confirmed || false,
  returnPhotos: dbBooking.return_photos || [],
  createdAt: dbBooking.created_at,
  phone: dbBooking.phone,
  email: dbBooking.email,
  legalAccepted: dbBooking.legal_accepted || false,
  couponCode: dbBooking.coupon_code,
  paymentMethod: dbBooking.payment_method,
});

const convertDbCouponToApp = (dbCoupon: any): Coupon => ({
  id: dbCoupon.id,
  code: dbCoupon.code,
  discount: Number(dbCoupon.discount),
  discountType: dbCoupon.discount_type as 'percent' | 'fixed',
  usedAt: dbCoupon.used_at,
  usedByBookingId: dbCoupon.used_by_booking_id,
  createdAt: dbCoupon.created_at,
  bookingId: dbCoupon.booking_id,
  isManual: dbCoupon.is_manual || false,
  verificationEmail: dbCoupon.verification_email,
  verified: dbCoupon.verified || false,
});

const convertDbHeightRangeToApp = (dbRange: any): HeightRange => ({
  size: dbRange.size as BikeSize,
  minHeight: dbRange.min_height,
  maxHeight: dbRange.max_height,
});

const convertDbPricingToApp = (dbPricing: any[]): Pricing => {
  const pricingMap: Record<string, number> = {};
  dbPricing.forEach(p => {
    pricingMap[p.key] = Number(p.value);
  });
  return {
    morningSession: pricingMap['morningSession'] || 80,
    dailySession: pricingMap['dailySession'] || 120,
    picnic: pricingMap['picnic'] || 160,
    lateFee: pricingMap['lateFee'] || 120,
    theftFee: pricingMap['theftFee'] || 2500,
    securityHold: pricingMap['securityHold'] || 500,
  };
};

const convertDbPartToApp = (dbPart: any): PartInventory => ({
  id: dbPart.id,
  name: dbPart.name,
  quantity: dbPart.quantity,
  minQuantity: dbPart.min_quantity,
  needsOrder: dbPart.needs_order || false,
});

const convertDbMaintenanceLogToApp = (dbLog: any): BikeMaintenanceLog => ({
  id: dbLog.id,
  bikeId: dbLog.bike_id,
  date: dbLog.created_at.split('T')[0],
  description: dbLog.description,
  resolved: dbLog.completed || false,
});

// ============= BIKES =============

// For staff - returns bike data (admins get lock codes separately)
export function useBikes(enabled: boolean = true) {
  return useQuery({
    queryKey: ['bikes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .order('id');
      if (error) throw error;
      return data.map(bike => convertDbBikeToApp(bike, ''));
    },
    enabled,
  });
}

// For admins only - fetch lock codes from the secure table
export function useBikeLockCodes(enabled: boolean = true) {
  return useQuery({
    queryKey: ['bikeLockCodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bike_lock_codes')
        .select('bike_id, lock_code');
      if (error) throw error;
      // Return as a map of bike_id -> lock_code
      const lockCodeMap: Record<number, string> = {};
      (data || []).forEach((item: any) => {
        lockCodeMap[item.bike_id] = item.lock_code;
      });
      return lockCodeMap;
    },
    enabled,
  });
}

// For public - returns bikes without sensitive lock_code data
export function usePublicBikes() {
  return useQuery({
    queryKey: ['publicBikes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_bikes');
      if (error) throw error;
      return (data || []).map((bike: any): Bike => ({
        id: bike.id,
        size: bike.size as BikeSize,
        lockCode: '', // Hidden for public access
        status: bike.status as Bike['status'],
        stickerNumber: bike.sticker_number,
      }));
    },
  });
}

export function useUpdateBike() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Bike> }) => {
      // Update bike table (non-sensitive fields)
      const dbUpdates: any = {};
      if (updates.size !== undefined) dbUpdates.size = updates.size;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.stickerNumber !== undefined) dbUpdates.sticker_number = updates.stickerNumber;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('bikes')
          .update(dbUpdates)
          .eq('id', id);
        if (error) throw error;
      }

      // Update lock code in separate secure table (admin only)
      if (updates.lockCode !== undefined) {
        const { error: lockError } = await supabase
          .from('bike_lock_codes')
          .update({ lock_code: updates.lockCode })
          .eq('bike_id', id);
        if (lockError) throw lockError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['bikeLockCodes'] });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון אופניים', description: String(error), variant: 'destructive' });
    },
  });
}

export function useAddBike() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bike: Omit<Bike, 'id'>) => {
      // Insert bike first (without lock code)
      const { data, error } = await supabase
        .from('bikes')
        .insert({
          size: bike.size,
          status: bike.status,
          sticker_number: bike.stickerNumber,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Insert lock code into secure table
      const { error: lockError } = await supabase
        .from('bike_lock_codes')
        .insert({
          bike_id: data.id,
          lock_code: bike.lockCode,
        });
      if (lockError) throw lockError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['bikeLockCodes'] });
      toast({ title: 'אופניים נוספו בהצלחה ✅' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת אופניים', description: String(error), variant: 'destructive' });
    },
  });
}

export function useRemoveBike() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      // Lock codes will be deleted by CASCADE
      const { error } = await supabase
        .from('bikes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['bikeLockCodes'] });
      toast({ title: 'אופניים נמחקו בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת אופניים', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= BOOKINGS =============
export function useBookings(enabled: boolean = true) {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(convertDbBookingToApp);
    },
    enabled,
  });
}

export function useAddBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id'>): Promise<string> => {
      // Use SECURITY DEFINER function to create booking (bypasses RLS SELECT requirement)
      const { data, error } = await supabase.rpc('create_booking_public', {
        _date: booking.date,
        _session: booking.session,
        _riders: booking.riders as any,
        _picnic: (booking.picnic || {}) as any,
        _status: booking.status,
        _total_price: booking.totalPrice,
        _security_hold: booking.securityHold || 0,
        _phone: booking.phone,
        _email: booking.email,
        _legal_accepted: booking.legalAccepted || false,
        _payment_method: booking.paymentMethod || null,
        _coupon_code: booking.couponCode || null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast({ title: 'שגיאה ביצירת הזמנה', description: String(error), variant: 'destructive' });
      throw error;
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const dbUpdates: any = {};
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.session !== undefined) dbUpdates.session = updates.session;
      if (updates.riders !== undefined) dbUpdates.riders = updates.riders;
      if (updates.picnic !== undefined) dbUpdates.picnic = updates.picnic;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.totalPrice !== undefined) dbUpdates.total_price = updates.totalPrice;
      if (updates.securityHold !== undefined) dbUpdates.security_hold = updates.securityHold;
      if (updates.safetyBriefingCompleted !== undefined) dbUpdates.safety_briefing_completed = updates.safetyBriefingCompleted;
      if (updates.bikeConditionConfirmed !== undefined) dbUpdates.bike_condition_confirmed = updates.bikeConditionConfirmed;
      if (updates.returnPhotos !== undefined) dbUpdates.return_photos = updates.returnPhotos;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.legalAccepted !== undefined) dbUpdates.legal_accepted = updates.legalAccepted;
      if (updates.couponCode !== undefined) dbUpdates.coupon_code = updates.couponCode;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;

      const { error } = await supabase
        .from('bookings')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון הזמנה', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= COUPONS =============
export function useCoupons(enabled: boolean = true) {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(convertDbCouponToApp);
    },
    enabled,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: coupon.code,
          discount: coupon.discount,
          discount_type: coupon.discountType,
          booking_id: coupon.bookingId,
          is_manual: coupon.isManual,
          verification_email: coupon.verificationEmail,
          verified: coupon.verified,
        })
        .select()
        .single();
      if (error) throw error;
      return convertDbCouponToApp(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error) => {
      toast({ title: 'שגיאה ביצירת קופון', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Coupon> }) => {
      const dbUpdates: any = {};
      if (updates.verified !== undefined) dbUpdates.verified = updates.verified;
      if (updates.usedAt !== undefined) dbUpdates.used_at = updates.usedAt;
      if (updates.usedByBookingId !== undefined) dbUpdates.used_by_booking_id = updates.usedByBookingId;

      const { error } = await supabase
        .from('coupons')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון קופון', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= HEIGHT RANGES =============
export function useHeightRanges() {
  return useQuery({
    queryKey: ['heightRanges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('height_ranges')
        .select('*')
        .order('min_height');
      if (error) throw error;
      return data.map(convertDbHeightRangeToApp);
    },
  });
}

export function useUpdateHeightRanges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ranges: HeightRange[]) => {
      for (const range of ranges) {
        const { error } = await supabase
          .from('height_ranges')
          .update({ min_height: range.minHeight, max_height: range.maxHeight })
          .eq('size', range.size);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heightRanges'] });
      toast({ title: 'טווחי גובה עודכנו ✅' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון טווחי גובה', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= PRICING =============
export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing')
        .select('*');
      if (error) throw error;
      return convertDbPricingToApp(data);
    },
    staleTime: 0, // Always fetch fresh pricing data
    refetchOnMount: true,
  });
}

export function useUpdatePricing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pricing: Pricing) => {
      const updates = [
        { key: 'morningSession', value: pricing.morningSession },
        { key: 'dailySession', value: pricing.dailySession },
        { key: 'picnic', value: pricing.picnic },
        { key: 'lateFee', value: pricing.lateFee },
        { key: 'theftFee', value: pricing.theftFee },
        { key: 'securityHold', value: pricing.securityHold },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('pricing')
          .update({ value: update.value })
          .eq('key', update.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast({ title: 'מחירים עודכנו ✅' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון מחירים', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= PARTS INVENTORY =============
export function usePartsInventory(enabled: boolean = true) {
  return useQuery({
    queryKey: ['partsInventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts_inventory')
        .select('*')
        .order('name');
      if (error) throw error;
      return data.map(convertDbPartToApp);
    },
    enabled,
  });
}

export function useUpdatePartsInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (parts: PartInventory[]) => {
      for (const part of parts) {
        const { error } = await supabase
          .from('parts_inventory')
          .update({
            name: part.name,
            quantity: part.quantity,
            min_quantity: part.minQuantity,
            needs_order: part.needsOrder,
          })
          .eq('id', part.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partsInventory'] });
      toast({ title: 'Parts inventory updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating parts inventory', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= MAINTENANCE LOGS =============
export function useMaintenanceLogs(enabled: boolean = true) {
  return useQuery({
    queryKey: ['maintenanceLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(convertDbMaintenanceLogToApp);
    },
    enabled,
  });
}

export function useAddMaintenanceLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (log: Omit<BikeMaintenanceLog, 'id'>) => {
      const { error } = await supabase
        .from('maintenance_logs')
        .insert({
          bike_id: log.bikeId,
          description: log.description,
          completed: log.resolved || false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      toast({ title: 'Maintenance log added' });
    },
    onError: (error) => {
      toast({ title: 'Error adding maintenance log', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateMaintenanceLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BikeMaintenanceLog> }) => {
      const dbUpdates: any = {};
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.resolved !== undefined) {
        dbUpdates.completed = updates.resolved;
        if (updates.resolved) {
          dbUpdates.completed_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('maintenance_logs')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
    },
    onError: (error) => {
      toast({ title: 'Error updating maintenance log', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteMaintenanceLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      toast({ title: 'Maintenance log deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting maintenance log', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= PICNIC MENU =============
const convertDbPicnicMenuItemToApp = (dbItem: any): PicnicMenuItem => ({
  id: dbItem.id,
  name: dbItem.name,
  nameHe: dbItem.name_he,
  description: dbItem.description,
  descriptionHe: dbItem.description_he,
  price: Number(dbItem.price),
  category: dbItem.category as PicnicMenuItem['category'],
  isAvailable: dbItem.is_available,
  sortOrder: dbItem.sort_order,
});

// For public booking - only available items
export function usePicnicMenu() {
  return useQuery({
    queryKey: ['picnicMenu'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('picnic_menu')
        .select('*')
        .eq('is_available', true)
        .order('sort_order');
      if (error) throw error;
      return data.map(convertDbPicnicMenuItemToApp);
    },
  });
}

// For admin - all items including unavailable
export function useAdminPicnicMenu() {
  return useQuery({
    queryKey: ['adminPicnicMenu'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('picnic_menu')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data.map(convertDbPicnicMenuItemToApp);
    },
  });
}

export function useAddPicnicMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<PicnicMenuItem, 'id'>) => {
      const { error } = await supabase
        .from('picnic_menu')
        .insert({
          name: item.name,
          name_he: item.nameHe,
          description: item.description,
          description_he: item.descriptionHe,
          price: item.price,
          category: item.category,
          is_available: item.isAvailable,
          sort_order: item.sortOrder,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picnicMenu'] });
      queryClient.invalidateQueries({ queryKey: ['adminPicnicMenu'] });
      toast({ title: 'פריט נוסף בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת פריט', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdatePicnicMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PicnicMenuItem> }) => {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.nameHe !== undefined) dbUpdates.name_he = updates.nameHe;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.descriptionHe !== undefined) dbUpdates.description_he = updates.descriptionHe;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

      const { error } = await supabase
        .from('picnic_menu')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picnicMenu'] });
      queryClient.invalidateQueries({ queryKey: ['adminPicnicMenu'] });
      toast({ title: 'פריט עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון פריט', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeletePicnicMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('picnic_menu')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picnicMenu'] });
      queryClient.invalidateQueries({ queryKey: ['adminPicnicMenu'] });
      toast({ title: 'פריט נמחק בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת פריט', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= MECHANIC ISSUES =============
import type { MechanicIssue, IssueType } from '@/lib/types';

const convertDbMechanicIssueToApp = (dbIssue: any): MechanicIssue => ({
  id: dbIssue.id,
  bikeId: dbIssue.bike_id,
  issueType: dbIssue.issue_type as IssueType,
  description: dbIssue.description || '',
  reportedAt: dbIssue.reported_at,
  resolved: dbIssue.resolved || false,
  resolvedAt: dbIssue.resolved_at,
});

export function useMechanicIssues(enabled: boolean = true) {
  return useQuery({
    queryKey: ['mechanicIssues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanic_issues')
        .select('*')
        .order('reported_at', { ascending: false });
      if (error) throw error;
      return data.map(convertDbMechanicIssueToApp);
    },
    enabled,
  });
}

export function useAddMechanicIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (issue: Omit<MechanicIssue, 'id' | 'reportedAt' | 'resolved' | 'resolvedAt'>) => {
      const { error } = await supabase
        .from('mechanic_issues')
        .insert({
          bike_id: issue.bikeId,
          issue_type: issue.issueType,
          description: issue.description,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicIssues'] });
      toast({ title: 'תקלה נוספה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת תקלה', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateMechanicIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MechanicIssue> }) => {
      const dbUpdates: any = {};
      if (updates.bikeId !== undefined) dbUpdates.bike_id = updates.bikeId;
      if (updates.issueType !== undefined) dbUpdates.issue_type = updates.issueType;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.resolved !== undefined) {
        dbUpdates.resolved = updates.resolved;
        if (updates.resolved) {
          dbUpdates.resolved_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('mechanic_issues')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicIssues'] });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון תקלה', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteMechanicIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mechanic_issues')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicIssues'] });
      toast({ title: 'תקלה נמחקה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת תקלה', description: String(error), variant: 'destructive' });
    },
  });
}

// ============= PUBLIC AVAILABILITY (for customers) =============

export interface PublicAvailabilityData {
  bookingDate: string;
  sessionType: string;
  bookedCount: number;
}

export function usePublicAvailability(startDate: string, endDate: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['publicAvailability', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_availability', {
          _start_date: startDate,
          _end_date: endDate,
        });
      
      if (error) throw error;
      
      return (data || []).map((row: any): PublicAvailabilityData => ({
        bookingDate: row.booking_date,
        sessionType: row.session_type,
        bookedCount: row.booked_count,
      }));
    },
    enabled: !!startDate && !!endDate,
    staleTime: 30000, // 30 seconds
  });

  // Subscribe to realtime updates for bookings table
  useEffect(() => {
    if (!startDate || !endDate) return;
    
    const channel = supabase
      .channel('public-availability-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          // Refetch availability when bookings change
          queryClient.invalidateQueries({ queryKey: ['publicAvailability', startDate, endDate] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate, queryClient]);

  return query;
}

// ============= REALTIME SUBSCRIPTIONS =============
export function useRealtimeSubscription(tableName: 'pricing' | 'bookings' | 'bikes' | 'picnic_menu' | 'mechanic_issues') {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        () => {
          // Invalidate relevant queries when data changes
          if (tableName === 'pricing') {
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
          } else if (tableName === 'bookings') {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            // Also invalidate public availability
            queryClient.invalidateQueries({ queryKey: ['publicAvailability'] });
          } else if (tableName === 'bikes') {
            queryClient.invalidateQueries({ queryKey: ['bikes'] });
            queryClient.invalidateQueries({ queryKey: ['publicBikes'] });
          } else if (tableName === 'picnic_menu') {
            queryClient.invalidateQueries({ queryKey: ['picnicMenu'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, queryClient]);
}

// ============= UTILITY HOOKS =============

// Generate a unique client identifier for rate limiting
function getClientIdentifier(): string {
  // Use a combination of session storage ID and timestamp for uniqueness
  let clientId = sessionStorage.getItem('coupon_client_id');
  if (!clientId) {
    clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('coupon_client_id', clientId);
  }
  return clientId;
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (code: string) => {
      const clientId = getClientIdentifier();
      
      const { data, error } = await supabase
        .rpc('validate_coupon_code', { _code: code, _client_id: clientId })
        .single();
      
      if (error) throw error;
      
      if (!data || !data.valid) {
        return { valid: false, error: data?.error_message || 'couponNotFound' };
      }
      
      // Map 'percentage' from DB to 'percent' for app compatibility
      const discountType = data.discount_type === 'percentage' ? 'percent' : 'fixed';
      
      return { 
        valid: true, 
        coupon: {
          code,
          discount: Number(data.discount),
          discountType: discountType as 'percent' | 'fixed',
        }
      };
    },
  });
}

export function useMarkCouponUsed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, bookingId }: { code: string; bookingId: string }) => {
      const { data, error } = await supabase
        .rpc('use_coupon_code', { _code: code, _booking_id: bookingId });
      
      if (error) throw error;
      if (!data) throw new Error('Failed to mark coupon as used');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

// ============= PUBLIC BOOKING ACCESS =============

export function useGetBookingsByContact() {
  return useMutation({
    mutationFn: async (phoneOrEmail: string) => {
      const { data, error } = await supabase
        .rpc('get_bookings_by_contact', { 
          _phone_or_email: phoneOrEmail 
        });
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      return data.map((booking: any) => ({
        id: booking.id,
        date: booking.date,
        session: booking.session as SessionType,
        status: booking.status as Booking['status'],
        totalPrice: Number(booking.total_price),
        phone: booking.phone,
        email: booking.email,
        riders: (booking.riders as any[] || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          height: r.height,
          assignedBike: r.assignedBike,
          assignedSize: r.assignedSize,
        })),
        picnic: booking.picnic as unknown as PicnicOrder | undefined,
        createdAt: booking.created_at,
      }));
    },
  });
}

export function useCancelBookingPublic() {
  return useMutation({
    mutationFn: async ({ bookingId, phone }: { bookingId: string; phone: string }) => {
      const { data, error } = await supabase
        .rpc('cancel_booking_public', { 
          _booking_id: bookingId, 
          _phone: phone 
        });
      
      if (error) throw error;
      return data === true;
    },
  });
}
