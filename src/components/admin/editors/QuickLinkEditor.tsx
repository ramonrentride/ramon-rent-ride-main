import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Pencil, Check, X, Trash2, GripVertical, Copy, ExternalLink } from 'lucide-react';
import { SiteContent, useUpdateSiteContent, useDeleteSiteContent } from '@/hooks/useSiteContent';
import { IconPicker, iconComponents } from './IconPicker';
import { LivePreview } from './LivePreview';
import { VersionHistory } from './VersionHistory';

interface QuickLinkEditorProps {
  content: SiteContent;
  onDuplicate?: (content: SiteContent) => void;
  dragListeners?: any;
}

export function QuickLinkEditor({ content, onDuplicate, dragListeners }: QuickLinkEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleHe, setTitleHe] = useState(content.valueHe || '');
  const [descHe, setDescHe] = useState(content.metadata?.descriptionHe || '');
  const [href, setHref] = useState(content.metadata?.href || '');
  const [icon, setIcon] = useState(content.metadata?.icon || 'Link');
  
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const IconComponent = iconComponents[content.metadata?.icon] || iconComponents['ExternalLink'];

  const handleSave = () => {
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: titleHe,
        valueEn: titleHe, // Auto-copy Hebrew to English
        metadata: {
          ...content.metadata,
          descriptionHe: descHe,
          descriptionEn: descHe, // Auto-copy Hebrew to English
          href,
          icon,
        },
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitleHe(content.valueHe || '');
    setDescHe(content.metadata?.descriptionHe || '');
    setHref(content.metadata?.href || '');
    setIcon(content.metadata?.icon || 'Link');
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
              <span className="text-sm">עריכת קישור מהיר</span>
            </div>
            <VersionHistory contentId={content.id} currentValueHe={content.valueHe || ''} currentValueEn={content.valueEn || ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">אייקון</label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">קישור (URL)</label>
              <Input value={href} onChange={(e) => setHref(e.target.value)} dir="ltr" placeholder="/booking" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">כותרת</label>
            <Input value={titleHe} onChange={(e) => setTitleHe(e.target.value)} dir="rtl" />
            <label className="text-sm font-medium">תיאור</label>
            <Input value={descHe} onChange={(e) => setDescHe(e.target.value)} dir="rtl" />
          </div>

          <LivePreview
            type="link"
            data={{
              titleHe,
              titleEn: titleHe,
              descriptionHe: descHe,
              descriptionEn: descHe,
              icon,
              href,
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
      <CardContent className="p-3 flex items-center gap-3">
        <div 
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          {...dragListeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        </div>
        
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch checked={content.isActive} onCheckedChange={handleToggleActive} />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDuplicate?.(content)}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteContent.mutate(content.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
        </div>
        
        <div className="flex-1 min-w-0 pr-24">
          <h4 className="font-medium text-sm">{content.valueHe}</h4>
          <p className="text-xs text-muted-foreground">{content.metadata?.href}</p>
        </div>
      </CardContent>
    </Card>
  );
}
