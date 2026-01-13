import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, User, Home } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const usernameSchema = z.string().min(2, 'שם משתמש חייב להכיל לפחות 2 תווים').max(50, 'שם משתמש ארוך מדי');
const passwordSchema = z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים');

export default function SetupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; confirmPassword?: string }>({});

  // Check if admin already exists
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc('has_any_admin');

        if (error) {
          console.error('Error checking for admin:', error);
          toast({
            title: 'שגיאה',
            description: 'לא ניתן לבדוק את מצב המערכת',
            variant: 'destructive'
          });
          return;
        }

        setAdminExists(!!data);

        if (data) {
          // Admin exists, redirect to login
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string; confirmPassword?: string } = {};

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.issues[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.issues[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות לא תואמות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create-initial-admin',
          username,
          password
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'שגיאה ביצירת המנהל');
      }

      if (response.data?.error) {
        if (response.data.error.includes('Admin already exists')) {
          toast({
            title: 'מנהל כבר קיים',
            description: 'עבור לדף ההתחברות',
            variant: 'destructive'
          });
          navigate('/auth');
          return;
        }
        throw new Error(response.data.error);
      }

      toast({
        title: 'מנהל נוצר בהצלחה! ✅',
        description: 'כעת תוכל להתחבר עם הפרטים שהזנת'
      });

      navigate('/auth');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה';
      toast({
        title: 'שגיאה ביצירת מנהל',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
        <div className="animate-pulse text-xl">בודק מצב מערכת...</div>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">המערכת כבר הוגדרה</h1>
          <p className="text-muted-foreground mb-6">
            מנהל המערכת כבר נוצר. עבור לדף ההתחברות.
          </p>
          <Link to="/auth">
            <Button className="w-full">עבור להתחברות</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">🛡️ הגדרת מנהל ראשי</h1>
          <p className="text-muted-foreground">ramonrentride - הגדרה ראשונית</p>
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-center">
            זהו דף חד-פעמי ליצירת המנהל הראשון במערכת.
            <br />
            לאחר יצירת המנהל, דף זה לא יהיה נגיש יותר.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              שם משתמש
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2"
              placeholder="הכנס שם משתמש"
            />
            {errors.username && (
              <p className="text-destructive text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              סיסמה
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
              placeholder="הכנס סיסמה (לפחות 6 תווים)"
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              אימות סיסמה
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
              placeholder="הכנס סיסמה שנית"
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-hero"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'יוצר מנהל...' : '🛡️ צור מנהל ראשי'}
          </Button>

          <Link to="/">
            <Button variant="link" className="w-full gap-2">
              <Home className="w-4 h-4" />
              חזרה לדף הבית
            </Button>
          </Link>
        </form>
      </div>
    </div>
  );
}
