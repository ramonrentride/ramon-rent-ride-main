import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SessionSetting {
  id: string;
  sessionType: 'morning' | 'daily' | 'picnic';
  isEnabled: boolean;
  season: string;
  startDate: string | null;
  endDate: string | null;
  disabledMessageHe: string;
  disabledMessageEn: string;
  createdAt: string;
  updatedAt: string;
}

const convertDbToApp = (db: any): SessionSetting => ({
  id: db.id,
  sessionType: db.session_type,
  isEnabled: db.is_enabled,
  season: db.season,
  startDate: db.start_date,
  endDate: db.end_date,
  disabledMessageHe: db.disabled_message_he || 'הסשן אינו זמין כרגע',
  disabledMessageEn: db.disabled_message_en || 'Session not available',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export function useSessionSettings() {
  return useQuery({
    queryKey: ['sessionSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_settings')
        .select('*')
        .order('session_type');
      if (error) throw error;
      return data.map(convertDbToApp);
    },
  });
}

export function useCreateSessionSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (setting: { sessionType: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from('session_settings')
        .insert({
          session_type: setting.sessionType,
          is_enabled: setting.isEnabled,
          season: 'all',
          disabled_message_he: 'האפשרות אינה זמינה כרגע',
          disabled_message_en: 'Option currently unavailable'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionSettings'] });
    },
    onError: (error) => {
      toast({ title: 'Error creating setting', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateSessionSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ sessionType, updates }: { sessionType: string; updates: Partial<SessionSetting> }) => {
      const dbUpdates: any = {};
      if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
      if (updates.season !== undefined) dbUpdates.season = updates.season;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.disabledMessageHe !== undefined) dbUpdates.disabled_message_he = updates.disabledMessageHe;
      if (updates.disabledMessageEn !== undefined) dbUpdates.disabled_message_en = updates.disabledMessageEn;

      const { error } = await supabase
        .from('session_settings')
        .update(dbUpdates)
        .eq('session_type', sessionType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionSettings'] });
      toast({ title: 'Session settings updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating session settings', description: String(error), variant: 'destructive' });
    },
  });
}

// Check if a session is enabled based on settings and current date
export function isSessionEnabled(
  settings: SessionSetting[] | undefined,
  sessionType: 'morning' | 'daily' | 'picnic' | string,
  date?: string
): boolean {
  if (!settings) return true; // Default to enabled if settings not loaded

  const setting = settings.find(s => s.sessionType === sessionType);
  if (!setting) return true;

  if (!setting.isEnabled) return false;

  // Check date range if specified
  if (date && setting.startDate && setting.endDate) {
    const checkDate = new Date(date);
    const start = new Date(setting.startDate);
    const end = new Date(setting.endDate);
    if (checkDate < start || checkDate > end) return false;
  }

  return true;
}
