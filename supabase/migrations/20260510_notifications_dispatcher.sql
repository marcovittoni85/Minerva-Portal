-- Notifications dispatcher table — multi-channel notification delivery tracking.
-- Named `notifications_dispatch` (not `notifications`) to avoid collision with
-- the legacy single-channel notifications system already in use.
CREATE TABLE IF NOT EXISTS public.notifications_dispatch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_slug TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  variables JSONB,
  content JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'partial', 'failed')),
  channel_results JSONB, -- {email: 'sent', whatsapp: 'failed: ...', in_app: 'sent'}
  attempts INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  deep_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_dispatch_recipient_unread
  ON public.notifications_dispatch(recipient_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notif_dispatch_status
  ON public.notifications_dispatch(status, created_at DESC);

ALTER TABLE public.notifications_dispatch ENABLE ROW LEVEL SECURITY;

-- Recipients can read their own dispatch records
CREATE POLICY "own_notifications_dispatch"
  ON public.notifications_dispatch
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Admins can do everything
CREATE POLICY "admin_all_notif_dispatch"
  ON public.notifications_dispatch
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
