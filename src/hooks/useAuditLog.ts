import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_display_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json | null;
  created_at: string;
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return (data || []) as AuditLogEntry[];
    },
  });
}

export function useLogAction() {
  const queryClient = useQueryClient();
  const { user, displayName } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      action: string;
      entityType: string;
      entityId?: string;
      details?: Record<string, unknown>;
    }) => {
      const insertData = {
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_display_name: displayName || user?.email || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        details: (params.details as Json) || null,
      };
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error logging action:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

// Helper hook to log common actions
export function useAuditActions() {
  const logAction = useLogAction();

  return {
    logBikeEdit: (bikeId: number, changes: Record<string, unknown>) => {
      logAction.mutate({
        action: 'edit',
        entityType: 'bike',
        entityId: String(bikeId),
        details: changes,
      });
    },
    logBikeCreate: (bikeId: number, details: Record<string, unknown>) => {
      logAction.mutate({
        action: 'create',
        entityType: 'bike',
        entityId: String(bikeId),
        details,
      });
    },
    logBikeDelete: (bikeId: number) => {
      logAction.mutate({
        action: 'delete',
        entityType: 'bike',
        entityId: String(bikeId),
      });
    },
    logCouponCreate: (couponCode: string, details: Record<string, unknown>) => {
      logAction.mutate({
        action: 'create',
        entityType: 'coupon',
        entityId: couponCode,
        details,
      });
    },
    logBookingStatusChange: (bookingId: string, oldStatus: string, newStatus: string) => {
      logAction.mutate({
        action: 'status_change',
        entityType: 'booking',
        entityId: bookingId,
        details: { oldStatus, newStatus },
      });
    },
    logUserCreate: (userId: string, role: string) => {
      logAction.mutate({
        action: 'create',
        entityType: 'user',
        entityId: userId,
        details: { role },
      });
    },
    logUserDelete: (userId: string) => {
      logAction.mutate({
        action: 'delete',
        entityType: 'user',
        entityId: userId,
      });
    },
    logUserRoleChange: (userId: string, oldRole: string, newRole: string) => {
      logAction.mutate({
        action: 'role_change',
        entityType: 'user',
        entityId: userId,
        details: { oldRole, newRole },
      });
    },
    logPhotoUpload: (bookingId: string, photoUrl: string) => {
      logAction.mutate({
        action: 'upload',
        entityType: 'return_photo',
        entityId: bookingId,
        details: { photoUrl },
      });
    },
    logMaintenanceLog: (logId: string, action: 'create' | 'update' | 'delete', details?: Record<string, unknown>) => {
      logAction.mutate({
        action,
        entityType: 'maintenance_log',
        entityId: logId,
        details,
      });
    },
    logPricingUpdate: (changes: Record<string, unknown>) => {
      logAction.mutate({
        action: 'update',
        entityType: 'pricing',
        details: changes,
      });
    },
    logHeightRangesUpdate: (changes: Record<string, unknown>) => {
      logAction.mutate({
        action: 'update',
        entityType: 'height_ranges',
        details: changes,
      });
    },
    logBookingCreate: (bookingId: string, details: Record<string, unknown>) => {
      logAction.mutate({
        action: 'create',
        entityType: 'booking',
        entityId: bookingId,
        details,
      });
    },
    logInventoryUpdate: (changes: Record<string, unknown>) => {
      logAction.mutate({
        action: 'update',
        entityType: 'parts_inventory',
        details: changes,
      });
    },
  };
}
