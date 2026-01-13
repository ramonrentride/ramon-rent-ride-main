import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { usePreLaunchMode } from '@/hooks/usePreLaunchMode';
import { useWaiverText } from '@/hooks/useWaiverText';
import { SignaturePad } from '@/components/SignaturePad';
import { Loader2, Sparkles, CheckCircle, Mail, Phone, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { validatePhone, validateEmail } from '@/lib/validation';
import ReactMarkdown from 'react-markdown';

interface WaitingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'info' | 'waiver' | 'success';

export function WaitingListDialog({ open, onOpenChange }: WaitingListDialogProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<Step>('info');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  
  const { joinWaitingList } = usePreLaunchMode();
  const { waiverText, waiverVersion } = useWaiverText();

  // Detect if input is email or phone
  const contactType = useMemo(() => {
    const trimmed = contact.trim();
    if (!trimmed) return null;
    if (trimmed.includes('@')) return 'email';
    return 'phone';
  }, [contact]);

  // Validate contact based on detected type
  const validation = useMemo(() => {
    const trimmed = contact.trim();
    if (!trimmed) return { valid: false, error: undefined };
    
    if (contactType === 'email') {
      return validateEmail(trimmed);
    } else {
      const cleanPhone = trimmed.replace(/[-\s]/g, '');
      return validatePhone(cleanPhone);
    }
  }, [contact, contactType]);

  const canProceedToWaiver = name.trim() && validation.valid;
  const canSubmit = waiverAccepted && signatureDataUrl;

  const handleNextStep = () => {
    if (step === 'info' && canProceedToWaiver) {
      setStep('waiver');
    }
  };

  const handlePrevStep = () => {
    if (step === 'waiver') {
      setStep('info');
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    const trimmedContact = contact.trim();
    const cleanPhone = contactType === 'phone' ? trimmedContact.replace(/[-\s]/g, '') : undefined;
    
    try {
      await joinWaitingList.mutateAsync({ 
        name: name.trim(), 
        phone: cleanPhone,
        email: contactType === 'email' ? trimmedContact : undefined,
        signatureDataUrl: signatureDataUrl || undefined,
        waiverVersion,
      });
      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        // Reset state
        setStep('info');
        setName('');
        setContact('');
        setSignatureDataUrl(null);
        setWaiverAccepted(false);
      }, 2500);
    } catch (error) {
      console.error('Failed to join waiting list:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset on close
      setStep('info');
      setName('');
      setContact('');
      setSignatureDataUrl(null);
      setWaiverAccepted(false);
    }
    onOpenChange(newOpen);
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-scale-in" />
            <h3 className="text-2xl font-bold text-foreground mb-2">נרשמת בהצלחה! 🎉</h3>
            <p className="text-muted-foreground">נעדכן אותך ברגע שנפתח להזמנות</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {step === 'info' ? (
              <>
                <Sparkles className="w-6 h-6 text-primary" />
                הצטרפו לרשימת המתנה
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-primary" />
                תנאי שימוש וחתימה
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' 
              ? 'השאירו פרטים ונעדכן אתכם ראשונים כשנפתח להזמנות!'
              : 'אנא קראו את התנאים וחתמו למטה'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 px-1 mb-4">
          <div className={`flex-1 h-1 rounded-full ${step === 'info' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'waiver' ? 'bg-primary' : 'bg-muted'}`} />
        </div>
        
        {step === 'info' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הכנס שם מלא"
                required
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-2">
                טלפון או אימייל
                {contactType && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {contactType === 'email' ? (
                      <><Mail className="w-3 h-3" /> אימייל</>
                    ) : (
                      <><Phone className="w-3 h-3" /> טלפון</>
                    )}
                  </span>
                )}
              </Label>
              <Input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="050-000-0000 או email@example.com"
                required
                dir="ltr"
                className={contact && !validation.valid ? 'border-destructive' : ''}
              />
              {contact && validation.error && (
                <p className="text-xs text-destructive">{validation.error}</p>
              )}
            </div>
            
            <Button 
              onClick={handleNextStep}
              className="w-full gap-2"
              disabled={!canProceedToWaiver}
            >
              המשך לתנאים וחתימה
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 'waiver' && (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Waiver text */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-[200px] border rounded-lg p-4 bg-muted/30">
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm" dir="rtl">
                  <ReactMarkdown>{waiverText}</ReactMarkdown>
                </div>
              </ScrollArea>
            </div>

            {/* Signature section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">חתימה דיגיטלית</Label>
              <SignaturePad
                onSignatureChange={setSignatureDataUrl}
                width={400}
                height={150}
              />
            </div>

            {/* Acceptance checkbox */}
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
              <Checkbox
                id="waiver-accept"
                checked={waiverAccepted}
                onCheckedChange={(checked) => setWaiverAccepted(checked === true)}
              />
              <Label htmlFor="waiver-accept" className="text-sm leading-relaxed cursor-pointer">
                קראתי את התנאים ואני מסכים/ה להם. אני מאשר/ת שהחתימה למעלה היא חתימתי.
              </Label>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1 btn-hero gap-2"
                disabled={!canSubmit || joinWaitingList.isPending}
              >
                {joinWaitingList.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    הצטרף לרשימה
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
