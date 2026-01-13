import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { useAccessibility } from '@/lib/accessibility';
import { 
  Accessibility, 
  Languages, 
  Eye, 
  Type, 
  Zap,
  Globe
} from 'lucide-react';

export function AccessibilityMenu() {
  const { language, setLanguage, t } = useI18n();
  const { settings, toggleHighContrast, toggleLargeText, toggleReducedMotion } = useAccessibility();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      {/* Language Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
        className="rounded-full w-12 h-12 bg-background/90 backdrop-blur-sm shadow-lg border-2"
        aria-label={t('language')}
      >
        <Globe className="w-5 h-5" />
        <span className="sr-only">{language === 'he' ? 'English' : 'עברית'}</span>
      </Button>

      {/* Accessibility Menu */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12 bg-background/90 backdrop-blur-sm shadow-lg border-2"
            aria-label={t('accessibility')}
          >
            <Accessibility className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start" side="top">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Accessibility className="w-5 h-5 text-primary" />
              <h3 className="font-bold">{t('accessibility')}</h3>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <span>{t('language')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
              >
                {language === 'he' ? 'English' : 'עברית'}
              </Button>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>{t('highContrast')}</span>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={toggleHighContrast}
                aria-label={t('highContrast')}
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-muted-foreground" />
                <span>{t('largeText')}</span>
              </div>
              <Switch
                checked={settings.largeText}
                onCheckedChange={toggleLargeText}
                aria-label={t('largeText')}
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span>{t('reducedMotion')}</span>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={toggleReducedMotion}
                aria-label={t('reducedMotion')}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
