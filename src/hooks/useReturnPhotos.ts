import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useReturnPhotos() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadPhoto = async (bookingId: string, file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('return-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'שגיאה בהעלאת התמונה',
          description: uploadError.message,
          variant: 'destructive',
        });
        return null;
      }

      return fileName;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'שגיאה בהעלאת התמונה',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('return-photos')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  };

  const getSignedUrls = async (filePaths: string[]): Promise<(string | null)[]> => {
    const urls = await Promise.all(filePaths.map(getSignedUrl));
    return urls;
  };

  const deletePhoto = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('return-photos')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadPhoto,
    getSignedUrl,
    getSignedUrls,
    deletePhoto,
    uploading,
  };
}
