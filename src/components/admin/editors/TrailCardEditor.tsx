import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pencil, Check, X, Trash2, GripVertical, Copy,
  Mountain, Clock, MapPin, ExternalLink, ImageIcon, Upload, Loader2
} from 'lucide-react';
import { SiteContent, useUpdateSiteContent, useDeleteSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LivePreview } from './LivePreview';
import { VersionHistory } from './VersionHistory';
import { ImageGalleryPicker } from './ImageGalleryPicker';
import { ImageCropper } from './ImageCropper';

interface TrailCardEditorProps {
  content: SiteContent;
  onDuplicate?: (content: SiteContent) => void;
  dragListeners?: any;
}

export function TrailCardEditor({ content, onDuplicate, dragListeners }: TrailCardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameHe, setNameHe] = useState(content.valueHe || '');
  const [descHe, setDescHe] = useState(content.metadata?.descriptionHe || '');
  const [difficulty, setDifficulty] = useState(content.metadata?.difficulty || 'moderate');
  const [duration, setDuration] = useState(content.metadata?.duration || '');
  const [distance, setDistance] = useState(content.metadata?.distance || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(content.metadata?.googleMapsUrl || '');
  const [komootUrl, setKomootUrl] = useState(content.metadata?.komootUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const imageSrc = content.metadata?.image || content.metadata?.imageUrl;

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
      const filePath = `trails/${fileName}`;

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
          metadata: { ...content.metadata, image: publicUrl },
        },
      });

      toast({ title: 'התמונה הועלתה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת התמונה', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
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
          difficulty,
          duration,
          distance,
          googleMapsUrl,
          komootUrl,
        },
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNameHe(content.valueHe || '');
    setDescHe(content.metadata?.descriptionHe || '');
    setDifficulty(content.metadata?.difficulty || 'moderate');
    setDuration(content.metadata?.duration || '');
    setDistance(content.metadata?.distance || '');
    setGoogleMapsUrl(content.metadata?.googleMapsUrl || '');
    setKomootUrl(content.metadata?.komootUrl || '');
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    updateContent.mutate({
      id: content.id,
      updates: { isActive: !content.isActive },
    });
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-success/20 text-success',
    moderate: 'bg-warning/20 text-warning',
    hard: 'bg-destructive/20 text-destructive',
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mountain className="h-5 w-5" />
              <span className="text-sm">עריכת מסלול</span>
            </div>
            <VersionHistory contentId={content.id} currentValueHe={content.valueHe || ''} currentValueEn={content.valueEn || ''} />
          </div>

          {/* Image Upload */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {imageSrc ? (
                <img src={imageSrc} alt="" className="w-24 h-16 rounded-lg object-cover" />
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
            <ImageGalleryPicker
              folders={['trails']}
              selectedImage={imageSrc || ''}
              onSelect={async (url) => {
                await updateContent.mutateAsync({
                  id: content.id,
                  updates: { metadata: { ...content.metadata, image: url } },
                });
              }}
              allowDelete={true}
              aspectRatio={16 / 9}
            />
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
            <label className="text-sm font-medium">שם המסלול</label>
            <Input value={nameHe} onChange={(e) => setNameHe(e.target.value)} dir="rtl" />
            <label className="text-sm font-medium">תיאור</label>
            <Textarea value={descHe} onChange={(e) => setDescHe(e.target.value)} dir="rtl" rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">רמת קושי</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">קל</SelectItem>
                  <SelectItem value="moderate">בינוני</SelectItem>
                  <SelectItem value="hard">קשה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">משך (שעות)</label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">מרחק (ק"מ)</label>
              <Input value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="12" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">קישור Google Maps</label>
              <Input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} dir="ltr" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">קישור Komoot (אופציונלי)</label>
              <Input value={komootUrl} onChange={(e) => setKomootUrl(e.target.value)} dir="ltr" placeholder="https://..." />
            </div>
          </div>

          <LivePreview
            type="trail"
            data={{
              titleHe: nameHe,
              titleEn: nameHe,
              descriptionHe: descHe,
              descriptionEn: descHe,
              image: imageSrc,
              difficulty,
              duration,
              distance,
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
        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
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

      <div className="relative">
        {imageSrc ? (
          <img src={imageSrc} alt={content.valueHe || ''} className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <Mountain className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {content.metadata?.difficulty && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${difficultyColors[content.metadata.difficulty]}`}>
            {content.metadata.difficulty === 'easy' ? 'קל' : content.metadata.difficulty === 'moderate' ? 'בינוני' : 'קשה'}
          </span>
        )}
        
        <h3 className="absolute bottom-2 left-2 right-2 text-white font-bold">{content.valueHe}</h3>
      </div>
      
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{content.metadata?.descriptionHe}</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {content.metadata?.duration || '?'} שעות
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {content.metadata?.distance || '?'} ק"מ
          </span>
        </div>
        {content.metadata?.googleMapsUrl && (
          <a href={content.metadata.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
            <ExternalLink className="h-3 w-3" /> Google Maps
          </a>
        )}
      </CardContent>
    </Card>
  );
}
