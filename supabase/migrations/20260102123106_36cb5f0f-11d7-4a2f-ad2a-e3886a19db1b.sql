-- =============================================
-- PHASE 1: CMS & DYNAMIC CONTENT TABLES
-- =============================================

-- 1.1 Create site_content table for CMS
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  content_key TEXT NOT NULL,
  value_he TEXT,
  value_en TEXT,
  content_type TEXT DEFAULT 'text',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, content_key)
);

-- 1.2 Create session_settings table for shift management
CREATE TABLE public.session_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  season TEXT DEFAULT 'all',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key TEXT UNIQUE NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: site_content
-- =============================================

CREATE POLICY "Anyone can view active site content"
ON public.site_content
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all site content"
ON public.site_content
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site content"
ON public.site_content
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site content"
ON public.site_content
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site content"
ON public.site_content
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- RLS POLICIES: session_settings
-- =============================================

CREATE POLICY "Anyone can view session settings"
ON public.session_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert session settings"
ON public.session_settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update session settings"
ON public.session_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete session settings"
ON public.session_settings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- RLS POLICIES: payment_methods
-- =============================================

CREATE POLICY "Anyone can view enabled payment methods"
ON public.payment_methods
FOR SELECT
USING (is_enabled = true);

CREATE POLICY "Admins can view all payment methods"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert payment methods"
ON public.payment_methods
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment methods"
ON public.payment_methods
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment methods"
ON public.payment_methods
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_settings_updated_at
BEFORE UPDATE ON public.session_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: session_settings
-- =============================================

INSERT INTO public.session_settings (session_type, is_enabled, season)
VALUES 
  ('morning', true, 'all'),
  ('daily', true, 'all');

-- =============================================
-- SEED DATA: payment_methods
-- =============================================

INSERT INTO public.payment_methods (method_key, name_he, name_en, is_enabled, sort_order, icon)
VALUES 
  ('credit_card', 'כרטיס אשראי', 'Credit Card', true, 1, '💳'),
  ('bit', 'ביט', 'Bit', true, 2, '📱'),
  ('cash', 'מזומן', 'Cash', true, 3, '💵');

-- =============================================
-- SEED DATA: Add security_deposit_per_bike to pricing
-- =============================================

INSERT INTO public.pricing (key, value)
VALUES ('security_deposit_per_bike', 60)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- ENABLE REALTIME FOR NEW TABLES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;