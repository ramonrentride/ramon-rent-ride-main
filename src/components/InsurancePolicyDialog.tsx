import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSiteContent } from '@/hooks/useSiteContent';

interface InsurancePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export const InsurancePolicyDialog = ({ open, onOpenChange, onAccept }: InsurancePolicyDialogProps) => {
  const { isRTL } = useI18n();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const { data: insuranceContent, isLoading } = useSiteContent('legal.insurance');

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
    setHasScrolledToBottom(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setHasScrolledToBottom(false);
  };

  // Sort sections by sortOrder
  const sections = (insuranceContent || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-primary" />
            {isRTL ? 'מדיניות ביטוח ואחריות' : 'Insurance & Liability Policy'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {isRTL 
              ? 'חשוב לקרוא את כל התנאים לפני האישור. גלול למטה כדי לקרוא את כל המידע החשוב.'
              : 'Please read all terms carefully before accepting. Scroll down to read all important information.'
            }
          </p>
        </div>

        <ScrollArea className="h-[50vh] pr-4" onScrollCapture={handleScroll}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 text-sm leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
              {sections.map((section, index) => {
                const metadata = section.metadata as Record<string, any> || {};
                const title = isRTL ? section.valueHe : section.valueEn;
                const content = isRTL ? metadata.contentHe : metadata.contentEn;
                const exclusions = isRTL ? metadata.exclusionsHe : metadata.exclusionsEn;
                
                return (
                  <section key={section.id}>
                    <h3 className="font-bold text-base mb-2 text-foreground flex items-center gap-2">
                      🔹 {index + 1}. {title}
                    </h3>
                    <p className="text-muted-foreground">{content}</p>
                    
                    {/* Exclusions list */}
                    {exclusions && exclusions.length > 0 && (
                      <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-destructive font-medium text-sm">
                          ⚠️ {isRTL ? 'הביטוח אינו מכסה:' : 'Insurance does NOT cover:'}
                        </p>
                        <ul className="list-disc list-inside text-destructive/80 text-sm mt-1 space-y-1">
                          {exclusions.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Amount display for deductible */}
                    {metadata.amount && (
                      <div className="mt-2 p-2 bg-muted rounded-lg text-sm">
                        💰 {isRTL ? `סכום: ${metadata.amount} ש"ח` : `Amount: ${metadata.amount}₪`}
                      </div>
                    )}
                    
                    {/* Charge amount for theft */}
                    {metadata.chargeAmount && (
                      <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-destructive font-medium">
                          💰 {isRTL ? `חיוב גניבה מלא: עד ${metadata.chargeAmount} ש"ח לאופניים` : `Full theft charge: up to ${metadata.chargeAmount}₪ per bike`}
                        </p>
                      </div>
                    )}
                    
                    {/* Waiver note */}
                    {section.contentKey === 'section.waiver' && (
                      <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-300 font-medium text-sm">
                          💡 {isRTL ? 'יש לשקול ביטוח בריאות פרטי' : 'Consider obtaining private health insurance'}
                        </p>
                      </div>
                    )}
                  </section>
                );
              })}

              <div className="pt-4 pb-2 text-center text-muted-foreground">
                👇 {isRTL ? 'גלול למטה לסיום הקריאה' : 'Scroll to finish reading'}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button variant="outline" onClick={handleClose}>
            {isRTL ? 'ביטול' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!hasScrolledToBottom}
            className={`gap-2 ${hasScrolledToBottom ? 'btn-hero' : ''}`}
          >
            <CheckCircle className="w-4 h-4" />
            {isRTL ? 'קראתי ואני מאשר' : 'I have read and accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
