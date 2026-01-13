import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWaiverText = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get waiver text from site_content
  const { data: waiverData, isLoading } = useQuery({
    queryKey: ['waiver-text'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'legal')
        .eq('content_key', 'waiver_text')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Get waiver version
  const { data: versionData } = useQuery({
    queryKey: ['waiver-version'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'legal')
        .eq('content_key', 'waiver_version')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const waiverText = waiverData?.value_he || getDefaultWaiverText();
  const waiverVersion = versionData?.value_he || '1.0';

  // Update waiver text
  const updateWaiverText = useMutation({
    mutationFn: async (text: string) => {
      const newVersion = `${Date.now()}`;

      // Update or insert waiver text
      const { data: existing } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'legal')
        .eq('content_key', 'waiver_text')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_content')
          .update({ 
            value_he: text, 
            value_en: text, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({
            section: 'legal',
            content_key: 'waiver_text',
            value_he: text,
            value_en: text,
            content_type: 'text',
            is_active: true,
          });
        if (error) throw error;
      }

      // Update version
      const { data: existingVersion } = await supabase
        .from('site_content')
        .select('id')
        .eq('section', 'legal')
        .eq('content_key', 'waiver_version')
        .single();

      if (existingVersion) {
        await supabase
          .from('site_content')
          .update({ value_he: newVersion, value_en: newVersion })
          .eq('id', existingVersion.id);
      } else {
        await supabase
          .from('site_content')
          .insert({
            section: 'legal',
            content_key: 'waiver_version',
            value_he: newVersion,
            value_en: newVersion,
            content_type: 'setting',
            is_active: true,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiver-text'] });
      queryClient.invalidateQueries({ queryKey: ['waiver-version'] });
      toast({ title: 'טקסט הוויתור נשמר בהצלחה!' });
    },
    onError: () => {
      toast({ title: 'שגיאה בשמירת הטקסט', variant: 'destructive' });
    },
  });

  return {
    waiverText,
    waiverVersion,
    isLoading,
    updateWaiverText,
  };
};

function getDefaultWaiverText(): string {
  return `# תנאי שימוש והסרת אחריות

## 1. הצהרת בריאות
אני מצהיר/ה כי אני במצב בריאותי תקין המאפשר לי לרכב על אופניים. אני מודע/ת לכך שרכיבה על אופניים כרוכה במאמץ פיזי ואני נוטל/ת על עצמי את האחריות לבדוק את כשירותי הפיזית לפעילות זו.

## 2. הסרת אחריות
אני מבין/ה ומסכים/ה כי:
- רכיבה על אופניים כרוכה בסיכונים מסוימים
- אני נוטל/ת על עצמי את מלוא האחריות לכל נזק שייגרם לי או על ידי במהלך הרכיבה
- החברה אינה אחראית לנזקים או פציעות שייגרמו כתוצאה מרכיבה לא בטוחה

## 3. שימוש בציוד
אני מתחייב/ת:
- להשתמש בציוד בהתאם להנחיות
- לדווח מיידית על כל תקלה או נזק
- להחזיר את הציוד במצב תקין

## 4. כללי בטיחות
אני מתחייב/ת לעמוד בכללי הבטיחות הבאים:
- ללבוש קסדה בכל עת הרכיבה
- לא לרכב תחת השפעת אלכוהול או סמים
- לציית לחוקי התנועה`;
}
