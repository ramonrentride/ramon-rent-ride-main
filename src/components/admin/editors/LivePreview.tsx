import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Languages } from 'lucide-react';
import { iconComponents } from './IconPicker';

interface LivePreviewProps {
  type: 'feature' | 'tip' | 'repair' | 'animal' | 'link' | 'trail';
  data: {
    titleHe?: string;
    titleEn?: string;
    descriptionHe?: string;
    descriptionEn?: string;
    icon?: string;
    image?: string;
    bgColor?: string;
    difficulty?: string;
    duration?: string;
    distance?: string;
    href?: string;
  };
}

export function LivePreview({ type, data }: LivePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isHebrew, setIsHebrew] = useState(true);

  const IconComponent = data.icon ? iconComponents[data.icon] : null;
  const title = isHebrew ? data.titleHe : data.titleEn;
  const description = isHebrew ? data.descriptionHe : data.descriptionEn;

  if (!showPreview) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(true)}
        className="w-full"
      >
        <Eye className="h-4 w-4 ml-2" />
        תצוגה מקדימה
      </Button>
    );
  }

  const renderPreview = () => {
    switch (type) {
      case 'feature':
        return (
          <div className={`flex flex-col items-center text-center p-4 ${data.bgColor || ''}`}>
            {data.image && (
              <div className="w-full h-24 -mt-4 -mx-4 mb-3 overflow-hidden">
                <img src={data.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {IconComponent && (
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
            )}
            <h3 className="font-semibold text-lg">{title || 'כותרת'}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description || 'תיאור'}</p>
          </div>
        );

      case 'tip':
        return (
          <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                {IconComponent && <IconComponent className="h-7 w-7 text-blue-600" />}
              </div>
              <h4 className="font-bold text-lg">{title || 'כותרת הטיפ'}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{description || 'תיאור הטיפ יופיע כאן'}</p>
            </div>
          </div>
        );

      case 'repair':
        const difficultyColor = 
          data.difficulty === 'קל מאוד' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' :
          data.difficulty === 'קל' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' :
          data.difficulty === 'בינוני' ? 'bg-amber-500/20 text-amber-700 border-amber-500/30' :
          'bg-red-500/20 text-red-700 border-red-500/30';
        
        return (
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                {IconComponent && <IconComponent className="h-6 w-6 text-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold">{title || 'שם הבעיה'}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${difficultyColor}`}>
                    {data.difficulty || 'קל'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{description || 'פתרון הבעיה יופיע כאן'}</p>
              </div>
            </div>
          </div>
        );

      case 'animal':
        return (
          <div className="rounded-lg overflow-hidden">
            {data.image ? (
              <img src={data.image} alt="" className="w-full h-24 object-cover" />
            ) : (
              <div className="w-full h-24 bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">תמונה</span>
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold">{title || 'שם'}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description || 'תיאור'}</p>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h4 className="font-medium text-sm">{title || 'קישור'}</h4>
              <p className="text-xs text-muted-foreground">{data.href || '/link'}</p>
            </div>
          </div>
        );

      case 'trail':
        const difficultyColors: Record<string, string> = {
          easy: 'bg-success/20 text-success',
          moderate: 'bg-warning/20 text-warning',
          hard: 'bg-destructive/20 text-destructive',
        };
        const difficultyLabels: Record<string, string> = {
          easy: isHebrew ? 'קל' : 'Easy',
          moderate: isHebrew ? 'בינוני' : 'Moderate',
          hard: isHebrew ? 'קשה' : 'Hard',
        };
        
        return (
          <div className="rounded-lg overflow-hidden">
            <div className="relative">
              {data.image ? (
                <img src={data.image} alt="" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">תמונת מסלול</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {data.difficulty && (
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${difficultyColors[data.difficulty] || ''}`}>
                  {difficultyLabels[data.difficulty] || data.difficulty}
                </span>
              )}
              <h4 className="absolute bottom-2 left-2 right-2 text-white font-bold">
                {title || 'שם המסלול'}
              </h4>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-2">{description || 'תיאור המסלול'}</p>
              <div className="flex gap-4 text-xs">
                <span>⏱️ {data.duration || '2-3'} {isHebrew ? 'שעות' : 'hours'}</span>
                <span>📍 {data.distance || '10'} {isHebrew ? 'ק"מ' : 'km'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">תצוגה מקדימה</span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsHebrew(!isHebrew)}
              title={isHebrew ? 'עברית' : 'English'}
            >
              <Languages className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPreview(false)}
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className={`rounded-lg bg-card border ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
          {renderPreview()}
        </div>
      </CardContent>
    </Card>
  );
}
