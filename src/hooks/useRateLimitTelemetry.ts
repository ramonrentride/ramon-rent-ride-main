import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BookingAttempt {
  id: string;
  client_identifier: string;
  attempted_at: string;
  was_successful: boolean | null;
}

export interface CouponAttempt {
  id: string;
  client_identifier: string;
  code_attempted: string;
  attempted_at: string;
  was_valid: boolean | null;
}

export interface LoginAttempt {
  id: string;
  client_identifier: string;
  username_attempted: string;
  attempted_at: string;
}

export function useBookingAttempts(clientFilter?: string) {
  return useQuery({
    queryKey: ['booking-attempts', clientFilter],
    queryFn: async () => {
      let query = supabase
        .from('booking_creation_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(200);

      if (clientFilter) {
        query = query.ilike('client_identifier', `%${clientFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BookingAttempt[];
    },
  });
}

export function useCouponAttempts(clientFilter?: string) {
  return useQuery({
    queryKey: ['coupon-attempts', clientFilter],
    queryFn: async () => {
      let query = supabase
        .from('coupon_validation_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(200);

      if (clientFilter) {
        query = query.ilike('client_identifier', `%${clientFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CouponAttempt[];
    },
  });
}

export function useLoginAttempts(clientFilter?: string) {
  return useQuery({
    queryKey: ['login-attempts', clientFilter],
    queryFn: async () => {
      let query = supabase
        .from('login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(200);

      if (clientFilter) {
        query = query.ilike('client_identifier', `%${clientFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoginAttempt[];
    },
  });
}
