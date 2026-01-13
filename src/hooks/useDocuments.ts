import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export type EntityType = 'booking' | 'lead';
export type DocumentType = 'id_photo' | 'passport' | 'damage_report' | 'waiver' | 'other';

interface DocumentInfo {
  url: string;
  path: string;
  type: DocumentType;
  name: string;
  uploadedAt: string;
}

export function useDocuments() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadDocument = async (
    entityId: string,
    entityType: EntityType,
    file: File,
    docType: DocumentType = 'other'
  ): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityType}/${entityId}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('rental-docs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'שגיאה בהעלאת המסמך',
          description: uploadError.message,
          variant: 'destructive',
        });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('rental-docs')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update the entity's documents_urls array
      const table = entityType === 'booking' ? 'bookings' : 'waiting_list_leads';
      
      // First get current documents
      const { data: currentData, error: fetchError } = await supabase
        .from(table)
        .select('documents_urls')
        .eq('id', entityId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return publicUrl; // Still return URL even if we can't update array
      }

      const currentDocs = (currentData?.documents_urls as string[]) || [];
      const updatedDocs = [...currentDocs, publicUrl];

      const { error: updateError } = await supabase
        .from(table)
        .update({ documents_urls: updatedDocs })
        .eq('id', entityId);

      if (updateError) {
        console.error('Update error:', updateError);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['waitingListLeads'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      toast({
        title: 'המסמך הועלה בהצלחה',
      });

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'שגיאה בהעלאת המסמך',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const getDocumentType = (url: string): DocumentType => {
    if (url.includes('id_photo')) return 'id_photo';
    if (url.includes('passport')) return 'passport';
    if (url.includes('damage_report')) return 'damage_report';
    if (url.includes('waiver')) return 'waiver';
    return 'other';
  };

  const getDocumentName = (type: DocumentType): string => {
    const names: Record<DocumentType, string> = {
      id_photo: 'תעודת זהות',
      passport: 'דרכון',
      damage_report: 'דו"ח נזק',
      waiver: 'ויתור',
      other: 'מסמך',
    };
    return names[type];
  };

  const deleteDocument = async (
    entityId: string,
    entityType: EntityType,
    documentUrl: string
  ): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = documentUrl.split('/rental-docs/');
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from('rental-docs')
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return false;
      }

      // Update the entity's documents_urls array
      const table = entityType === 'booking' ? 'bookings' : 'waiting_list_leads';
      
      const { data: currentData } = await supabase
        .from(table)
        .select('documents_urls')
        .eq('id', entityId)
        .single();

      const currentDocs = (currentData?.documents_urls as string[]) || [];
      const updatedDocs = currentDocs.filter(url => url !== documentUrl);

      await supabase
        .from(table)
        .update({ documents_urls: updatedDocs })
        .eq('id', entityId);

      queryClient.invalidateQueries({ queryKey: ['waitingListLeads'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      toast({
        title: 'המסמך נמחק בהצלחה',
      });

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadDocument,
    deleteDocument,
    getDocumentType,
    getDocumentName,
    uploading,
  };
}
