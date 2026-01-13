import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Pencil, Check, X, Trash2, GripVertical, Copy, ImageIcon, Upload, Loader2 } from 'lucide-react';
import { SiteContent, useUpdateSiteContent, useDeleteSiteContent } from '@/hooks/useSiteContent';
import { IconPicker, iconComponents } from './IconPicker';
import { LivePreview } from './LivePreview';
import { VersionHistory } from './VersionHistory';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageGalleryPicker } from './ImageGalleryPicker';
import { ImageCropper } from './ImageCropper';

interface FeatureCardEditorProps {
  content: SiteContent;
  onDuplicate?: (content: SiteContent) => void;
  dragListeners?: any;
}

export function FeatureCardEditor({ content, onDuplicate, dragListeners }: FeatureCardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleHe, setTitleHe] = useState(content.valueHe || '');
  const [descHe, setDescHe] = useState(content.metadata?.descriptionHe || '');
  const [icon, setIcon] = useState(content.metadata?.icon || 'Bike');
  const [image, setImage] = useState(content.metadata?.image || '');
  const [bgColor, setBgColor] = useState(content.metadata?.bgColor || '');
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const IconComponent = iconComponents[content.metadata?.icon] || iconComponents['Bike'];

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
      const fileName = `feature-${content.id}-${Date.now()}.jpg`;
      const filePath = `features/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cms-images')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cms-images')
        .getPublicUrl(filePath);

      setImage(publicUrl);
      toast({ title: 'התמונה הועלתה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת התמונה', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `feature-${content.id}-${Date.now()}.${fileExt}`;
      const filePath = `features/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cms-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cms-images')
        .getPublicUrl(filePath);

      setImage(publicUrl);
      toast({ title: 'התמונה הועלתה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת התמונה', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: titleHe,
        valueEn: titleHe, // תרגום אוטומטי - משתמשים באותו ערך
        metadata: {
          ...content.metadata,
          descriptionHe: descHe,
          descriptionEn: descHe, // תרגום אוטומטי
          icon,
          image,
          bgColor,
        },
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitleHe(content.valueHe || '');
    setDescHe(content.metadata?.descriptionHe || '');
    setIcon(content.metadata?.icon || 'Bike');
    setImage(content.metadata?.image || '');
    setBgColor(content.metadata?.bgColor || '');
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
            <div className="flex items-center gap-2 text-muted-foreground">
              {IconComponent && <IconComponent className="h-5 w-5" />}
              <span className="text-sm">עריכת יתרון</span>
            </div>
            <VersionHistory contentId={content.id} currentValueHe={content.valueHe || ''} currentValueEn={content.valueEn || ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">אייקון</label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">צבע רקע</label>
              <div className="flex gap-2">
                {['', 'bg-primary/10', 'bg-accent/10', 'bg-secondary/10', 'bg-amber-100', 'bg-emerald-100', 'bg-sky-100'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBgColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      color === '' ? 'bg-white' : color
                    } ${bgColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                    title={color === '' ? 'ללא רקע' : color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">תמונת רקע</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                {image ? (
                  <img src={image} alt="" className="w-24 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-6 w-6"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                </Button>
              </div>

              <div className="flex flex-col gap-1">
                <ImageGalleryPicker
                  folders={['features']}
                  selectedImage={image}
                  onSelect={(url) => setImage(url)}
                  allowDelete={true}
                  aspectRatio={16 / 9}
                />

                {image && (
                  <Button variant="ghost" size="sm" onClick={() => setImage('')}>
                    <X className="h-4 w-4 ml-1" /> הסר תמונה
                  </Button>
                )}
              </div>
            </div>
          </div>

          {imageToCrop && (
            <ImageCropper
              open={cropperOpen}
              onOpenChange={(open) => {
                setCropperOpen(open);
                if (!open) setImageToCrop(null);
              }}
              imageSrc={imageToCrop}
              aspectRatio={16 / 9}
              onCropComplete={handleCropComplete}
            />
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">כותרת</label>
            <Input value={titleHe} onChange={(e) => setTitleHe(e.target.value)} dir="rtl" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">תיאור</label>
            <Textarea value={descHe} onChange={(e) => setDescHe(e.target.value)} dir="rtl" rows={2} />
          </div>

          <LivePreview
            type="feature"
            data={{
              titleHe,
              titleEn: titleHe,
              descriptionHe: descHe,
              descriptionEn: descHe,
              icon,
              image,
              bgColor,
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
    <Card className={`group relative transition-all hover:shadow-md ${!content.isActive ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div 
          className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          {...dragListeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        </div>
        
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

        <div className="flex flex-col items-center text-center pt-4">
          {content.metadata?.image && (
            <div className="w-full h-24 -mt-4 mb-3 rounded-t-lg overflow-hidden">
              <img src={content.metadata.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className={`w-12 h-12 ${content.metadata?.bgColor || 'bg-primary/10'} rounded-full flex items-center justify-center mb-3`}>
            {IconComponent && <IconComponent className="h-6 w-6 text-primary" />}
          </div>
          <h3 className="font-semibold text-lg">{content.valueHe}</h3>
          <p className="text-sm text-muted-foreground mt-1">{content.metadata?.descriptionHe}</p>
        </div>
      </CardContent>
    </Card>
  );
}
