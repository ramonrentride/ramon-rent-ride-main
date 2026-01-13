import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSiteContent, useCreateSiteContent, useUpdateSiteContent, SiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Bike, PawPrint, Lightbulb, Wrench, Link2, Mountain, Plus, Download, Upload, Settings } from 'lucide-react';
import { FeatureCardEditor } from './editors/FeatureCardEditor';
import { AnimalCardEditor } from './editors/AnimalCardEditor';
import { TipCardEditor } from './editors/TipCardEditor';
import { QuickLinkEditor } from './editors/QuickLinkEditor';
import { TrailCardEditor } from './editors/TrailCardEditor';
import { SystemPagesEditor } from './editors/SystemPagesEditor';
import { SortableContainer } from './editors/SortableContainer';
import { SortableItem } from './editors/SortableItem';
import { useToast } from '@/hooks/use-toast';

export function VisualContentEditor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentEditor = searchParams.get('editor') || 'features';
  const { toast } = useToast();
  const { data: features, isLoading: loadingFeatures } = useSiteContent('homepage.features');
  const { data: animals, isLoading: loadingAnimals } = useSiteContent('homepage.nature');
  const { data: tips, isLoading: loadingTips } = useSiteContent('riderGuide.tips');
  const { data: repairs, isLoading: loadingRepairs } = useSiteContent('riderGuide.repairs');
  const { data: links, isLoading: loadingLinks } = useSiteContent('guestArea');
  const { data: trails, isLoading: loadingTrails } = useSiteContent('trails');

  const createContent = useCreateSiteContent();
  const updateContent = useUpdateSiteContent();

  const isLoading = loadingFeatures || loadingAnimals || loadingTips || loadingRepairs || loadingLinks || loadingTrails;

  const handleAddNew = async (section: string, contentType: string, defaultMetadata: Record<string, any> = {}) => {
    const items = section === 'homepage.features' ? features :
                  section === 'homepage.nature' ? animals :
                  section === 'riderGuide.tips' ? tips :
                  section === 'riderGuide.repairs' ? repairs :
                  section === 'guestArea' ? links :
                  section === 'trails' ? trails : [];
    
    const maxOrder = Math.max(...(items?.map(i => i.sortOrder) || [0]), 0);

    try {
      await createContent.mutateAsync({
        section,
        contentKey: `${contentType}.${Date.now()}`,
        valueHe: 'פריט חדש',
        valueEn: 'New Item',
        contentType,
        sortOrder: maxOrder + 1,
        isActive: true,
        metadata: defaultMetadata,
      });
      toast({ title: 'פריט חדש נוצר בהצלחה!' });
    } catch (error) {
      toast({ title: 'שגיאה ביצירת פריט', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (item: SiteContent) => {
    const items = item.section === 'homepage.features' ? features :
                  item.section === 'homepage.nature' ? animals :
                  item.section === 'riderGuide.tips' ? tips :
                  item.section === 'riderGuide.repairs' ? repairs :
                  item.section === 'guestArea' ? links :
                  item.section === 'trails' ? trails : [];
    
    const maxOrder = Math.max(...(items?.map(i => i.sortOrder) || [0]), 0);

    try {
      await createContent.mutateAsync({
        section: item.section,
        contentKey: `${item.contentKey}.copy.${Date.now()}`,
        valueHe: `${item.valueHe} (העתק)`,
        valueEn: `${item.valueEn} (Copy)`,
        contentType: item.contentType,
        sortOrder: maxOrder + 1,
        isActive: item.isActive,
        metadata: { ...item.metadata },
      });
      toast({ title: 'הפריט שוכפל בהצלחה!' });
    } catch (error) {
      toast({ title: 'שגיאה בשכפול', variant: 'destructive' });
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
    } catch (error) {
      toast({ title: 'שגיאה בעדכון הסדר', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const allContent = {
      features: features || [],
      animals: animals || [],
      tips: tips || [],
      repairs: repairs || [],
      links: links || [],
      trails: trails || [],
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(allContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cms-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'הייצוא הושלם בהצלחה!' });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        toast({ 
          title: 'קובץ נקרא בהצלחה',
          description: `נמצאו ${Object.values(data).flat().length - 1} פריטים. יש לייבא ידנית.`
        });
      } catch (error) {
        toast({ title: 'שגיאה בקריאת הקובץ', variant: 'destructive' });
      }
    };
    input.click();
  };

  const handleEditorChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('editor', value);
    setSearchParams(params, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export/Import buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 ml-2" />
          ייצוא JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 ml-2" />
          ייבוא JSON
        </Button>
      </div>

      <Tabs value={currentEditor} onValueChange={handleEditorChange} className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Bike className="h-4 w-4" />
            <span className="hidden sm:inline">יתרונות</span>
          </TabsTrigger>
          <TabsTrigger value="animals" className="flex items-center gap-2">
            <PawPrint className="h-4 w-4" />
            <span className="hidden sm:inline">חיות</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">טיפים</span>
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">תקלות</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">קישורים</span>
          </TabsTrigger>
          <TabsTrigger value="trails" className="flex items-center gap-2">
            <Mountain className="h-4 w-4" />
            <span className="hidden sm:inline">מסלולים</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">דפי מערכת</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5" />
                למה לבחור בנו? (Why Choose Us)
              </CardTitle>
              <Button size="sm" onClick={() => handleAddNew('homepage.features', 'feature', { icon: 'Bike', descriptionHe: 'תיאור', descriptionEn: 'Description' })}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף יתרון
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                שלושת היתרונות המוצגים בדף הבית. לחצו על כרטיס לעריכה. גררו לשינוי סדר.
              </p>
              {features && features.length > 0 ? (
                <SortableContainer items={features} onReorder={handleReorder}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature) => (
                      <SortableItem key={feature.id} id={feature.id}>
                        <FeatureCardEditor content={feature} onDuplicate={handleDuplicate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">אין יתרונות. לחצו על "הוסף יתרון" להוספה.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                פגישה עם הטבע (Nature Meeting)
              </CardTitle>
              <Button size="sm" onClick={() => handleAddNew('homepage.nature', 'animal', { descriptionHe: 'תיאור', descriptionEn: 'Description' })}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף חיה
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                החיות המוצגות בסקשן הטבע בדף הבית. לחצו על כרטיס לעריכה. גררו לשינוי סדר.
              </p>
              {animals && animals.length > 0 ? (
                <SortableContainer items={animals} onReorder={handleReorder}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {animals.map((animal) => (
                      <SortableItem key={animal.id} id={animal.id}>
                        <AnimalCardEditor content={animal} onDuplicate={handleDuplicate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">אין חיות. לחצו על "הוסף חיה" להוספה.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                טיפים לרכיבה (Riding Tips)
              </CardTitle>
              <Button size="sm" onClick={() => handleAddNew('riderGuide.tips', 'tip', { icon: 'Lightbulb', descriptionHe: 'תיאור', descriptionEn: 'Description' })}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף טיפ
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                טיפים לרוכבים המוצגים במדריך הרוכבים. לחצו על טיפ לעריכה. גררו לשינוי סדר.
              </p>
              {tips && tips.length > 0 ? (
                <SortableContainer items={tips} onReorder={handleReorder}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tips.map((tip) => (
                      <SortableItem key={tip.id} id={tip.id}>
                        <TipCardEditor content={tip} type="tip" onDuplicate={handleDuplicate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">אין טיפים. לחצו על "הוסף טיפ" להוספה.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repairs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                בעיות ותקלות נפוצות (Common Issues)
              </CardTitle>
              <Button size="sm" onClick={() => handleAddNew('riderGuide.repairs', 'repair', { icon: 'AlertTriangle', solutionHe: 'פתרון', solutionEn: 'Solution' })}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף תקלה
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                בעיות נפוצות ופתרונות המוצגים במדריך הרוכבים. לחצו לעריכה. גררו לשינוי סדר.
              </p>
              {repairs && repairs.length > 0 ? (
                <SortableContainer items={repairs} onReorder={handleReorder}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {repairs.map((repair) => (
                      <SortableItem key={repair.id} id={repair.id}>
                        <TipCardEditor content={repair} type="repair" onDuplicate={handleDuplicate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">אין תקלות. לחצו על "הוסף תקלה" להוספה.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                קישורים מהירים (Quick Links)
              </CardTitle>
              <Button size="sm" onClick={() => handleAddNew('guestArea', 'link', { icon: 'Link', descriptionHe: 'תיאור', descriptionEn: 'Description', href: '/' })}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף קישור
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                קישורים מהירים באזור האורחים. לחצו על קישור לעריכה. גררו לשינוי סדר.
              </p>
              {links && links.length > 0 ? (
                <SortableContainer items={links} onReorder={handleReorder}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {links.map((link) => (
                      <SortableItem key={link.id} id={link.id}>
                        <QuickLinkEditor content={link} onDuplicate={handleDuplicate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">אין קישורים. לחצו על "הוסף קישור" להוספה.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trails">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mountain className="h-5 w-5" />
                מסלולי רכיבה (Recommended Trails)
              </CardTitle>
              <Button size="sm" onClick={() => handleAddNew('trails', 'trail', { 
                descriptionHe: 'תיאור המסלול', 
                descriptionEn: 'Trail description',
                difficulty: 'moderate',
                duration: '2-3',
                distance: '10',
                googleMapsUrl: 'https://www.google.com/maps',
              })}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף מסלול
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                מסלולי הרכיבה המומלצים המוצגים באתר. לחצו על מסלול לעריכה. גררו לשינוי סדר.
              </p>
              {trails && trails.length > 0 ? (
                <SortableContainer items={trails} onReorder={handleReorder}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trails.map((trail) => (
                      <SortableItem key={trail.id} id={trail.id}>
                        <TrailCardEditor content={trail} onDuplicate={handleDuplicate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">אין מסלולים. לחצו על "הוסף מסלול" להוספה.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Pages Tab */}
        <TabsContent value="system">
          <SystemPagesEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
