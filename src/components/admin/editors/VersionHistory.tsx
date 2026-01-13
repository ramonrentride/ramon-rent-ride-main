import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { History, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUpdateSiteContent } from '@/hooks/useSiteContent';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface VersionHistoryProps {
  contentId: string;
  currentValueHe?: string;
  currentValueEn?: string;
}

interface HistoryRecord {
  id: string;
  version_number: number;
  value_he: string | null;
  value_en: string | null;
  metadata: Record<string, any>;
  changed_by: string | null;
  changed_at: string;
  change_type: string;
}

export function VersionHistory({ contentId, currentValueHe, currentValueEn }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateContent = useUpdateSiteContent();

  const { data: history, isLoading } = useQuery({
    queryKey: ['contentHistory', contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content_history')
        .select('*')
        .eq('content_id', contentId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as HistoryRecord[];
    },
    enabled: open,
  });

  const restoreMutation = useMutation({
    mutationFn: async (version: HistoryRecord) => {
      // First, save current state to history
      await supabase.from('site_content_history').insert({
        content_id: contentId,
        version_number: (history?.[0]?.version_number || 0) + 1,
        value_he: currentValueHe,
        value_en: currentValueEn,
        change_type: 'restore',
        changed_by: 'admin',
      });

      // Then restore the old version
      const { error } = await supabase
        .from('site_content')
        .update({
          value_he: version.value_he,
          value_en: version.value_en,
          metadata: version.metadata,
        })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'הגרסה שוחזרה בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['allSiteContent'] });
      queryClient.invalidateQueries({ queryKey: ['contentHistory', contentId] });
      setOpen(false);
    },
    onError: (error) => {
      toast({ title: 'שגיאה בשחזור', description: String(error), variant: 'destructive' });
    },
  });

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'create': return 'יצירה';
      case 'update': return 'עדכון';
      case 'restore': return 'שחזור';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <History className="h-4 w-4" />
          היסטוריה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            היסטוריית גרסאות
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            אין היסטוריית גרסאות
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {history.map((version, index) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border ${index === 0 ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        גרסה {version.version_number}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {getChangeTypeLabel(version.change_type)}
                      </span>
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          נוכחי
                        </span>
                      )}
                    </div>
                    {index !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(version)}
                        disabled={restoreMutation.isPending}
                      >
                        {restoreMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-3 w-3 ml-1" />
                            שחזר
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {format(new Date(version.changed_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                  
                  <div className="space-y-1">
                    {version.value_he && (
                      <p className="text-sm truncate" dir="rtl">
                        <span className="text-muted-foreground">עברית: </span>
                        {version.value_he}
                      </p>
                    )}
                    {version.value_en && (
                      <p className="text-sm truncate" dir="ltr">
                        <span className="text-muted-foreground">English: </span>
                        {version.value_en}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
