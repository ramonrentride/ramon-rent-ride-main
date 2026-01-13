import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Bike, Users, Shield, MessageSquare, CheckCircle, Pencil, X, Check, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { useSiteContent, useCreateSiteContent, useUpdateSiteContent, useDeleteSiteContent, SiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/use-toast';
import { IconPicker, iconComponents } from './IconPicker';
import { SortableContainer } from './SortableContainer';
import { SortableItem } from './SortableItem';

export function SystemPagesEditor() {
  const { toast } = useToast();
  
  // Fetch content for all system page sections
  const { data: safetyItems, isLoading: loadingSafety } = useSiteContent('riderDashboard.safety');
  const { data: dashboardSteps, isLoading: loadingSteps } = useSiteContent('riderDashboard.steps');
  const { data: dashboardMessages, isLoading: loadingMessages } = useSiteContent('riderDashboard.messages');
  const { data: guestUI, isLoading: loadingGuestUI } = useSiteContent('guestArea.ui');

  const createContent = useCreateSiteContent();
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const isLoading = loadingSafety || loadingSteps || loadingMessages || loadingGuestUI;

  const handleAddSafetyItem = async () => {
    const maxOrder = Math.max(...(safetyItems?.map(i => i.sortOrder) || [0]), 0);
    try {
      await createContent.mutateAsync({
        section: 'riderDashboard.safety',
        contentKey: `safety.${Date.now()}`,
        valueHe: 'פריט בטיחות חדש',
        valueEn: 'New safety item',
        contentType: 'safetyItem',
        sortOrder: maxOrder + 1,
        isActive: true,
        metadata: { icon: 'Shield' },
      });
      toast({ title: 'פריט בטיחות נוסף!' });
    } catch {
      toast({ title: 'שגיאה ביצירת פריט', variant: 'destructive' });
    }
  };

  const handleAddMessage = async () => {
    const maxOrder = Math.max(...(dashboardMessages?.map(i => i.sortOrder) || [0]), 0);
    try {
      await createContent.mutateAsync({
        section: 'riderDashboard.messages',
        contentKey: `message.${Date.now()}`,
        valueHe: 'הודעה חדשה',
        valueEn: 'New message',
        contentType: 'message',
        sortOrder: maxOrder + 1,
        isActive: true,
        metadata: { messageKey: 'new_message' },
      });
      toast({ title: 'הודעה נוספה!' });
    } catch {
      toast({ title: 'שגיאה ביצירת הודעה', variant: 'destructive' });
    }
  };

  const handleAddGuestUIItem = async () => {
    const maxOrder = Math.max(...(guestUI?.map(i => i.sortOrder) || [0]), 0);
    try {
      await createContent.mutateAsync({
        section: 'guestArea.ui',
        contentKey: `ui.${Date.now()}`,
        valueHe: 'טקסט חדש',
        valueEn: 'New text',
        contentType: 'uiText',
        sortOrder: maxOrder + 1,
        isActive: true,
        metadata: { uiKey: 'new_text' },
      });
      toast({ title: 'טקסט נוסף!' });
    } catch {
      toast({ title: 'שגיאה ביצירת טקסט', variant: 'destructive' });
    }
  };

  const handleReorder = async (items: SiteContent[]) => {
    try {
      await Promise.all(
        items.map((item, index) =>
          updateContent.mutateAsync({
            id: item.id,
            updates: { sortOrder: index + 1 },
          })
        )
      );
    } catch {
      toast({ title: 'שגיאה בעדכון הסדר', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="safety" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="safety" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">בטיחות</span>
        </TabsTrigger>
        <TabsTrigger value="steps" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span className="hidden sm:inline">שלבים</span>
        </TabsTrigger>
        <TabsTrigger value="messages" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">הודעות</span>
        </TabsTrigger>
        <TabsTrigger value="guest" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">אזור אורחים</span>
        </TabsTrigger>
      </TabsList>

      {/* Safety Items Tab */}
      <TabsContent value="safety">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              פריטי תדריך בטיחות
            </CardTitle>
            <Button size="sm" onClick={handleAddSafetyItem}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף פריט
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              הסעיפים שהרוכב צריך לאשר לפני קבלת קודי המנעול.
            </p>
            {safetyItems && safetyItems.length > 0 ? (
              <SortableContainer items={safetyItems} onReorder={handleReorder}>
                <div className="space-y-3">
                  {safetyItems.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                      <SafetyItemCard content={item} />
                    </SortableItem>
                  ))}
                </div>
              </SortableContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                אין פריטי בטיחות. לחץ על "הוסף פריט" להוספה.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Steps Tab */}
      <TabsContent value="steps">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              שלבי לוח הרוכב
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              כותרות ותיאורים לכל שלב בלוח הרוכב. השלבים קבועים ולא ניתן להוסיף/למחוק.
            </p>
            <div className="space-y-3">
              {['תדריך בטיחות', 'קודים', 'אישור מצב', 'החזרה', 'תודה'].map((stepName, index) => {
                const step = dashboardSteps?.find(s => s.metadata?.stepIndex === index);
                return (
                  <StepCard 
                    key={index} 
                    stepIndex={index} 
                    stepName={stepName} 
                    content={step} 
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Messages Tab */}
      <TabsContent value="messages">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              הודעות מערכת
            </CardTitle>
            <Button size="sm" onClick={handleAddMessage}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף הודעה
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              הודעות toast והודעות מערכת שונות בלוח הרוכב.
            </p>
            {dashboardMessages && dashboardMessages.length > 0 ? (
              <SortableContainer items={dashboardMessages} onReorder={handleReorder}>
                <div className="space-y-3">
                  {dashboardMessages.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                      <MessageCard content={item} />
                    </SortableItem>
                  ))}
                </div>
              </SortableContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                אין הודעות מערכת. לחץ על "הוסף הודעה" להוספה.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Guest UI Tab */}
      <TabsContent value="guest">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              טקסטים באזור האורחים
            </CardTitle>
            <Button size="sm" onClick={handleAddGuestUIItem}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף טקסט
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              כותרות, תוויות והודעות בעמוד אזור האורחים.
            </p>
            {guestUI && guestUI.length > 0 ? (
              <SortableContainer items={guestUI} onReorder={handleReorder}>
                <div className="space-y-3">
                  {guestUI.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                      <UITextCard content={item} />
                    </SortableItem>
                  ))}
                </div>
              </SortableContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                אין טקסטים. לחץ על "הוסף טקסט" להוספה.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Sub-components for each card type

function SafetyItemCard({ content, dragListeners }: { content: SiteContent; dragListeners?: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [textHe, setTextHe] = useState(content.valueHe || '');
  const [icon, setIcon] = useState(content.metadata?.icon || 'Shield');
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const IconComponent = iconComponents[icon] || Shield;

  const handleSave = () => {
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: textHe,
        valueEn: textHe,
        metadata: { ...content.metadata, icon },
      },
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="border-primary p-4">
        <div className="space-y-3">
          <div className="flex gap-3">
            <IconPicker value={icon} onChange={setIcon} />
            <Input
              value={textHe}
              onChange={(e) => setTextHe(e.target.value)}
              className="flex-1"
              dir="rtl"
              placeholder="טקסט הסעיף"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 ml-1" /> ביטול
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 ml-1" /> שמור
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group relative p-4 ${!content.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div {...dragListeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <IconComponent className="h-4 w-4 text-primary" />
        </div>
        <span className="flex-1 font-medium">{content.valueHe}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch
            checked={content.isActive}
            onCheckedChange={(checked) => updateContent.mutate({ id: content.id, updates: { isActive: checked } })}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContent.mutate(content.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StepCard({ stepIndex, stepName, content }: { stepIndex: number; stepName: string; content?: SiteContent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleHe, setTitleHe] = useState(content?.valueHe || stepName);
  const [descHe, setDescHe] = useState(content?.metadata?.descriptionHe || '');
  const updateContent = useUpdateSiteContent();
  const createContent = useCreateSiteContent();

  const handleSave = async () => {
    if (content) {
      updateContent.mutate({
        id: content.id,
        updates: {
          valueHe: titleHe,
          valueEn: titleHe,
          metadata: { ...content.metadata, descriptionHe: descHe, descriptionEn: descHe },
        },
      });
    } else {
      await createContent.mutateAsync({
        section: 'riderDashboard.steps',
        contentKey: `step.${stepIndex}`,
        valueHe: titleHe,
        valueEn: titleHe,
        contentType: 'step',
        sortOrder: stepIndex,
        isActive: true,
        metadata: { stepIndex, descriptionHe: descHe, descriptionEn: descHe },
      });
    }
    setIsEditing(false);
  };

  const stepIcons = [Shield, Bike, CheckCircle, Bike, AlertTriangle];
  const IconComponent = stepIcons[stepIndex] || CheckCircle;

  if (isEditing) {
    return (
      <Card className="border-primary p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <IconComponent className="h-5 w-5" />
            <span className="text-sm">שלב {stepIndex + 1}</span>
          </div>
          <Input
            value={titleHe}
            onChange={(e) => setTitleHe(e.target.value)}
            dir="rtl"
            placeholder="כותרת השלב"
          />
          <Textarea
            value={descHe}
            onChange={(e) => setDescHe(e.target.value)}
            dir="rtl"
            placeholder="תיאור השלב (אופציונלי)"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 ml-1" /> ביטול
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 ml-1" /> שמור
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group relative p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
          {stepIndex + 1}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{content?.valueHe || stepName}</h4>
          {(content?.metadata?.descriptionHe || descHe) && (
            <p className="text-sm text-muted-foreground">{content?.metadata?.descriptionHe}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function MessageCard({ content, dragListeners }: { content: SiteContent; dragListeners?: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [messageKey, setMessageKey] = useState(content.metadata?.messageKey || '');
  const [textHe, setTextHe] = useState(content.valueHe || '');
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const handleSave = () => {
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: textHe,
        valueEn: textHe,
        metadata: { ...content.metadata, messageKey },
      },
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="border-primary p-4">
        <div className="space-y-3">
          <Input
            value={messageKey}
            onChange={(e) => setMessageKey(e.target.value)}
            placeholder="מפתח ההודעה (למתכנתים)"
            dir="ltr"
          />
          <Textarea
            value={textHe}
            onChange={(e) => setTextHe(e.target.value)}
            dir="rtl"
            placeholder="טקסט ההודעה"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 ml-1" /> ביטול
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 ml-1" /> שמור
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group relative p-4 ${!content.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div {...dragListeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <code className="text-xs text-muted-foreground">{content.metadata?.messageKey}</code>
          <p className="font-medium">{content.valueHe}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch
            checked={content.isActive}
            onCheckedChange={(checked) => updateContent.mutate({ id: content.id, updates: { isActive: checked } })}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContent.mutate(content.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function UITextCard({ content, dragListeners }: { content: SiteContent; dragListeners?: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [uiKey, setUiKey] = useState(content.metadata?.uiKey || '');
  const [textHe, setTextHe] = useState(content.valueHe || '');
  const updateContent = useUpdateSiteContent();
  const deleteContent = useDeleteSiteContent();

  const handleSave = () => {
    updateContent.mutate({
      id: content.id,
      updates: {
        valueHe: textHe,
        valueEn: textHe,
        metadata: { ...content.metadata, uiKey },
      },
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="border-primary p-4">
        <div className="space-y-3">
          <Input
            value={uiKey}
            onChange={(e) => setUiKey(e.target.value)}
            placeholder="מזהה הטקסט (למתכנתים)"
            dir="ltr"
          />
          <Textarea
            value={textHe}
            onChange={(e) => setTextHe(e.target.value)}
            dir="rtl"
            placeholder="הטקסט להצגה"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 ml-1" /> ביטול
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 ml-1" /> שמור
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group relative p-4 ${!content.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div {...dragListeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <code className="text-xs text-muted-foreground">{content.metadata?.uiKey}</code>
          <p className="font-medium">{content.valueHe}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch
            checked={content.isActive}
            onCheckedChange={(checked) => updateContent.mutate({ id: content.id, updates: { isActive: checked } })}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContent.mutate(content.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
