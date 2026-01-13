import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSiteContent } from '@/hooks/useSiteContent';

interface TermsLiabilityDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export const TermsLiabilityDialog = ({ trigger, children }: TermsLiabilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const { isRTL } = useI18n();
  const { data: termsContent, isLoading } = useSiteContent('legal.terms');
  const { data: insuranceContent } = useSiteContent('legal.insurance');

  const termsMain = termsContent?.find(c => c.contentKey === 'main');
  const mainContent = isRTL 
    ? (termsMain?.metadata as any)?.contentHe 
    : (termsMain?.metadata as any)?.contentEn;

  // Also show insurance sections for complete policy view
  const sections = (insuranceContent || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <button className="text-primary underline hover:text-primary/80 transition-colors inline-flex items-center gap-1">
            <Shield className="w-4 h-4" />
            {isRTL ? 'מדיניות ביטוח ואחריות' : 'Insurance & Liability Policy'}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-primary" />
            {isRTL ? 'מדיניות ביטוח ואחריות' : 'Insurance & Liability Policy'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 text-sm leading-relaxed">
              {/* Main terms content */}
              {mainContent && (
                <p className="text-muted-foreground whitespace-pre-line">{mainContent}</p>
              )}
              
              {/* Insurance sections */}
              {sections.map((section, index) => {
                const metadata = section.metadata as Record<string, any> || {};
                const title = isRTL ? section.valueHe : section.valueEn;
                const content = isRTL ? metadata.contentHe : metadata.contentEn;
                const exclusions = isRTL ? metadata.exclusionsHe : metadata.exclusionsEn;
                
                return (
                  <div key={section.id} className="space-y-2">
                    <h3 className="font-bold text-foreground">
                      {index + 1}. {title}
                    </h3>
                    <p className="text-muted-foreground">{content}</p>
                    
                    {exclusions && exclusions.length > 0 && (
                      <p className="text-muted-foreground">
                        {isRTL ? 'הביטוח אינו מכסה: ' : 'Insurance does NOT cover: '}
                        {exclusions.join(', ')}.
                      </p>
                    )}
                    
                    {metadata.amount && (
                      <p className="text-muted-foreground">
                        {isRTL ? `סכום: ${metadata.amount} ש"ח` : `Amount: ${metadata.amount}₪`}
                      </p>
                    )}
                    
                    {metadata.chargeAmount && (
                      <p className="text-muted-foreground">
                        {isRTL ? `חיוב גניבה מלא: עד ${metadata.chargeAmount} ש"ח לאופניים` : `Full theft charge: up to ${metadata.chargeAmount}₪ per bike`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
