import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bike, Map, UtensilsCrossed, Mountain, Clock, MapPin,
  Droplets, Sun, Gauge, CircleStop, Settings, CircleX,
  Link, AlertTriangle, ArrowUpDown, Move, Calendar,
  ClipboardList, Phone, ExternalLink, Camera, Heart,
  Star, Shield, Zap, Users, Home, Mail, Bell, Search,
  Filter, Download, Upload, Trash2, Edit, Eye, Lock,
  Unlock, Check, X, Plus, Minus, RefreshCw, Play,
  Pause, Square, Circle, Triangle, Hexagon, Compass,
  Navigation, Route, Signpost, Flag, Target, Award,
  Trophy, Medal, Crown, Gift, Package, Truck, Car,
  Plane, Ship, Train, Bus, Footprints, TreePine, Leaf,
  Flower2, Bird, Fish, Bug, Rabbit, Cat, Dog,
} from 'lucide-react';

const icons = [
  // Transport
  { name: 'Bike', component: Bike, category: 'transport' },
  { name: 'Car', component: Car, category: 'transport' },
  { name: 'Truck', component: Truck, category: 'transport' },
  { name: 'Bus', component: Bus, category: 'transport' },
  { name: 'Train', component: Train, category: 'transport' },
  { name: 'Plane', component: Plane, category: 'transport' },
  { name: 'Ship', component: Ship, category: 'transport' },
  // Nature
  { name: 'Mountain', component: Mountain, category: 'nature' },
  { name: 'TreePine', component: TreePine, category: 'nature' },
  { name: 'Leaf', component: Leaf, category: 'nature' },
  { name: 'Flower2', component: Flower2, category: 'nature' },
  { name: 'Sun', component: Sun, category: 'nature' },
  { name: 'Droplets', component: Droplets, category: 'nature' },
  { name: 'Bird', component: Bird, category: 'nature' },
  { name: 'Fish', component: Fish, category: 'nature' },
  { name: 'Bug', component: Bug, category: 'nature' },
  { name: 'Rabbit', component: Rabbit, category: 'nature' },
  { name: 'Cat', component: Cat, category: 'nature' },
  { name: 'Dog', component: Dog, category: 'nature' },
  // Navigation
  { name: 'Map', component: Map, category: 'navigation' },
  { name: 'MapPin', component: MapPin, category: 'navigation' },
  { name: 'Compass', component: Compass, category: 'navigation' },
  { name: 'Navigation', component: Navigation, category: 'navigation' },
  { name: 'Route', component: Route, category: 'navigation' },
  { name: 'Signpost', component: Signpost, category: 'navigation' },
  { name: 'Flag', component: Flag, category: 'navigation' },
  { name: 'Target', component: Target, category: 'navigation' },
  { name: 'Footprints', component: Footprints, category: 'navigation' },
  // Actions
  { name: 'Calendar', component: Calendar, category: 'actions' },
  { name: 'Clock', component: Clock, category: 'actions' },
  { name: 'Phone', component: Phone, category: 'actions' },
  { name: 'Mail', component: Mail, category: 'actions' },
  { name: 'Bell', component: Bell, category: 'actions' },
  { name: 'Search', component: Search, category: 'actions' },
  { name: 'Camera', component: Camera, category: 'actions' },
  { name: 'Download', component: Download, category: 'actions' },
  { name: 'Upload', component: Upload, category: 'actions' },
  { name: 'Link', component: Link, category: 'actions' },
  { name: 'ExternalLink', component: ExternalLink, category: 'actions' },
  // Tools
  { name: 'Settings', component: Settings, category: 'tools' },
  { name: 'Gauge', component: Gauge, category: 'tools' },
  { name: 'Filter', component: Filter, category: 'tools' },
  { name: 'RefreshCw', component: RefreshCw, category: 'tools' },
  { name: 'Shield', component: Shield, category: 'tools' },
  { name: 'Lock', component: Lock, category: 'tools' },
  { name: 'Unlock', component: Unlock, category: 'tools' },
  { name: 'Zap', component: Zap, category: 'tools' },
  // Status
  { name: 'Check', component: Check, category: 'status' },
  { name: 'X', component: X, category: 'status' },
  { name: 'AlertTriangle', component: AlertTriangle, category: 'status' },
  { name: 'CircleStop', component: CircleStop, category: 'status' },
  { name: 'CircleX', component: CircleX, category: 'status' },
  // General
  { name: 'Heart', component: Heart, category: 'general' },
  { name: 'Star', component: Star, category: 'general' },
  { name: 'Users', component: Users, category: 'general' },
  { name: 'Home', component: Home, category: 'general' },
  { name: 'UtensilsCrossed', component: UtensilsCrossed, category: 'general' },
  { name: 'ClipboardList', component: ClipboardList, category: 'general' },
  { name: 'Package', component: Package, category: 'general' },
  { name: 'Gift', component: Gift, category: 'general' },
  // Achievements
  { name: 'Award', component: Award, category: 'achievements' },
  { name: 'Trophy', component: Trophy, category: 'achievements' },
  { name: 'Medal', component: Medal, category: 'achievements' },
  { name: 'Crown', component: Crown, category: 'achievements' },
  // Shapes
  { name: 'Circle', component: Circle, category: 'shapes' },
  { name: 'Square', component: Square, category: 'shapes' },
  { name: 'Triangle', component: Triangle, category: 'shapes' },
  { name: 'Hexagon', component: Hexagon, category: 'shapes' },
  { name: 'ArrowUpDown', component: ArrowUpDown, category: 'shapes' },
  { name: 'Move', component: Move, category: 'shapes' },
];

const categories = [
  { key: 'all', label: 'הכל' },
  { key: 'transport', label: 'תחבורה' },
  { key: 'nature', label: 'טבע' },
  { key: 'navigation', label: 'ניווט' },
  { key: 'actions', label: 'פעולות' },
  { key: 'tools', label: 'כלים' },
  { key: 'status', label: 'סטטוס' },
  { key: 'general', label: 'כללי' },
  { key: 'achievements', label: 'הישגים' },
  { key: 'shapes', label: 'צורות' },
];

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filteredIcons = icons.filter((icon) => {
    const matchesSearch = icon.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || icon.category === category;
    return matchesSearch && matchesCategory;
  });

  const selectedIcon = icons.find((i) => i.name === value);
  const IconComponent = selectedIcon?.component;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {IconComponent ? (
            <>
              <IconComponent className="h-4 w-4" />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">בחר אייקון...</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>בחר אייקון</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="חיפוש אייקון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={category === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.key)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-8 gap-2">
              {filteredIcons.map((icon) => {
                const Icon = icon.component;
                return (
                  <Button
                    key={icon.name}
                    variant={value === icon.name ? 'default' : 'ghost'}
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      onChange(icon.name);
                      setOpen(false);
                    }}
                    title={icon.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export icon map for use in other components
export const iconComponents: Record<string, React.ComponentType<any>> = icons.reduce(
  (acc, icon) => ({ ...acc, [icon.name]: icon.component }),
  {}
);
