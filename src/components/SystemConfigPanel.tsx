import { useState } from 'react';
import { useSystemConfig, SystemConfig } from '@/hooks/useSystemConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_GROUPS = {
  domain: {
    title: 'דומיין ואתר',
    description: 'הגדרות דומיין וכתובת האתר',
    keys: ['custom_domain', 'contact_email'],
  },
  stripe: {
    title: 'Stripe תשלומים',
    description: 'הגדרות Stripe לתשלומים (Test Mode)',
    keys: ['stripe_public_key', 'stripe_secret_key'],
  },
  smtp: {
    title: 'דואר אלקטרוני',
    description: 'הגדרות SMTP לשליחת מיילים',
    keys: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password'],
  },
  notifications: {
    title: 'התראות',
    description: 'הגדרות WhatsApp ודוחות',
    keys: ['whatsapp_number', 'daily_report_time', 'daily_report_enabled'],
  },
  business: {
    title: 'עסק',
    description: 'הגדרות עסקיות',
    keys: ['security_deposit'],
  },
};

const SENSITIVE_KEYS = ['stripe_secret_key', 'smtp_password'];

export const SystemConfigPanel = () => {
  const { configs, isLoading, updateConfig } = useSystemConfig();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getConfigByKey = (key: string): SystemConfig | undefined => {
    return configs?.find(c => c.key === key);
  };

  const handleSave = async (key: string) => {
    const newValue = editedValues[key];
    if (newValue === undefined) return;

    setSaving(key);
    try {
      await updateConfig.mutateAsync({ 
        key, 
        value: newValue,
        is_placeholder: newValue === '' 
      });
      setEditedValues(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      toast.success('ההגדרה נשמרה בהצלחה');
    } catch (error) {
      toast.error('שגיאה בשמירת ההגדרה');
    } finally {
      setSaving(null);
    }
  };

  const getValue = (key: string): string => {
    if (editedValues[key] !== undefined) return editedValues[key];
    return getConfigByKey(key)?.value || '';
  };

  const hasChanges = (key: string): boolean => {
    const original = getConfigByKey(key)?.value || '';
    return editedValues[key] !== undefined && editedValues[key] !== original;
  };

  const renderConfigInput = (key: string) => {
    const config = getConfigByKey(key);
    const isSensitive = SENSITIVE_KEYS.includes(key);
    const isVisible = showSensitive[key];
    const value = getValue(key);

    if (key === 'daily_report_enabled') {
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => {
              setEditedValues(prev => ({ ...prev, [key]: checked ? 'true' : 'false' }));
            }}
          />
          <span className="text-sm text-muted-foreground">
            {value === 'true' ? 'פעיל' : 'כבוי'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={isSensitive && !isVisible ? 'password' : 'text'}
            value={value}
            onChange={(e) => setEditedValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={config?.description || ''}
            className="text-left ltr"
            dir="ltr"
          />
          {isSensitive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }))}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {hasChanges(key) && (
          <Button
            size="sm"
            onClick={() => handleSave(key)}
            disabled={saving === key}
          >
            {saving === key ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  };

  const renderConfigLabel = (key: string) => {
    const config = getConfigByKey(key);
    const labelMap: Record<string, string> = {
      custom_domain: 'דומיין מותאם אישית',
      contact_email: 'אימייל ליצירת קשר',
      stripe_public_key: 'מפתח ציבורי (Publishable)',
      stripe_secret_key: 'מפתח סודי (Secret)',
      smtp_host: 'שרת SMTP',
      smtp_port: 'פורט',
      smtp_user: 'שם משתמש',
      smtp_password: 'סיסמה',
      whatsapp_number: 'מספר WhatsApp',
      daily_report_time: 'שעת דוח יומי',
      daily_report_enabled: 'הפעל דוח יומי אוטומטי',
      security_deposit: 'פיקדון ביטחון (₪)',
    };

    return (
      <div className="flex items-center gap-2">
        <Label>{labelMap[key] || key}</Label>
        {config?.is_placeholder && config.value !== '' && (
          <Badge variant="outline" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Placeholder
          </Badge>
        )}
        {!config?.is_placeholder && config?.value && (
          <Badge variant="default" className="text-xs bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            מוגדר
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">הגדרות מערכת</h2>
          <p className="text-muted-foreground">
            הגדר את פרטי הדומיין, תשלומים והתראות
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">הערה חשובה</p>
            <p className="text-yellow-700">
              האתר יעבוד על כל כתובת URL (כולל הכתובת הזמנית של Lovable) עד שהדומיין המותאם יהיה מוכן.
              אין צורך לשנות קוד - כל הקישורים דינמיים.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(CONFIG_GROUPS).map(([groupKey, group]) => (
        <Card key={groupKey}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.keys.map(key => (
              <div key={key} className="space-y-2">
                {renderConfigLabel(key)}
                {renderConfigInput(key)}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
