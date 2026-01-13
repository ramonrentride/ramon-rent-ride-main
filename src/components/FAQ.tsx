import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Clock, Bike, Shield, MapPin, Phone, Camera, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function FAQ() {
  const { t, isRTL } = useI18n();

  const faqItems = [
    {
      icon: Clock,
      questionKey: 'faqHoursQuestion',
      answerKey: 'faqHoursAnswer',
    },
    {
      icon: Bike,
      questionKey: 'faqBikeQuestion',
      answerKey: 'faqBikeAnswer',
    },
    {
      icon: Shield,
      questionKey: 'faqIncludedQuestion',
      answerKey: 'faqIncludedAnswer',
    },
    {
      icon: AlertTriangle,
      questionKey: 'faqLateQuestion',
      answerKey: 'faqLateAnswer',
    },
    {
      icon: MapPin,
      questionKey: 'faqLocationQuestion',
      answerKey: 'faqLocationAnswer',
    },
    {
      icon: Camera,
      questionKey: 'faqPhotoQuestion',
      answerKey: 'faqPhotoAnswer',
    },
    {
      icon: Phone,
      questionKey: 'faqEmergencyQuestion',
      answerKey: 'faqEmergencyAnswer',
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">{t('faqTitle')}</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('faqDescription')}
          </h2>
          <p className="text-muted-foreground">
            {t('faqSubtitle')}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-card rounded-xl border-none overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                <div className={`flex items-center gap-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{t(item.questionKey)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
                {t(item.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}