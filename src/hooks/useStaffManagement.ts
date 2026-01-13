import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffUser {
  user_id: string;
  email: string;
  display_name: string;
  phone: string | null;
  role: 'admin' | 'mechanic';
  created_at: string;
}

export function useStaffUsers() {
  return useQuery({
    queryKey: ['staff-users'],
    queryFn: async (): Promise<StaffUser[]> => {
      const { data, error } = await supabase.rpc('get_staff_users');
      
      if (error) {
        console.error('Error fetching staff users:', error);
        throw error;
      }
      
      return (data || []) as StaffUser[];
    },
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { 
      username: string; 
      password: string; 
      role: 'admin' | 'mechanic' 
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          username: params.username,
          password: params.password,
          role: params.role
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    },
  });
}

export function useDeleteStaffUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { userId: string; role: 'admin' | 'mechanic' }) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update-role',
          userId: params.userId,
          role: params.role
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    },
  });
}

export function useSetStaffPassword() {
  return useMutation({
    mutationFn: async (params: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'set-password',
          userId: params.userId,
          newPassword: params.newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
  });
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { userId: string; displayName?: string; phone?: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update-profile',
          userId: params.userId,
          displayName: params.displayName,
          phone: params.phone
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    },
  });
}
