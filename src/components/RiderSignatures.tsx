import { useState, useEffect } from 'react';
import { SignaturePad } from '@/components/SignaturePad';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertTriangle, PenLine, UserCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { differenceInYears, parse, isValid } from 'date-fns';

export interface RiderSignatureData {
  riderId: string;
  riderName: string;
  signatureUrl: string | null;
  isMinor: boolean;
  birthDate?: string;
  guardianName?: string;
  guardianSignatureUrl?: string | null;
}

interface RiderSignaturesProps {
  riders: Array<{
    id: string;
    name: string;
    height: number;
    birthDate?: string;
  }>;
  onSignaturesChange: (signatures: RiderSignatureData[]) => void;
  signatures: RiderSignatureData[];
}

function calculateAge(birthDate: string): number {
  // Try parsing as YYYY-MM-DD first, then DD/MM/YYYY
  let parsedDate = parse(birthDate, 'yyyy-MM-dd', new Date());
  if (!isValid(parsedDate)) {
    parsedDate = parse(birthDate, 'dd/MM/yyyy', new Date());
  }
  if (!isValid(parsedDate)) {
    return 999; // Invalid date, assume adult
  }
  return differenceInYears(new Date(), parsedDate);
}

function isMinor(birthDate?: string): boolean {
  if (!birthDate) return false;
  return calculateAge(birthDate) < 18;
}

export function RiderSignatures({ riders, onSignaturesChange, signatures }: RiderSignaturesProps) {
  const { isRTL } = useI18n();

  // Initialize signatures for all valid riders
  useEffect(() => {
    const validRiders = riders.filter(r => r.name && r.height > 0);

    // Only update if riders changed
    const existingIds = new Set(signatures.map(s => s.riderId));
    const validIds = new Set(validRiders.map(r => r.id));

    const needsUpdate =
      validRiders.some(r => !existingIds.has(r.id)) ||
      signatures.some(s => !validIds.has(s.riderId));

    if (needsUpdate) {
      const newSignatures: RiderSignatureData[] = validRiders.map(rider => {
        const existing = signatures.find(s => s.riderId === rider.id);
        const riderIsMinor = isMinor(rider.birthDate);

        return {
          riderId: rider.id,
          riderName: rider.name,
          signatureUrl: existing?.signatureUrl || null,
          isMinor: riderIsMinor,
          birthDate: rider.birthDate,
          guardianName: existing?.guardianName || '',
          guardianSignatureUrl: existing?.guardianSignatureUrl || null,
        };
      });
      onSignaturesChange(newSignatures);
    }
  }, [riders]);

  const updateSignature = (riderId: string, signatureUrl: string | null) => {
    const updated = signatures.map(s =>
      s.riderId === riderId ? { ...s, signatureUrl } : s
    );
    onSignaturesChange(updated);
  };

  const updateGuardianName = (riderId: string, guardianName: string) => {
    const updated = signatures.map(s =>
      s.riderId === riderId ? { ...s, guardianName } : s
    );
    onSignaturesChange(updated);
  };

  const updateGuardianSignature = (riderId: string, guardianSignatureUrl: string | null) => {
    const updated = signatures.map(s =>
      s.riderId === riderId ? { ...s, guardianSignatureUrl } : s
    );
    onSignaturesChange(updated);
  };

  const validRiders = riders.filter(r => r.name && r.height > 0);

  if (validRiders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {isRTL ? 'אין רוכבים להחתמה' : 'No riders to sign'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">
          {isRTL ? 'חתימות רוכבים' : 'Rider Signatures'}
        </h3>
      </div>

      {validRiders.map((rider, index) => {
        const sig = signatures.find(s => s.riderId === rider.id);
        const riderIsMinor = isMinor(rider.birthDate);
        const age = rider.birthDate ? calculateAge(rider.birthDate) : null;

        return (
          <div
            key={rider.id}
            className={`p-5 rounded-xl border-2 space-y-4 ${riderIsMinor
                ? 'border-warning/50 bg-warning/5'
                : 'border-border bg-muted/30'
              }`}
          >
            {/* Rider Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚴</span>
                <div>
                  <h4 className="font-bold text-lg">
                    {isRTL ? `רוכב ${index + 1}` : `Rider ${index + 1}`}: {rider.name}
                  </h4>
                  {age !== null && (
                    <span className={`text-sm ${riderIsMinor ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                      {isRTL ? `גיל ${age}` : `Age ${age}`}
                      {riderIsMinor && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {isRTL ? 'קטין' : 'Minor'}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {sig?.signatureUrl && (!riderIsMinor || (sig.guardianName && sig.guardianSignatureUrl)) && (
                <div className="flex items-center gap-1 text-success text-sm">
                  <Check className="w-4 h-4" />
                  {isRTL ? 'הושלם' : 'Complete'}
                </div>
              )}
            </div>

            {/* Rider Signature - Only for Adults */}
            {!riderIsMinor && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {isRTL ? 'חתימת הרוכב' : 'Rider Signature'}
                </Label>
                <SignaturePad
                  onSignatureChange={(url) => updateSignature(rider.id, url)}
                  width={300}
                  height={120}
                />
              </div>
            )}

            {/* Guardian Section for Minors */}
            {riderIsMinor && (
              <div className="pt-4 border-t border-warning/30 space-y-4">
                <div className="flex items-center gap-2 text-warning">
                  <UserCheck className="w-5 h-5" />
                  <span className="font-semibold">
                    {isRTL ? 'חתימת הורה/אפוטרופוס (חובה לקטינים)' : 'Parent/Guardian Signature (required for minors)'}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? 'עבור רוכב קטין, נדרשת חתימת הורה/אפוטרופוס בלבד.'
                    : 'For a minor rider, only a parent/guardian signature is required.'}
                </p>

                <div>
                  <Label className="text-sm font-medium">
                    {isRTL ? 'שם ההורה/אפוטרופוס' : 'Parent/Guardian Name'}
                  </Label>
                  <Input
                    value={sig?.guardianName || ''}
                    onChange={(e) => updateGuardianName(rider.id, e.target.value)}
                    placeholder={isRTL ? 'שם מלא של ההורה' : 'Full name of parent'}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isRTL ? 'חתימת ההורה/אפוטרופוס' : 'Parent/Guardian Signature'}
                  </Label>
                  <SignaturePad
                    onSignatureChange={(url) => updateGuardianSignature(rider.id, url)}
                    width={300}
                    height={120}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        {(() => {
          const totalRiders = validRiders.length;
          // Count completed signatures: Adults with sig OR Minors with guardian sig + name
          const completedCount = signatures.filter(s => {
            if (s.isMinor) {
              return s.guardianName && s.guardianSignatureUrl;
            }
            return s.signatureUrl;
          }).length;

          if (isRTL) {
            return `${completedCount}/${totalRiders} חתימות הושלמו`;
          }
          return `${completedCount}/${totalRiders} signatures completed`;
        })()}
      </div>
    </div>
  );
}
