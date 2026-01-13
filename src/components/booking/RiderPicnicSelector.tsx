import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { PicnicMenuItem } from '@/lib/types';

interface RiderPicnicSelectorProps {
  riderId: string;
  riderName: string;
  picnicItems: PicnicMenuItem[];
  riderPicnicOrders: Record<string, Record<string, number>>;
  onUpdateQuantity: (riderId: string, itemId: string, delta: number) => void;
}

export function RiderPicnicSelector({
  riderId,
  riderName,
  picnicItems,
  riderPicnicOrders,
  onUpdateQuantity,
}: RiderPicnicSelectorProps) {
  const { isRTL } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const riderItems = riderPicnicOrders[riderId] || {};
  const hasItems = Object.keys(riderItems).length > 0;
  const totalItems = Object.values(riderItems).reduce((sum, qty) => sum + qty, 0);
  
  const riderTotal = Object.entries(riderItems).reduce((sum, [itemId, qty]) => {
    const item = picnicItems.find(p => p.id === itemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  // Group items by category
  const foodItems = picnicItems.filter(item => item.category === 'food');
  const drinkItems = picnicItems.filter(item => item.category === 'drink');

  const handleCheckboxChange = (checked: boolean) => {
    setIsExpanded(checked);
    // If unchecking and has items, clear them
    if (!checked && hasItems) {
      Object.keys(riderItems).forEach(itemId => {
        const qty = riderItems[itemId];
        for (let i = 0; i < qty; i++) {
          onUpdateQuantity(riderId, itemId, -1);
        }
      });
    }
  };

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            id={`picnic-${riderId}`}
            checked={isExpanded || hasItems}
            onCheckedChange={handleCheckboxChange}
          />
          <Label htmlFor={`picnic-${riderId}`} className="flex items-center gap-2 cursor-pointer">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="font-medium">{isRTL ? 'הוסף פיקניק ל' : 'Add Picnic for'} {riderName}</span>
          </Label>
        </div>
        {hasItems && (
          <span className="text-sm font-semibold text-primary">
            {totalItems} {isRTL ? 'פריטים' : 'items'} • {riderTotal}₪
          </span>
        )}
      </div>

      {(isExpanded || hasItems) && (
        <div className="pt-3 border-t space-y-4 animate-fade-in">
          {/* Food Items */}
          {foodItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                🥪 {isRTL ? 'אוכל' : 'Food'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {foodItems.map((item) => (
                  <PicnicItemRow
                    key={item.id}
                    item={item}
                    quantity={riderItems[item.id] || 0}
                    onIncrement={() => onUpdateQuantity(riderId, item.id, 1)}
                    onDecrement={() => onUpdateQuantity(riderId, item.id, -1)}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Drink Items */}
          {drinkItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                🥤 {isRTL ? 'שתייה' : 'Drinks'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {drinkItems.map((item) => (
                  <PicnicItemRow
                    key={item.id}
                    item={item}
                    quantity={riderItems[item.id] || 0}
                    onIncrement={() => onUpdateQuantity(riderId, item.id, 1)}
                    onDecrement={() => onUpdateQuantity(riderId, item.id, -1)}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PicnicItemRowProps {
  item: PicnicMenuItem;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isRTL: boolean;
}

function PicnicItemRow({ item, quantity, onIncrement, onDecrement, isRTL }: PicnicItemRowProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-background rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {isRTL ? item.nameHe : item.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.price}₪
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onDecrement}
          disabled={quantity === 0}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-6 text-center font-semibold">{quantity}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onIncrement}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
