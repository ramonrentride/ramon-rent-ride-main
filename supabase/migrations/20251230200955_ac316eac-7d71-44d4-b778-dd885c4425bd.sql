-- Enable realtime for important tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bikes;

-- Create picnic_menu table for individual dish ordering
CREATE TABLE public.picnic_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_he TEXT NOT NULL,
  description TEXT,
  description_he TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'food',
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.picnic_menu ENABLE ROW LEVEL SECURITY;

-- Public read access for menu items
CREATE POLICY "Anyone can view available menu items" 
ON public.picnic_menu 
FOR SELECT 
USING (is_available = true);

-- Admins can manage menu items
CREATE POLICY "Admins can manage menu items" 
ON public.picnic_menu 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default menu items
INSERT INTO public.picnic_menu (name, name_he, description, description_he, price, category, sort_order) VALUES
('Cheese Sandwich', 'כריך גבינה', 'Fresh bread with cheese and vegetables', 'לחם טרי עם גבינה וירקות', 35, 'sandwich', 1),
('Tuna Sandwich', 'כריך טונה', 'Tuna salad sandwich with lettuce', 'כריך סלט טונה עם חסה', 40, 'sandwich', 2),
('Falafel Wrap', 'פיתה פלאפל', 'Falafel in pita with hummus and salad', 'פלאפל בפיתה עם חומוס וסלט', 38, 'sandwich', 3),
('Fresh Salad', 'סלט טרי', 'Mixed greens with olive oil dressing', 'ירקות מעורבים ברוטב שמן זית', 30, 'salad', 4),
('Fruit Cup', 'כוס פירות', 'Seasonal fresh fruit mix', 'מיקס פירות טריים עונתיים', 25, 'dessert', 5),
('Water Bottle', 'בקבוק מים', '500ml mineral water', '500 מ"ל מים מינרליים', 8, 'drink', 6),
('Juice Box', 'מיץ קרטון', 'Natural fruit juice', 'מיץ פירות טבעי', 12, 'drink', 7),
('Energy Bar', 'חטיף אנרגיה', 'Granola energy bar', 'חטיף גרנולה אנרגטי', 15, 'snack', 8);

-- Enable realtime for picnic_menu
ALTER PUBLICATION supabase_realtime ADD TABLE public.picnic_menu;

-- Trigger for updated_at
CREATE TRIGGER update_picnic_menu_updated_at
BEFORE UPDATE ON public.picnic_menu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();