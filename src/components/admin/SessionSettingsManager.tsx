import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSessionSettings, useUpdateSessionSetting, useCreateSessionSetting } from '@/hooks/useSessionSettings';
import { Sun, Clock, Loader2, MessageSquare, ShoppingBag } from 'lucide-react';

export function SessionSettingsManager() {
  const { data: settings, isLoading } = useSessionSettings();
  const updateMutation = useUpdateSessionSetting();
  const createMutation = useCreateSessionSetting();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const morningSetting = settings?.find(s => s.sessionType === 'morning');
  const dailySetting = settings?.find(s => s.sessionType === 'daily');
  const picnicSetting = settings?.find(s => s.sessionType === 'picnic');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        🕐 ניהול משמרות
      </h3>
      <p className="text-sm text-muted-foreground">
        הפעל או השבת משמרות ספציפיות. השינויים ישתקפו מיידית בדף ההזמנות.
      </p>

      <div className="space-y-4">
        {/* Morning Session */}
        <div className="p-4 border rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-6 h-6 text-primary" />
              <div>
                <Label className="text-base font-medium">סשן בוקר ☀️</Label>
                <p className="text-sm text-muted-foreground">07:00 - 14:00</p>
              </div>
            </div>
            <Switch
              checked={morningSetting?.isEnabled ?? true}
              onCheckedChange={(checked) => {
                updateMutation.mutate({
                  sessionType: 'morning',
                  updates: { isEnabled: checked },
                });
              }}
              disabled={updateMutation.isPending}
            />
          </div>

          {!morningSetting?.isEnabled && (
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                הודעה כשהסשן מושבת
              </Label>
              <Textarea
                placeholder="הודעה להצגה בדף ההזמנות (למשל: זמין רק בעונת הקיץ)"
                value={morningSetting?.disabledMessageHe || ''}
                onChange={(e) => {
                  updateMutation.mutate({
                    sessionType: 'morning',
                    updates: { disabledMessageHe: e.target.value },
                  });
                }}
                className="text-sm"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Daily Session */}
        <div className="p-4 border rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-accent" />
              <div>
                <Label className="text-base font-medium">סשן יומי 🌅</Label>
                <p className="text-sm text-muted-foreground">24 שעות</p>
              </div>
            </div>
            <Switch
              checked={dailySetting?.isEnabled ?? true}
              onCheckedChange={(checked) => {
                updateMutation.mutate({
                  sessionType: 'daily',
                  updates: { isEnabled: checked },
                });
              }}
              disabled={updateMutation.isPending}
            />
          </div>

          {!dailySetting?.isEnabled && (
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                הודעה כשהסשן מושבת
              </Label>
              <Textarea
                placeholder="הודעה להצגה בדף ההזמנות (למשל: חזרנו בקרוב)"
                value={dailySetting?.disabledMessageHe || ''}
                onChange={(e) => {
                  updateMutation.mutate({
                    sessionType: 'daily',
                    updates: { disabledMessageHe: e.target.value },
                  });
                }}
                className="text-sm"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>


      {/* Picnic Setting */}
      <div className="p-4 border rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-green-600" />
            <div>
              <Label className="text-base font-medium">שלב הפיקניק 🧺</Label>
              <p className="text-sm text-muted-foreground">הצג/הסתר את שלב הפיקניק בהזמנה</p>
            </div>
          </div>
          <Switch
            checked={picnicSetting?.isEnabled ?? true}
            onCheckedChange={(checked) => {
              if (!picnicSetting) {
                createMutation.mutate({ sessionType: 'picnic', isEnabled: checked });
              } else {
                updateMutation.mutate({
                  sessionType: 'picnic',
                  updates: { isEnabled: checked },
                });
              }
            }}
            disabled={updateMutation.isPending || createMutation.isPending}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 טיפ: כאשר משמרת מושבתת, היא לא תופיע כאפשרות בדף ההזמנות. ניתן לכתוב הודעה מותאמת שתוצג ללקוחות.
      </div>
    </div>
  );
}
