-- RLS hardening per 4 tabelle legacy: profiles, access_requests, deal_activity, deal_access
-- Risolve advisory Supabase "rls_disabled" su queste 4 tabelle.
--
-- Pattern: helper is_admin() con SECURITY DEFINER per evitare ricorsione su profiles
-- (la admin policy di profiles farebbe SELECT su profiles → loop senza SECURITY DEFINER).

-- ─────────────────────────────────────────────────────────────────────
-- Helper is_admin
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin');
$$;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;

CREATE POLICY "auth_read_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- access_requests
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_own_access_req" ON public.access_requests;
DROP POLICY IF EXISTS "auth_insert_own_access_req" ON public.access_requests;
DROP POLICY IF EXISTS "admin_all_access_req" ON public.access_requests;

CREATE POLICY "auth_read_own_access_req" ON public.access_requests
  FOR SELECT TO authenticated USING (requester_id = auth.uid());

CREATE POLICY "auth_insert_own_access_req" ON public.access_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY "admin_all_access_req" ON public.access_requests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- deal_activity (log table — solo admin)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.deal_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_deal_activity" ON public.deal_activity;

CREATE POLICY "admin_all_deal_activity" ON public.deal_activity
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- deal_access
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.deal_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_own_deal_access" ON public.deal_access;
DROP POLICY IF EXISTS "admin_all_deal_access" ON public.deal_access;

CREATE POLICY "auth_read_own_deal_access" ON public.deal_access
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admin_all_deal_access" ON public.deal_access
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
