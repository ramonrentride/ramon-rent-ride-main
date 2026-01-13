import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSiteContent, useUpdateSiteContent, useCreateSiteContent } from '@/hooks/useSiteContent';
import { Shield, FileText, Loader2, Plus, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InsuranceSection {
  id: string;
  contentKey: string;
  titleHe: string;
  titleEn: string;
  contentHe: string;
  contentEn: string;
  exclusionsHe?: string[];
  exclusionsEn?: string[];
  amount?: number;
  chargeAmount?: number;
}

export function LegalPolicyEditor() {
  const { data: termsContent, isLoading: termsLoading } = useSiteContent('legal.terms');
  const { data: insuranceContent, isLoading: insuranceLoading } = useSiteContent('legal.insurance');
  const updateContent = useUpdateSiteContent();
  const createContent = useCreateSiteContent();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('terms');
  const [showTermsPreview, setShowTermsPreview] = useState(false);
  const [showInsurancePreview, setShowInsurancePreview] = useState(false);

  if (termsLoading || insuranceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const termsMain = termsContent?.find(c => c.contentKey === 'main');

  // Parse insurance sections from content
  const insuranceSections: InsuranceSection[] = (insuranceContent || [])
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(section => ({
      id: section.id,
      contentKey: section.contentKey,
      titleHe: section.valueHe || '',
      titleEn: section.valueEn || '',
      contentHe: (section.metadata as any)?.contentHe || '',
      contentEn: (section.metadata as any)?.contentEn || '',
      exclusionsHe: (section.metadata as any)?.exclusionsHe,
      exclusionsEn: (section.metadata as any)?.exclusionsEn,
      amount: (section.metadata as any)?.amount,
      chargeAmount: (section.metadata as any)?.chargeAmount,
    }));

  const handleUpdateTerms = (field: 'contentHe' | 'contentEn', value: string) => {
    if (!termsMain) return;
    
    const metadata = { ...(termsMain.metadata as Record<string, any> || {}) };
    metadata[field] = value;
    
    updateContent.mutate({
      id: termsMain.id,
      updates: { metadata },
    });
  };

  const handleUpdateInsuranceSection = (
    sectionId: string,
    updates: Partial<InsuranceSection>
  ) => {
    const section = insuranceContent?.find(s => s.id === sectionId);
    if (!section) return;

    const metadata = { ...(section.metadata as Record<string, any> || {}) };
    
    if (updates.contentHe !== undefined) metadata.contentHe = updates.contentHe;
    if (updates.contentEn !== undefined) metadata.contentEn = updates.contentEn;
    if (updates.exclusionsHe !== undefined) metadata.exclusionsHe = updates.exclusionsHe;
    if (updates.exclusionsEn !== undefined) metadata.exclusionsEn = updates.exclusionsEn;
    if (updates.amount !== undefined) metadata.amount = updates.amount;
    if (updates.chargeAmount !== undefined) metadata.chargeAmount = updates.chargeAmount;

    updateContent.mutate({
      id: sectionId,
      updates: {
        valueHe: updates.titleHe !== undefined ? updates.titleHe : section.valueHe,
        valueEn: updates.titleEn !== undefined ? updates.titleEn : section.valueEn,
        metadata,
      },
    });
  };

  const handleAddExclusion = (sectionId: string) => {
    const section = insuranceSections.find(s => s.id === sectionId);
    if (!section) return;

    const exclusions = [...(section.exclusionsHe || []), ''];

    handleUpdateInsuranceSection(sectionId, {
      exclusionsHe: exclusions,
    });
  };

  const handleUpdateExclusion = (sectionId: string, index: number, value: string) => {
    const section = insuranceSections.find(s => s.id === sectionId);
    if (!section) return;

    const exclusions = [...(section.exclusionsHe || [])];
    exclusions[index] = value;

    handleUpdateInsuranceSection(sectionId, {
      exclusionsHe: exclusions,
    });
  };

  const handleRemoveExclusion = (sectionId: string, index: number) => {
    const section = insuranceSections.find(s => s.id === sectionId);
    if (!section) return;

    const exclusions = (section.exclusionsHe || []).filter((_, i) => i !== index);

    handleUpdateInsuranceSection(sectionId, {
      exclusionsHe: exclusions,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            הסכם משפטי
          </TabsTrigger>
          <TabsTrigger value="insurance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            מדיניות ביטוח
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">הסכם משפטי כללי</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowTermsPreview(true)}>
                <Eye className="h-4 w-4 ml-2" />
                תצוגה מקדימה
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>תוכן בעברית</Label>
                <Textarea
                  value={(termsMain?.metadata as any)?.contentHe || ''}
                  onChange={(e) => handleUpdateTerms('contentHe', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  dir="rtl"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="mt-6 space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={() => setShowInsurancePreview(true)}>
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה
            </Button>
          </div>
          
          {insuranceSections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">
                    {index + 1}
                  </span>
                  {section.titleHe}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>כותרת</Label>
                  <Input
                    value={section.titleHe}
                    onChange={(e) => handleUpdateInsuranceSection(section.id, { titleHe: e.target.value })}
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>תוכן</Label>
                  <Textarea
                    value={section.contentHe}
                    onChange={(e) => handleUpdateInsuranceSection(section.id, { contentHe: e.target.value })}
                    rows={3}
                    dir="rtl"
                  />
                </div>

                {/* Amount fields */}
                {section.amount !== undefined && (
                  <div className="space-y-2">
                    <Label>סכום השתתפות עצמית (₪)</Label>
                    <Input
                      type="number"
                      value={section.amount}
                      onChange={(e) => handleUpdateInsuranceSection(section.id, { amount: Number(e.target.value) })}
                      className="w-32"
                    />
                  </div>
                )}

                {section.chargeAmount !== undefined && (
                  <div className="space-y-2">
                    <Label>סכום חיוב גניבה (₪)</Label>
                    <Input
                      type="number"
                      value={section.chargeAmount}
                      onChange={(e) => handleUpdateInsuranceSection(section.id, { chargeAmount: Number(e.target.value) })}
                      className="w-32"
                    />
                  </div>
                )}

                {/* Exclusions - Hebrew only */}
                {section.exclusionsHe && (
                  <div className="space-y-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <Label className="text-destructive">דברים שהביטוח לא מכסה</Label>
                    
                    <div className="space-y-2">
                      {section.exclusionsHe.map((exclusion, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={exclusion}
                            onChange={(e) => handleUpdateExclusion(section.id, i, e.target.value)}
                            dir="rtl"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveExclusion(section.id, i)}
                            className="shrink-0 text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddExclusion(section.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        הוסף חריג
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 השינויים נשמרים אוטומטית ויופיעו מיידית בדיאלוג הביטוח ובהסכם המשפטי.
      </div>

      {/* Terms Preview Dialog */}
      <Dialog open={showTermsPreview} onOpenChange={setShowTermsPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              תצוגה מקדימה - הסכם משפטי
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
            {(termsMain?.metadata as any)?.contentHe || 'אין תוכן'}
          </div>
        </DialogContent>
      </Dialog>

      {/* Insurance Preview Dialog */}
      <Dialog open={showInsurancePreview} onOpenChange={setShowInsurancePreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              תצוגה מקדימה - מדיניות ביטוח
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {insuranceSections.map((section, index) => (
              <div key={section.id} className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">
                    {index + 1}
                  </span>
                  {section.titleHe}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.contentHe}
                </p>
                
                {section.amount !== undefined && (
                  <p className="text-sm font-medium">
                    השתתפות עצמית: <span className="text-primary">{section.amount}₪</span>
                  </p>
                )}
                
                {section.chargeAmount !== undefined && (
                  <p className="text-sm font-medium">
                    חיוב גניבה: <span className="text-destructive">{section.chargeAmount}₪</span>
                  </p>
                )}
                
                {section.exclusionsHe && section.exclusionsHe.length > 0 && (
                  <div className="mt-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-2">הביטוח לא מכסה:</p>
                    <ul className="list-disc pr-5 text-sm text-destructive/80 space-y-1">
                      {section.exclusionsHe.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
