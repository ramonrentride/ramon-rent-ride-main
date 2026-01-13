import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SiteContent {
  id: string;
  section: string;
  contentKey: string;
  valueHe: string | null;
  valueEn: string | null;
  contentType: string;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const convertDbToApp = (db: any): SiteContent => ({
  id: db.id,
  section: db.section,
  contentKey: db.content_key,
  valueHe: db.value_he,
  valueEn: db.value_en,
  contentType: db.content_type,
  sortOrder: db.sort_order,
  isActive: db.is_active,
  metadata: db.metadata || {},
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export function useSiteContent(section?: string) {
  return useQuery({
    queryKey: ['siteContent', section],
    queryFn: async () => {
      let query = supabase.from('site_content').select('*').order('sort_order');
      
      if (section) {
        query = query.eq('section', section);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data.map(convertDbToApp);
    },
  });
}

export function useAllSiteContent() {
  return useQuery({
    queryKey: ['allSiteContent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section')
        .order('sort_order');
      if (error) throw error;
      return data.map(convertDbToApp);
    },
  });
}

export function useCreateSiteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (content: Omit<SiteContent, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('site_content')
        .insert({
          section: content.section,
          content_key: content.contentKey,
          value_he: content.valueHe,
          value_en: content.valueEn,
          content_type: content.contentType,
          sort_order: content.sortOrder,
          is_active: content.isActive,
          metadata: content.metadata,
        })
        .select()
        .single();
      if (error) throw error;
      return convertDbToApp(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['allSiteContent'] });
    },
    onError: (error) => {
      toast({ title: 'Error creating content', description: String(error), variant: 'destructive' });
    },
  });
}

export function useUpdateSiteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SiteContent> }) => {
      const dbUpdates: any = {};
      if (updates.section !== undefined) dbUpdates.section = updates.section;
      if (updates.contentKey !== undefined) dbUpdates.content_key = updates.contentKey;
      if (updates.valueHe !== undefined) dbUpdates.value_he = updates.valueHe;
      if (updates.valueEn !== undefined) dbUpdates.value_en = updates.valueEn;
      if (updates.contentType !== undefined) dbUpdates.content_type = updates.contentType;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;

      const { error } = await supabase
        .from('site_content')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['allSiteContent'] });
    },
    onError: (error) => {
      toast({ title: 'Error updating content', description: String(error), variant: 'destructive' });
    },
  });
}

export function useDeleteSiteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['allSiteContent'] });
      toast({ title: 'Content deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting content', description: String(error), variant: 'destructive' });
    },
  });
}

// Helper function to get content value for current language
export function getLocalizedContent(content: SiteContent | undefined, isRTL: boolean): string {
  if (!content) return '';
  return (isRTL ? content.valueHe : content.valueEn) || content.valueHe || content.valueEn || '';
}
