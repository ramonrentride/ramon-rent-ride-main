import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WaitingListLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  signature_url: string | null;
  waiver_accepted_at: string | null;
  waiver_version: string | null;
  created_at: string;
}

export const usePreLaunchMode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get pre-launch mode status from site_content
  const { data: preLaunchSetting, isLoading: settingLoading } = useQuery({
    queryKey: ['pre-launch-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'system')
        .eq('content_key', 'pre_launch_mode')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Get schedule settings
  const { data: scheduleSettings } = useQuery({
    queryKey: ['pre-launch-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'system')
        .in('content_key', ['pre_launch_schedule_start', 'pre_launch_schedule_end']);
      
      if (error) throw error;
      return data;
    },
  });

  // Get banner text settings
  const { data: bannerSettings } = useQuery({
    queryKey: ['pre-launch-banner-text'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'system')
        .in('content_key', ['pre_launch_banner_title', 'pre_launch_banner_subtitle']);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate if pre-launch mode should be active based on manual toggle OR schedule
  const manualMode = preLaunchSetting?.value_he === 'true';
  const scheduleStart = scheduleSettings?.find(s => s.content_key === 'pre_launch_schedule_start')?.value_he;
  const scheduleEnd = scheduleSettings?.find(s => s.content_key === 'pre_launch_schedule_end')?.value_he;
  
  // Check if we're within the scheduled time
  const now = new Date();
  const isWithinSchedule = (() => {
    if (!scheduleStart && !scheduleEnd) return false;
    const start = scheduleStart ? new Date(scheduleStart) : null;
    const end = scheduleEnd ? new Date(scheduleEnd) : null;
    
    if (start && end) {
      return now >= start && now <= end;
    } else if (start) {
      return now >= start;
    } else if (end) {
      return now <= end;
    }
    return false;
  })();

  const isPreLaunchMode = manualMode || isWithinSchedule;
  
  // Get banner texts
  const bannerTitle = bannerSettings?.find(s => s.content_key === 'pre_launch_banner_title')?.value_he || '';
  const bannerSubtitle = bannerSettings?.find(s => s.content_key === 'pre_launch_banner_subtitle')?.value_he || '';

  // Toggle pre-launch mode
  const togglePreLaunchMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const value = enabled ? 'true' : 'false';
      
      const { data: existing } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'system')
        .eq('content_key', 'pre_launch_mode')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_content')
          .update({ value_he: value, value_en: value, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({
            section: 'system',
            content_key: 'pre_launch_mode',
            value_he: value,
            value_en: value,
            content_type: 'setting',
            is_active: true,
            metadata: { type: 'boolean' }
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-launch-mode'] });
      toast({ title: 'הגדרות מצב השקה עודכנו!' });
    },
  });

  // Update schedule
  const updateSchedule = useMutation({
    mutationFn: async ({ start, end }: { start: string | null; end: string | null }) => {
      // Update start
      const { data: existingStart } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'system')
        .eq('content_key', 'pre_launch_schedule_start')
        .single();

      if (start) {
        if (existingStart) {
          await supabase.from('site_content').update({ value_he: start, value_en: start }).eq('id', existingStart.id);
        } else {
          await supabase.from('site_content').insert({
            section: 'system',
            content_key: 'pre_launch_schedule_start',
            value_he: start,
            value_en: start,
            content_type: 'setting',
            is_active: true,
          });
        }
      } else if (existingStart) {
        await supabase.from('site_content').delete().eq('id', existingStart.id);
      }

      // Update end
      const { data: existingEnd } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'system')
        .eq('content_key', 'pre_launch_schedule_end')
        .single();

      if (end) {
        if (existingEnd) {
          await supabase.from('site_content').update({ value_he: end, value_en: end }).eq('id', existingEnd.id);
        } else {
          await supabase.from('site_content').insert({
            section: 'system',
            content_key: 'pre_launch_schedule_end',
            value_he: end,
            value_en: end,
            content_type: 'setting',
            is_active: true,
          });
        }
      } else if (existingEnd) {
        await supabase.from('site_content').delete().eq('id', existingEnd.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-launch-schedule'] });
      toast({ title: 'תזמון מצב השקה עודכן!' });
    },
  });

  // Update banner text
  const updateBannerText = useMutation({
    mutationFn: async ({ title, subtitle }: { title: string; subtitle: string }) => {
      const { data: existingTitle } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'system')
        .eq('content_key', 'pre_launch_banner_title')
        .single();

      if (existingTitle) {
        await supabase.from('site_content').update({ value_he: title, value_en: title, updated_at: new Date().toISOString() }).eq('id', existingTitle.id);
      } else {
        await supabase.from('site_content').insert({
          section: 'system',
          content_key: 'pre_launch_banner_title',
          value_he: title,
          value_en: title,
          content_type: 'setting',
          is_active: true,
        });
      }

      const { data: existingSubtitle } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'system')
        .eq('content_key', 'pre_launch_banner_subtitle')
        .single();

      if (existingSubtitle) {
        await supabase.from('site_content').update({ value_he: subtitle, value_en: subtitle, updated_at: new Date().toISOString() }).eq('id', existingSubtitle.id);
      } else {
        await supabase.from('site_content').insert({
          section: 'system',
          content_key: 'pre_launch_banner_subtitle',
          value_he: subtitle,
          value_en: subtitle,
          content_type: 'setting',
          is_active: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-launch-banner-text'] });
    },
  });

  // Get waiting list leads
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['waiting-list-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waiting_list_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WaitingListLead[];
    },
  });

  // Upload signature to storage
  const uploadSignature = async (dataUrl: string, leadId: string): Promise<string | null> => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const fileName = `${leadId}_${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, { contentType: 'image/png' });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload signature:', error);
      return null;
    }
  };

  // Add to waiting list (public)
  const joinWaitingList = useMutation({
    mutationFn: async ({ 
      name, 
      phone, 
      email,
      signatureDataUrl,
      waiverVersion: version 
    }: { 
      name: string; 
      phone?: string; 
      email?: string;
      signatureDataUrl?: string;
      waiverVersion?: string;
    }) => {
      // First insert the lead
      const { data: lead, error } = await supabase
        .from('waiting_list_leads')
        .insert({ 
          name, 
          phone: phone || null, 
          email: email || null,
          waiver_accepted_at: signatureDataUrl ? new Date().toISOString() : null,
          waiver_version: version || null,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Then upload signature if provided
      if (signatureDataUrl && lead) {
        const signatureUrl = await uploadSignature(signatureDataUrl, lead.id);
        
        if (signatureUrl) {
          await supabase
            .from('waiting_list_leads')
            .update({ signature_url: signatureUrl })
            .eq('id', lead.id);
        }
      }
      
      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list-leads'] });
      toast({ 
        title: '🎉 נרשמת בהצלחה!',
        description: 'נעדכן אותך ברגע שנפתח להזמנות'
      });
    },
    onError: () => {
      toast({ 
        title: 'שגיאה בהרשמה',
        variant: 'destructive'
      });
    },
  });

  // Delete lead
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('waiting_list_leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list-leads'] });
    },
  });

  return {
    isPreLaunchMode,
    manualMode,
    isWithinSchedule,
    scheduleStart,
    scheduleEnd,
    settingLoading,
    togglePreLaunchMode,
    updateSchedule,
    leads,
    leadsLoading,
    joinWaitingList,
    deleteLead,
    bannerTitle,
    bannerSubtitle,
    updateBannerText,
  };
};
