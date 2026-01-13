import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Check, X, Trash2, GripVertical, Copy } from 'lucide-react';
import { SiteContent, useUpdateSiteContent, useDeleteSiteContent } from '@/hooks/useSiteContent';
import { IconPicker, iconComponents } from './IconPicker';
import { LivePreview } from './LivePreview';
import { VersionHistory } from './VersionHistory';

interface TipCardEditorProps {
  content: SiteContent;
  type: 'tip' | 'repair';
  onDuplicate?: (content: SiteContent) => void;
  dragListeners?: any;
}

const difficultyOptions = [
  { value: 'קל מאוד', label: 'קל מאוד' },
  { value: 'קל', label: 'קל' },
  { value: 'בינוני', label: 'בינוני' },
  { value: 'קשה', label: 'קשה' },
];

export function TipCardEditor({ content, type, onDuplicate, dragListeners }: TipCardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleHe, setTitleHe] = useState(content.valueHe || '');
  const [titleEn, setTitleEn] = useState(content.valueEn || '');
  const [descHe, setDescHe] = useState(content.metadata?.descriptionHe || content.metadata?.solutionHe || '');
  const [descEn, setDescEn] = useState(content.metadata?.descriptionEn || content.metadata?.solutionEn || '');
  const [icon, setIcon] = useState(content.metadata?.icon || 'Droplets');
  const [difficulty, setDifficulty] = useState(content.metadata?.difficulty || 'קל');
  
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const IconComponent = iconComponents[content.metadata?.icon] || iconComponents['Droplets'];
  const descKey = type === 'repair' ? 'solution' : 'description';

  const handleSave = () => {
    const metadata: Record<string, any> = {
      ...content.metadata,
      [`${descKey}He`]: descHe,
      [`${descKey}En`]: descEn || descHe,
      icon,
    };
    
    if (type === 'repair') {
      metadata.difficulty = difficulty;
    }
    
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: titleHe,
        valueEn: titleEn || titleHe,
        metadata,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitleHe(content.valueHe || '');
    setTitleEn(content.valueEn || '');
    setDescHe(content.metadata?.descriptionHe || content.metadata?.solutionHe || '');
    setDescEn(content.metadata?.descriptionEn || content.metadata?.solutionEn || '');
    setIcon(content.metadata?.icon || 'Droplets');
    setDifficulty(content.metadata?.difficulty || 'קל');
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
              <span className="text-sm">{type === 'repair' ? 'עריכת בעיה' : 'עריכת טיפ'}</span>
            </div>
            <VersionHistory contentId={content.id} currentValueHe={content.valueHe || ''} currentValueEn={content.valueEn || ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">אייקון</label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            {type === 'repair' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">רמת קושי</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">כותרת (עברית)</label>
              <Input value={titleHe} onChange={(e) => setTitleHe(e.target.value)} dir="rtl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (English)</label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{type === 'repair' ? 'פתרון (עברית)' : 'תיאור (עברית)'}</label>
              <Textarea value={descHe} onChange={(e) => setDescHe(e.target.value)} dir="rtl" rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{type === 'repair' ? 'Solution (English)' : 'Description (English)'}</label>
              <Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} dir="ltr" rows={3} placeholder="Optional" />
            </div>
          </div>

          <LivePreview
            type={type}
            data={{
              titleHe,
              titleEn: titleEn || titleHe,
              descriptionHe: descHe,
              descriptionEn: descEn || descHe,
              icon,
              difficulty,
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
      <CardContent className="p-3 flex items-start gap-3">
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

        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'repair' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
          {IconComponent && <IconComponent className={`h-4 w-4 ${type === 'repair' ? 'text-destructive' : 'text-primary'}`} />}
        </div>
        
        <div className="flex-1 min-w-0 pr-20">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{content.valueHe}</h4>
            {type === 'repair' && content.metadata?.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                content.metadata.difficulty === 'קל מאוד' ? 'bg-emerald-500/20 text-emerald-700' :
                content.metadata.difficulty === 'קל' ? 'bg-blue-500/20 text-blue-700' :
                content.metadata.difficulty === 'בינוני' ? 'bg-amber-500/20 text-amber-700' :
                'bg-red-500/20 text-red-700'
              }`}>
                {content.metadata.difficulty}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {content.metadata?.descriptionHe || content.metadata?.solutionHe}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
