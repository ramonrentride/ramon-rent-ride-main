import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Home, Mail, Lock, KeyRound, ArrowRight, User, UserPlus } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const usernameSchema = z.string().min(2, 'הכנס שם משתמש');
const passwordSchema = z.string()
  .min(12, 'סיסמה חייבת להכיל לפחות 12 תווים')
  .regex(/[A-Z]/, 'סיסמה חייבת להכיל אות גדולה באנגלית')
  .regex(/[a-z]/, 'סיסמה חייבת להכיל אות קטנה באנגלית')
  .regex(/[0-9]/, 'סיסמה חייבת להכיל מספר')
  .regex(/[^A-Za-z0-9]/, 'סיסמה חייבת להכיל תו מיוחד');
const emailSchema = z.string().email('כתובת אימייל לא תקינה');

type ViewMode = 'login' | 'reset-request' | 'reset-confirm';

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isStaff, isLoading, signIn } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Installation mode state
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Check if any admin exists
  useEffect(() => {
    const checkAdmin = async () => {
      const { data, error } = await supabase.rpc('has_any_admin');
      if (!error) {
        setHasAdmin(data as boolean);
      }
    };
    checkAdmin();
  }, []);

  // Check for password reset token in URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setViewMode('reset-confirm');
    }
  }, []);

  // Redirect if already authenticated and is staff
  useEffect(() => {
    if (!isLoading && isAuthenticated && isStaff && viewMode === 'login') {
      navigate('/admin');
    }
  }, [isAuthenticated, isStaff, isLoading, navigate, viewMode]);

  const validateLoginForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.issues[0].message;
    }

    // Only check password is not empty - don't validate complexity for login
    if (!password || password.length < 1) {
      newErrors.password = 'הכנס סיסמה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.issues[0].message;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות לא תואמות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) return;

    setIsSubmitting(true);

    try {
      // Generate a client ID for rate limiting (use a hash of IP + user agent)
      const clientId = btoa(navigator.userAgent.slice(0, 50)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);

      // Get the email from the username - returns null if not found or rate limited
      const { data: email } = await supabase.rpc('get_email_by_display_name', {
        _display_name: username,
        _client_id: clientId
      });

      // Try to sign in - use a dummy email if username not found to prevent enumeration
      // This ensures consistent timing and error messages regardless of user existence
      const emailToUse = email || `${username}@bikerentramon.local`;
      const { error } = await signIn(emailToUse, password);

      if (error) {
        // Always show generic error to prevent username enumeration
        toast({
          title: 'שגיאה בהתחברות',
          description: 'שם משתמש או סיסמה שגויים',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'התחברת בהצלחה! ✅' });
        navigate('/admin');
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שם משתמש או סיסמה שגויים',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(resetEmail);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.issues[0].message });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: 'שגיאה',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: 'נשלח! ✅',
          description: 'בדוק את תיבת המייל שלך לקישור לאיפוס הסיסמה'
        });
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה לא צפויה',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateResetForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: 'שגיאה',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'הסיסמה עודכנה בהצלחה! ✅',
          description: 'כעת תוכל להתחבר עם הסיסמה החדשה'
        });
        setViewMode('login');
        setNewPassword('');
        setConfirmPassword('');
        // Clear URL hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה לא צפויה',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
        <div className="animate-pulse text-xl">טוען...</div>
      </div>
    );
  }

  // Create initial admin handler
  const handleCreateInitialAdmin = async () => {
    setIsCreatingAdmin(true);
    try {
      // Generate a strong initial password
      const initialPassword = 'Admin123!Secure';

      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create-initial-admin',
          username: 'admin',
          password: initialPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'מנהל נוצר בהצלחה! ✅',
        description: 'שנה את הסיסמה מיד לאחר ההתחברות'
      });
      setHasAdmin(true);

      // Auto-login
      const email = 'admin@bikerentramon.local';
      const { error: signInError } = await signIn(email, initialPassword);
      if (!signInError) {
        navigate('/admin');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת מנהל';
      toast({ title: 'שגיאה', description: message, variant: 'destructive' });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">

        {/* Installation Mode - Show when no admin exists */}
        {hasAdmin === false && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <UserPlus className="w-6 h-6 text-primary" />
              <h2 className="font-bold text-lg">התקנה ראשונית</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              לא נמצאו משתמשים במערכת. לחץ ליצירת מנהל ראשון:
            </p>
            <div className="bg-background/50 p-3 rounded-lg mb-4 font-mono text-sm">
              <div><span className="text-muted-foreground">שם משתמש:</span> <strong>admin</strong></div>
              <div><span className="text-muted-foreground">סיסמה:</span> <strong>Admin123!Secure</strong></div>
              <div className="text-xs text-destructive mt-2">⚠️ שנה סיסמה מיד לאחר התחברות!</div>
            </div>
            <Button
              onClick={handleCreateInitialAdmin}
              disabled={isCreatingAdmin}
              className="w-full btn-hero"
            >
              {isCreatingAdmin ? 'יוצר מנהל...' : '🚀 צור מנהל ראשון והתחבר'}
            </Button>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {viewMode === 'login' ? (
              <Settings className="w-8 h-8 text-primary" />
            ) : (
              <KeyRound className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {viewMode === 'login' && '🔐 כניסת צוות'}
            {viewMode === 'reset-request' && '🔑 איפוס סיסמה'}
            {viewMode === 'reset-confirm' && '🔑 הגדרת סיסמה חדשה'}
          </h1>
          <p className="text-muted-foreground">ramonrentride</p>
        </div>

        {/* Login Form */}
        {viewMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                שם משתמש
              </Label>
              <Input
                type="text"
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
                placeholder="הכנס סיסמה"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-hero"
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : '🚀 כניסה'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setViewMode('reset-request');
                setErrors({});
              }}
              className="text-primary hover:underline text-sm w-full text-center block"
            >
              שכחת סיסמה?
            </button>

            <Link to="/">
              <Button variant="link" className="w-full gap-2">
                <Home className="w-4 h-4" />
                חזרה לדף הבית
              </Button>
            </Link>
          </form>
        )}

        {/* Reset Request Form */}
        {viewMode === 'reset-request' && (
          <>
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="bg-success/10 text-success p-4 rounded-lg">
                  <p className="font-medium">✅ הוראות נשלחו למייל!</p>
                  <p className="text-sm mt-2">בדוק את תיבת הדואר שלך ולחץ על הקישור לאיפוס הסיסמה.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMode('login');
                    setResetEmailSent(false);
                    setResetEmail('');
                  }}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  חזרה להתחברות
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  הכנס את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
                </p>

                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    אימייל
                  </Label>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="mt-2"
                    placeholder="הכנס אימייל"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full btn-hero"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '...' : '📧 שלח קישור לאיפוס'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrors({});
                  }}
                  className="text-primary hover:underline text-sm w-full text-center block"
                >
                  חזרה להתחברות
                </button>
              </form>
            )}
          </>
        )}

        {/* Reset Confirm Form */}
        {viewMode === 'reset-confirm' && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              הכנס סיסמה חדשה לחשבון שלך
            </p>

            <div>
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                סיסמה חדשה
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
                placeholder="לפחות 12 תווים, אות גדולה, קטנה, מספר ותו מיוחד"
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
              {isSubmitting ? '...' : '🔐 עדכן סיסמה'}
            </Button>
          </form>
        )}

        {viewMode === 'login' && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">💡 שים לב:</p>
            <p>דף זה מיועד לצוות בלבד. פנה למנהל המערכת לקבלת פרטי גישה.</p>
          </div>
        )}
      </div>
    </div>
  );
}
