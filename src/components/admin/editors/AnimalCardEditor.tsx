import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Pencil, Check, X, Trash2, GripVertical, ImageIcon, Upload, Loader2, Copy } from 'lucide-react';
import { SiteContent, useUpdateSiteContent, useDeleteSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LivePreview } from './LivePreview';
import { VersionHistory } from './VersionHistory';
import { ImageGalleryPicker } from './ImageGalleryPicker';
import { ImageCropper } from './ImageCropper';

// Import animal images
import ibexImg from '@/assets/animal-ibex.jpg';
import vultureImg from '@/assets/animal-vulture.jpg';
import eagleImg from '@/assets/animal-eagle.jpg';
import foxImg from '@/assets/animal-fox.jpg';

const imageMap: Record<string, string> = {
  '/src/assets/animal-ibex.jpg': ibexImg,
  '/src/assets/animal-vulture.jpg': vultureImg,
  '/src/assets/animal-eagle.jpg': eagleImg,
  '/src/assets/animal-fox.jpg': foxImg,
  'animal.ibex': ibexImg,
  'animal.vulture': vultureImg,
  'animal.eagle': eagleImg,
  'animal.fox': foxImg,
};

interface AnimalCardEditorProps {
  content: SiteContent;
  onDuplicate?: (content: SiteContent) => void;
  dragListeners?: any;
}

export function AnimalCardEditor({ content, onDuplicate, dragListeners }: AnimalCardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameHe, setNameHe] = useState(content.valueHe || '');
  const [descHe, setDescHe] = useState(content.metadata?.descriptionHe || '');
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  // Get image from CMS imageUrl, local mapping, or content key
  const getImageSrc = () => {
    if (content.metadata?.imageUrl) return content.metadata.imageUrl;
    if (content.metadata?.image && imageMap[content.metadata.image]) return imageMap[content.metadata.image];
    if (imageMap[content.contentKey]) return imageMap[content.contentKey];
    return null;
  };

  const imageSrc = getImageSrc();

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
      const fileName = `${content.contentKey}-${Date.now()}.jpg`;
      const filePath = `animals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cms-images')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cms-images')
        .getPublicUrl(filePath);

      await updateContent.mutateAsync({
        id: content.id,
        updates: {
          metadata: {
            ...content.metadata,
            imageUrl: publicUrl,
          },
        },
      });

      toast({ title: 'התמונה הועלתה בהצלחה' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'שגיאה בהעלאת התמונה', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  const handleSave = () => {
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: nameHe,
        valueEn: nameHe, // Auto-copy Hebrew to English
        metadata: {
          ...content.metadata,
          descriptionHe: descHe,
          descriptionEn: descHe, // Auto-copy Hebrew to English
        },
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNameHe(content.valueHe || '');
    setDescHe(content.metadata?.descriptionHe || '');
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    updateContent.mutate({
      id: content.id,
      updates: { isActive: !content.isActive },
    });
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {imageSrc ? (
                  <img src={imageSrc} alt="" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-6 w-6"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">עריכת חיה</span>
                <ImageGalleryPicker
                  folders={['animals']}
                  selectedImage={imageSrc || ''}
                  onSelect={async (url) => {
                    await updateContent.mutateAsync({
                      id: content.id,
                      updates: { metadata: { ...content.metadata, imageUrl: url } },
                    });
                  }}
                  allowDelete={true}
                  aspectRatio={1}
                />
              </div>
            </div>
            <VersionHistory contentId={content.id} currentValueHe={content.valueHe || ''} currentValueEn={content.valueEn || ''} />
          </div>

          {imageToCrop && (
            <ImageCropper
              open={cropperOpen}
              onOpenChange={(open) => {
                setCropperOpen(open);
                if (!open) setImageToCrop(null);
              }}
              imageSrc={imageToCrop}
              aspectRatio={1}
              onCropComplete={handleCropComplete}
            />
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">שם</label>
            <Input value={nameHe} onChange={(e) => setNameHe(e.target.value)} dir="rtl" />
            <label className="text-sm font-medium">תיאור</label>
            <Textarea value={descHe} onChange={(e) => setDescHe(e.target.value)} dir="rtl" rows={3} />
          </div>

          <LivePreview
            type="animal"
            data={{
              titleHe: nameHe,
              titleEn: nameHe,
              descriptionHe: descHe,
              descriptionEn: descHe,
              image: imageSrc || undefined,
            }}
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" /> ביטול
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" /> שמור
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`group relative transition-all hover:shadow-md overflow-hidden ${!content.isActive ? 'opacity-50' : ''}`}>
      <div 
        className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        {...dragListeners}
      >
        <GripVertical className="h-4 w-4 text-white drop-shadow cursor-grab" />
      </div>
      
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-lg p-1">
        <Switch checked={content.isActive} onCheckedChange={handleToggleActive} />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate?.(content)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContent.mutate(content.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {imageSrc ? (
        <img src={imageSrc} alt={content.valueHe || ''} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-muted flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <CardContent className="p-3">
        <h3 className="font-semibold">{content.valueHe}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{content.metadata?.descriptionHe}</p>
      </CardContent>
    </Card>
  );
}
