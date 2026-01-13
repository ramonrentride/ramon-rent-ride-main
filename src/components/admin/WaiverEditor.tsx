import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWaiverText } from '@/hooks/useWaiverText';
import { Loader2, Save, FileText, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

export function WaiverEditor() {
  const { waiverText, waiverVersion, isLoading, updateWaiverText } = useWaiverText();
  const [editText, setEditText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (waiverText) {
      setEditText(waiverText);
    }
  }, [waiverText]);

  useEffect(() => {
    setHasChanges(editText !== waiverText);
  }, [editText, waiverText]);

  const handleSave = async () => {
    await updateWaiverText.mutateAsync(editText);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            עריכת טקסט הוויתור והתנאים
          </CardTitle>
          <CardDescription>
            טקסט זה יוצג למשתמשים לפני ההרשמה לרשימת המתנה. ניתן להשתמש ב-Markdown לעיצוב.
            <br />
            <span className="text-xs">גרסה נוכחית: {waiverVersion}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={showPreview ? 'outline' : 'default'}
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              עריכה
            </Button>
            <Button
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPreview(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </Button>
          </div>

          {showPreview ? (
            <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/30">
              <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl">
                <ReactMarkdown>{editText}</ReactMarkdown>
              </div>
            </ScrollArea>
          ) : (
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="הכנס את טקסט הוויתור כאן..."
              className="min-h-[400px] font-mono text-sm"
              dir="rtl"
            />
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hasChanges ? 'יש שינויים שלא נשמרו' : 'כל השינויים נשמרו'}
            </p>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateWaiverText.isPending}
              className="gap-2"
            >
              {updateWaiverText.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              שמור שינויים
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
