import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  useStaffUsers, 
  useCreateStaffUser, 
  useDeleteStaffUser, 
  useUpdateStaffRole,
  useSetStaffPassword,
  useUpdateStaffProfile
} from '@/hooks/useStaffManagement';
import { useAuditActions } from '@/hooks/useAuditLog';
import { 
  User, 
  Plus, 
  Trash2, 
  Lock, 
  Shield, 
  Wrench,
  Loader2,
  Edit,
  Save,
  X,
  Key,
  Phone
} from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Validation schemas
const usernameSchema = z.string().min(2, 'שם משתמש חייב להכיל לפחות 2 תווים');
const passwordSchema = z.string()
  .min(12, 'סיסמה חייבת להכיל לפחות 12 תווים')
  .regex(/[A-Z]/, 'סיסמה חייבת להכיל אות גדולה באנגלית')
  .regex(/[a-z]/, 'סיסמה חייבת להכיל אות קטנה באנגלית')
  .regex(/[0-9]/, 'סיסמה חייבת להכיל מספר')
  .regex(/[^A-Za-z0-9]/, 'סיסמה חייבת להכיל תו מיוחד');

export default function StaffManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const auditActions = useAuditActions();
  
  const { data: staffUsers = [], isLoading } = useStaffUsers();
  const createUserMutation = useCreateStaffUser();
  const deleteUserMutation = useDeleteStaffUser();
  const updateRoleMutation = useUpdateStaffRole();
  const setPasswordMutation = useSetStaffPassword();
  const updateProfileMutation = useUpdateStaffProfile();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'mechanic'>('mechanic');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Reset password dialog state
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordName, setResetPasswordName] = useState('');
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    const usernameResult = usernameSchema.safeParse(newUsername);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.issues[0].message;
    }

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.issues[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    try {
      const result = await createUserMutation.mutateAsync({
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      
      auditActions.logUserCreate(result?.user_id || newUsername, newRole);
      toast({ title: 'משתמש נוסף בהצלחה! ✅' });
      setNewUsername('');
      setNewPassword('');
      setNewRole('mechanic');
      setShowAddForm(false);
      setErrors({});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהוספת משתמש';
      toast({ 
        title: 'שגיאה', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${displayName}?`)) return;

    try {
      await deleteUserMutation.mutateAsync(userId);
      auditActions.logUserDelete(userId);
      toast({ title: 'משתמש נמחק בהצלחה ✅' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה במחיקת משתמש';
      toast({ 
        title: 'שגיאה', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'mechanic', oldRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      auditActions.logUserRoleChange(userId, oldRole, newRole);
      toast({ title: 'תפקיד עודכן בהצלחה ✅' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון תפקיד';
      toast({ 
        title: 'שגיאה', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  };

  const startEditing = (userId: string, displayName: string, phone: string | null) => {
    setEditingUserId(userId);
    setEditDisplayName(displayName);
    setEditPhone(phone || '');
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditDisplayName('');
    setEditPhone('');
  };

  const handleSaveProfile = async (userId: string) => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        displayName: editDisplayName,
        phone: editPhone
      });
      toast({ title: 'פרטי משתמש עודכנו בהצלחה ✅' });
      cancelEditing();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון פרטים';
      toast({ 
        title: 'שגיאה', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  };

  const openResetPasswordDialog = (userId: string, displayName: string) => {
    setResetPasswordUserId(userId);
    setResetPasswordName(displayName);
    setNewPasswordForReset('');
    setResetPasswordError('');
  };

  const handleResetPassword = async () => {
    const result = passwordSchema.safeParse(newPasswordForReset);
    if (!result.success) {
      setResetPasswordError(result.error.issues[0].message);
      return;
    }

    if (!resetPasswordUserId) return;

    try {
      await setPasswordMutation.mutateAsync({
        userId: resetPasswordUserId,
        newPassword: newPasswordForReset
      });
      toast({ title: 'סיסמה עודכנה בהצלחה ✅' });
      setResetPasswordUserId(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון סיסמה';
      toast({ 
        title: 'שגיאה', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">👥 ניהול צוות</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף משתמש
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="glass-card rounded-xl p-6 border-2 border-primary/20">
          <h3 className="font-bold mb-4">➕ הוספת משתמש חדש</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                שם משתמש
              </Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
                placeholder="12+ תווים, אות גדולה, קטנה, מספר, תו מיוחד"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <Label>תפקיד</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'mechanic')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanic">🔧 מכונאי</SelectItem>
                  <SelectItem value="admin">🛡️ מנהל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleAddUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'מוסיף...' : '✅ הוסף משתמש'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setErrors({});
              }}
            >
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-bold mb-4">📋 רשימת צוות ({staffUsers.length})</h3>
        
        {staffUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            אין משתמשים במערכת
          </p>
        ) : (
          <div className="space-y-3">
            {staffUsers.map((staffUser) => {
              const isCurrentUser = user?.id === staffUser.user_id;
              const isEditing = editingUserId === staffUser.user_id;
              
              return (
                <div 
                  key={staffUser.user_id} 
                  className={`p-4 rounded-lg ${
                    isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            שם תצוגה
                          </Label>
                          <Input
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            טלפון
                          </Label>
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="mt-2"
                            placeholder="050-1234567"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleSaveProfile(staffUser.user_id)}
                          disabled={updateProfileMutation.isPending}
                          className="gap-1"
                        >
                          <Save className="w-4 h-4" />
                          {updateProfileMutation.isPending ? 'שומר...' : 'שמור'}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          <X className="w-4 h-4" />
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          staffUser.role === 'admin' ? 'bg-primary/20' : 'bg-accent/20'
                        }`}>
                          {staffUser.role === 'admin' ? (
                            <Shield className="w-5 h-5 text-primary" />
                          ) : (
                            <Wrench className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {staffUser.display_name}
                            {isCurrentUser && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                אתה
                              </span>
                            )}
                          </div>
                          {staffUser.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {staffUser.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                        {!isCurrentUser ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(staffUser.user_id, staffUser.display_name, staffUser.phone)}
                              className="gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              ערוך
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResetPasswordDialog(staffUser.user_id, staffUser.display_name)}
                              className="gap-1"
                            >
                              <Key className="w-4 h-4" />
                              איפוס סיסמה
                            </Button>
                            
                            <Select 
                              value={staffUser.role} 
                              onValueChange={(v) => handleUpdateRole(staffUser.user_id, v as 'admin' | 'mechanic', staffUser.role)}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mechanic">🔧 מכונאי</SelectItem>
                                <SelectItem value="admin">🛡️ מנהל</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteUser(staffUser.user_id, staffUser.display_name)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {staffUser.role === 'admin' ? '🛡️ מנהל' : '🔧 מכונאי'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">💡 מידע:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>מנהלים יכולים לגשת לכל חלקי לוח הבקרה</li>
          <li>מכונאים יכולים לגשת רק לטאב המכונאי והמלאי</li>
          <li>לא ניתן למחוק או לשנות את התפקיד של עצמך</li>
          <li>ניתן לערוך שם ומספר טלפון של משתמשים</li>
          <li>ניתן לאפס סיסמה למשתמשים (הסיסמה אינה נראית מטעמי אבטחה)</li>
        </ul>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordUserId !== null} onOpenChange={(open) => !open && setResetPasswordUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              איפוס סיסמה
            </DialogTitle>
            <DialogDescription>
              הגדרת סיסמה חדשה עבור {resetPasswordName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>סיסמה חדשה</Label>
              <Input
                type="password"
                value={newPasswordForReset}
                onChange={(e) => {
                  setNewPasswordForReset(e.target.value);
                  setResetPasswordError('');
                }}
                placeholder="לפחות 6 תווים"
                className="mt-2"
              />
              {resetPasswordError && (
                <p className="text-destructive text-sm mt-1">{resetPasswordError}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleResetPassword}
                disabled={setPasswordMutation.isPending}
                className="gap-1"
              >
                <Save className="w-4 h-4" />
                {setPasswordMutation.isPending ? 'שומר...' : 'שמור סיסמה'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setResetPasswordUserId(null)}
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}