import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminPicnicMenu,
  useAddPicnicMenuItem,
  useUpdatePicnicMenuItem,
  useDeletePicnicMenuItem,
} from '@/hooks/useSupabaseData';
import type { PicnicMenuItem } from '@/lib/types';
import { Plus, Edit, Trash2, ShoppingBag } from 'lucide-react';

const CATEGORIES = [
  { value: 'sandwich', label: 'כריך', icon: '🥪' },
  { value: 'salad', label: 'סלט', icon: '🥗' },
  { value: 'dessert', label: 'קינוח', icon: '🍎' },
  { value: 'drink', label: 'משקה', icon: '🥤' },
  { value: 'snack', label: 'חטיף', icon: '🍫' },
  { value: 'food', label: 'אוכל', icon: '🍽️' },
];

interface MenuItemFormData {
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  price: number;
  category: PicnicMenuItem['category'];
  sortOrder: number;
  isAvailable: boolean;
}

const emptyFormData: MenuItemFormData = {
  name: '',
  nameHe: '',
  description: '',
  descriptionHe: '',
  price: 0,
  category: 'food',
  sortOrder: 0,
  isAvailable: true,
};

export default function PicnicMenuManagement() {
  const { toast } = useToast();
  const { data: menuItems = [], isLoading } = useAdminPicnicMenu();
  const addItemMutation = useAddPicnicMenuItem();
  const updateItemMutation = useUpdatePicnicMenuItem();
  const deleteItemMutation = useDeletePicnicMenuItem();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PicnicMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(emptyFormData);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(emptyFormData);
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.nameHe || formData.price < 0) {
      toast({ title: 'שגיאה', description: 'יש למלא שם ומחיר תקין', variant: 'destructive' });
      return;
    }

    try {
      await addItemMutation.mutateAsync(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !formData.name || !formData.nameHe || formData.price < 0) {
      toast({ title: 'שגיאה', description: 'יש למלא שם ומחיר תקין', variant: 'destructive' });
      return;
    }

    try {
      await updateItemMutation.mutateAsync({
        id: editingItem.id,
        updates: formData,
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeletingItemId(id);
  };

  const confirmDelete = async () => {
    if (!deletingItemId) return;

    try {
      await deleteItemMutation.mutateAsync(deletingItemId);
      setDeletingItemId(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleToggleAvailability = async (item: PicnicMenuItem) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        updates: { isAvailable: !item.isAvailable },
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const openEditDialog = (item: PicnicMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nameHe: item.nameHe,
      description: item.description || '',
      descriptionHe: item.descriptionHe || '',
      price: item.price,
      category: item.category,
      sortOrder: item.sortOrder,
      isAvailable: item.isAvailable,
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.icon} ${cat.label}` : category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">טוען...</div>
      </div>
    );
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>שם בעברית *</Label>
          <Input
            value={formData.nameHe}
            onChange={(e) => setFormData({ ...formData, nameHe: e.target.value })}
            placeholder="כריך טונה"
            dir="rtl"
          />
        </div>
        <div>
          <Label>שם באנגלית *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Tuna Sandwich"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>תיאור בעברית</Label>
          <Textarea
            value={formData.descriptionHe}
            onChange={(e) => setFormData({ ...formData, descriptionHe: e.target.value })}
            placeholder="תיאור קצר..."
            dir="rtl"
          />
        </div>
        <div>
          <Label>תיאור באנגלית</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Short description..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>מחיר (₪) *</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            min={0}
          />
        </div>
        <div>
          <Label>קטגוריה</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as PicnicMenuItem['category'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>סדר הצגה</Label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
            min={0}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isAvailable}
          onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
        />
        <Label>זמין למכירה</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          ניהול תפריט פיקניק
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="w-4 h-4" />
              הוסף פריט
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>הוספת פריט חדש</DialogTitle>
            </DialogHeader>
            <FormFields />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? 'שומר...' : 'הוסף'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {menuItems.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">אין פריטים בתפריט</p>
          <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            הוסף פריט ראשון
          </Button>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">קטגוריה</TableHead>
                <TableHead className="text-right">מחיר</TableHead>
                <TableHead className="text-right">סדר</TableHead>
                <TableHead className="text-center">זמין</TableHead>
                <TableHead className="text-center">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id} className={!item.isAvailable ? 'opacity-50' : ''}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.nameHe}</div>
                      <div className="text-sm text-muted-foreground">{item.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryLabel(item.category)}</TableCell>
                  <TableCell>{item.price}₪</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => handleToggleAvailability(item)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>עריכת פריט</DialogTitle>
          </DialogHeader>
          <FormFields />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEditItem} disabled={updateItemMutation.isPending}>
              {updateItemMutation.isPending ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פריט מהתפריט</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק פריט זה? הפעולה לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={confirmDelete}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}