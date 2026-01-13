import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CreditCard, Shield, FileSignature } from 'lucide-react';
import { VisualContentEditor } from './VisualContentEditor';
import { SessionSettingsManager } from './SessionSettingsManager';
import { PaymentMethodsManager } from './PaymentMethodsManager';
import { LegalPolicyEditor } from './editors/LegalPolicyEditor';
import { WaiverEditor } from './WaiverEditor';

export function SiteContentManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSubtab = searchParams.get('subtab') || 'content';

  const handleSubtabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('subtab', value);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">ניהול תוכן האתר</h2>
        <p className="text-muted-foreground">ערכו את התוכן כמו שהוא מופיע באתר</p>
      </div>

      <Tabs value={currentSubtab} onValueChange={handleSubtabChange} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            תוכן האתר
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            משפטי ומדיניות
          </TabsTrigger>
          <TabsTrigger value="waiver" className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            טופס הוויתור
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            סשנים
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            תשלומים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <VisualContentEditor />
        </TabsContent>

        <TabsContent value="legal">
          <LegalPolicyEditor />
        </TabsContent>

        <TabsContent value="waiver">
          <WaiverEditor />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionSettingsManager />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentMethodsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
