import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemConfig {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_placeholder: boolean;
  updated_at: string;
}

export const useSystemConfig = () => {
  const queryClient = useQueryClient();

  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('system_config')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data as SystemConfig[];
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ key, value, is_placeholder }: { key: string; value: string; is_placeholder?: boolean }) => {
      const { error } = await (supabase.from as any)('system_config')
        .update({
          value, 
          is_placeholder: is_placeholder ?? false,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
  });

  // Helper to get a specific config value
  const getConfig = (key: string): string => {
    const config = configs?.find(c => c.key === key);
    return config?.value || '';
  };

  // Helper to check if a config is still a placeholder
  const isPlaceholder = (key: string): boolean => {
    const config = configs?.find(c => c.key === key);
    return config?.is_placeholder ?? true;
  };

  // Get base URL - always use current origin to support any domain
  const getBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  return {
    configs,
    isLoading,
    error,
    updateConfig,
    getConfig,
    isPlaceholder,
    getBaseUrl,
    // Commonly used configs
    customDomain: getConfig('custom_domain'),
    contactEmail: getConfig('contact_email'),
    whatsappNumber: getConfig('whatsapp_number'),
    securityDeposit: parseInt(getConfig('security_deposit') || '500', 10),
    stripePublicKey: getConfig('stripe_public_key'),
    dailyReportTime: getConfig('daily_report_time'),
    dailyReportEnabled: getConfig('daily_report_enabled') === 'true',
  };
};
