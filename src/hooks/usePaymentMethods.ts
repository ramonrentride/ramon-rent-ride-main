import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  methodKey: string;
  nameHe: string;
  nameEn: string;
  isEnabled: boolean;
  sortOrder: number;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

const convertDbToApp = (db: any): PaymentMethod => ({
  id: db.id,
  methodKey: db.method_key,
  nameHe: db.name_he,
  nameEn: db.name_en,
  isEnabled: db.is_enabled,
  sortOrder: db.sort_order,
  icon: db.icon,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data.map(convertDbToApp);
    },
  });
}

export function useAllPaymentMethods() {
  return useQuery({
    queryKey: ['allPaymentMethods'],
    queryFn: async () => {
      // This query is for admin use - fetch all methods regardless of enabled status
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data.map(convertDbToApp);
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PaymentMethod> }) => {
      const dbUpdates: any = {};
      if (updates.nameHe !== undefined) dbUpdates.name_he = updates.nameHe;
      if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
      if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;

      const { error } = await supabase
        .from('payment_methods')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['allPaymentMethods'] });
      toast({ title: 'אמצעי תשלום עודכן ✅' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון אמצעי תשלום', description: String(error), variant: 'destructive' });
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          method_key: method.methodKey,
          name_he: method.nameHe,
          name_en: method.nameEn,
          is_enabled: method.isEnabled,
          sort_order: method.sortOrder,
          icon: method.icon,
        })
        .select()
        .single();
      if (error) throw error;
      return convertDbToApp(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['allPaymentMethods'] });
      toast({ title: 'אמצעי תשלום נוצר ✅' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה ביצירת אמצעי תשלום', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['allPaymentMethods'] });
      toast({ title: 'אמצעי תשלום נמחק' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת אמצעי תשלום', description: String(error), variant: 'destructive' });
    },
  });
}
