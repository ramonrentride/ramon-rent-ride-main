import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Images, Loader2, Trash2, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from './ImageCropper';

interface ImageGalleryPickerProps {
  bucket?: string;
  folders?: string[]; // e.g., ['animals', 'features'] - will also check root
  selectedImage?: string;
  onSelect: (url: string) => void;
  allowDelete?: boolean;
  aspectRatio?: number;
  triggerButton?: React.ReactNode;
}

export function ImageGalleryPicker({
  bucket = 'cms-images',
  folders = [],
  selectedImage,
  onSelect,
  allowDelete = true,
  aspectRatio = 16 / 9,
  triggerButton,
}: ImageGalleryPickerProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadImages = async () => {
    setLoading(true);
    try {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
      const isImageFile = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        return ext && imageExtensions.includes(ext);
      };

      // Load from root and all specified folders
      const foldersToCheck = ['', ...folders];
      const results = await Promise.all(
        foldersToCheck.map(folder =>
          supabase.storage.from(bucket).list(folder, {
            limit: 50,
            sortBy: { column: 'created_at', order: 'desc' },
          })
        )
      );

      const allUrls: string[] = [];
      results.forEach((result, index) => {
        const folder = foldersToCheck[index];
        (result.data || [])
          .filter(file => !file.name.startsWith('.') && isImageFile(file.name))
          .forEach(file => {
            const path = folder ? `${folder}/${file.name}` : file.name;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            allUrls.push(publicUrl);
          });
      });

      setImages(allUrls);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadImages();
    }
  }, [open, bucket, folders.join(',')]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'רק קבצי תמונה מותרים', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'גודל קובץ מקסימלי: 5MB', variant: 'destructive' });
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageToCrop(event.target?.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    try {
      const fileName = `cropped-${Date.now()}.jpg`;
      const folder = folders[0] || '';
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      toast({ title: 'התמונה הועלתה בהצלחה' });
      await loadImages();
      onSelect(publicUrl);
      setOpen(false);
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת התמונה', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  const handleDelete = async (url: string) => {
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
      if (!pathMatch) throw new Error('Invalid URL');
      
      const filePath = decodeURIComponent(pathMatch[1]);
      
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;

      toast({ title: 'התמונה נמחקה בהצלחה' });
      await loadImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'שגיאה במחיקת התמונה', variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button variant="outline" size="sm">
              <Images className="h-4 w-4 ml-1" /> בחר מהגלרייה
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>גלריית תמונות</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                ) : (
                  <Upload className="h-4 w-4 ml-1" />
                )}
                העלה חדשה
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>אין תמונות בגלרייה עדיין.</p>
                <p className="text-sm mt-1">לחץ על "העלה חדשה" להוספת תמונה.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 p-1">
                {images.map((url) => (
                  <div
                    key={url}
                    className="relative group aspect-video rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(url);
                        setOpen(false);
                      }}
                      className={`w-full h-full border-2 transition-all hover:border-primary ${
                        selectedImage === url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                    
                    {allowDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת תמונה</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם אתה בטוח שברצונך למחוק את התמונה? פעולה זו לא ניתנת לביטול.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(url)}>
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {imageToCrop && (
        <ImageCropper
          open={cropperOpen}
          onOpenChange={(open) => {
            setCropperOpen(open);
            if (!open) setImageToCrop(null);
          }}
          imageSrc={imageToCrop}
          aspectRatio={aspectRatio}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
