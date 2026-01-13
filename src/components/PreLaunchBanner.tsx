import { X, Sparkles, Rocket, Bell } from 'lucide-react';
import { useState } from 'react';
import { usePreLaunchMode } from '@/hooks/usePreLaunchMode';
import { Button } from '@/components/ui/button';

interface PreLaunchBannerProps {
  onJoinClick?: () => void;
}

export function PreLaunchBanner({ onJoinClick }: PreLaunchBannerProps) {
  const { isPreLaunchMode, settingLoading, bannerTitle, bannerSubtitle } = usePreLaunchMode();
  const [dismissed, setDismissed] = useState(false);

  if (settingLoading || !isPreLaunchMode || dismissed) {
    return null;
  }

  const title = bannerTitle || '🎉 פתיחה חגיגית בקרוב!';
  const subtitle = bannerSubtitle || 'האתר בהרצה - הירשמו לרשימת המתנה ונעדכן אתכם ראשונים';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer" />
      
      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
      
      <div className="relative py-4 md:py-5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center text-primary-foreground">
          {/* Animated icons */}
          <div className="flex items-center gap-2">
            <Rocket className="w-6 h-6 md:w-7 md:h-7 animate-bounce" />
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
          </div>
          
          {/* Text content */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg md:text-2xl lg:text-3xl font-black tracking-wide drop-shadow-lg">
              {title}
            </h2>
            <p className="text-sm md:text-base lg:text-lg font-medium opacity-95 mt-1">
              {subtitle}
            </p>
          </div>
          
          {/* CTA Button */}
          {onJoinClick && (
            <Button
              onClick={onJoinClick}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Bell className="w-4 h-4 ml-2" />
              הצטרפו עכשיו!
            </Button>
          )}
          
          {/* Animated icons right side */}
          <div className="hidden md:flex items-center gap-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            <Rocket className="w-6 h-6 md:w-7 md:h-7 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
