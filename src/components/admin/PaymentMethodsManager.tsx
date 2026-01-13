import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAllPaymentMethods, useUpdatePaymentMethod, useCreatePaymentMethod, useDeletePaymentMethod } from '@/hooks/usePaymentMethods';
import { CreditCard, Smartphone, Banknote, Loader2, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function PaymentMethodsManager() {
  const { data: methods, isLoading } = useAllPaymentMethods();
  const updateMutation = useUpdatePaymentMethod();
  const createMutation = useCreatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ nameHe: string; icon: string }>({
    nameHe: '',
    icon: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethod, setNewMethod] = useState({ nameHe: '', icon: '', methodKey: '' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const getIcon = (methodKey: string) => {
    switch (methodKey) {
      case 'credit_card': return <CreditCard className="w-5 h-5" />;
      case 'bit': return <Smartphone className="w-5 h-5" />;
      case 'cash': return <Banknote className="w-5 h-5" />;
      default: return null;
    }
  };

  const startEditing = (method: any) => {
    setEditingId(method.id);
    setEditValues({
      nameHe: method.nameHe,
      icon: method.icon || '',
    });
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({
      id,
      updates: {
        nameHe: editValues.nameHe,
        icon: editValues.icon || null,
      },
    });
    setEditingId(null);
  };

  const handleAddMethod = () => {
    if (!newMethod.nameHe || !newMethod.methodKey) return;
    createMutation.mutate({
      methodKey: newMethod.methodKey,
      nameHe: newMethod.nameHe,
      nameEn: newMethod.nameHe, // Use Hebrew as default
      isEnabled: true,
      sortOrder: (methods?.length || 0) + 1,
      icon: newMethod.icon || null,
    });
    setNewMethod({ nameHe: '', icon: '', methodKey: '' });
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם למחוק אמצעי תשלום זה?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          💳 אמצעי תשלום
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף אמצעי תשלום
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        הפעל או השבת אמצעי תשלום. רק אמצעים פעילים יוצגו בדף ההזמנות.
      </p>

      {/* Add New Method Form */}
      {showAddForm && (
        <div className="p-4 border border-primary/30 rounded-xl bg-primary/5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">מפתח (באנגלית)</Label>
              <Input
                value={newMethod.methodKey}
                onChange={(e) => setNewMethod({ ...newMethod, methodKey: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="paypal"
                className="h-9"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-xs">שם</Label>
              <Input
                value={newMethod.nameHe}
                onChange={(e) => setNewMethod({ ...newMethod, nameHe: e.target.value })}
                placeholder="פייפאל"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">אייקון (אימוג'י)</Label>
              <Input
                value={newMethod.icon}
                onChange={(e) => setNewMethod({ ...newMethod, icon: e.target.value })}
                placeholder="💰"
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddMethod} className="gap-1">
              <Save className="w-3 h-3" />
              הוסף
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
              ביטול
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {methods?.map((method) => (
          <div key={method.id} className="flex items-center justify-between p-4 border rounded-xl">
            {editingId === method.id ? (
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">שם</Label>
                    <Input
                      value={editValues.nameHe}
                      onChange={(e) => setEditValues({ ...editValues, nameHe: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">אייקון (אימוג'י)</Label>
                    <Input
                      value={editValues.icon}
                      onChange={(e) => setEditValues({ ...editValues, icon: e.target.value })}
                      className="h-8"
                      placeholder="💳"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(method.id)} className="gap-1">
                    <Save className="w-3 h-3" />
                    שמור
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{method.icon || getIcon(method.methodKey)}</span>
                  <div>
                    <Label className="text-base font-medium">{method.nameHe}</Label>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" onClick={() => startEditing(method)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(method.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={method.isEnabled}
                    onCheckedChange={(checked) => {
                      updateMutation.mutate({
                        id: method.id,
                        updates: { isEnabled: checked },
                      });
                    }}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 טיפ: השינויים נשמרים אוטומטית ומשתקפים מיידית באתר.
      </div>
    </div>
  );
}
