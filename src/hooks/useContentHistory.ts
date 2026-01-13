import { supabase } from '@/integrations/supabase/client';
import { SiteContent } from './useSiteContent';

export async function saveContentHistory(
  content: SiteContent,
  changeType: 'create' | 'update' | 'restore'
) {
  try {
    // Get the latest version number
    const { data: latestVersion } = await supabase
      .from('site_content_history')
      .select('version_number')
      .eq('content_id', content.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    await supabase.from('site_content_history').insert({
      content_id: content.id,
      version_number: nextVersion,
      value_he: content.valueHe,
      value_en: content.valueEn,
      metadata: content.metadata,
      change_type: changeType,
      changed_by: 'admin',
    });
  } catch (error) {
    console.error('Failed to save content history:', error);
  }
}
