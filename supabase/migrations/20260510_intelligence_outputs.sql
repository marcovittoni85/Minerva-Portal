-- Intelligence outputs table for AI-generated content with human-in-loop
CREATE TABLE IF NOT EXISTS public.intelligence_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL CHECK (output_type IN (
    'info_memo', 'pitch_deck', 'reclassification', 'tva', 'pattern_detection'
  )),
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  generated_by TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  UNIQUE(deal_id, output_type, version)
);

CREATE INDEX idx_intelligence_outputs_deal ON public.intelligence_outputs(deal_id, output_type, version DESC);
CREATE INDEX idx_intelligence_outputs_published ON public.intelligence_outputs(deal_id, output_type, is_published)
  WHERE is_published = true;

-- AI generation cost tracking
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  use_case TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  duration_ms INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_deal ON public.ai_generations(deal_id, created_at DESC);

-- Knowledge base conversations for analytics
CREATE TABLE IF NOT EXISTS public.kb_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  conversation_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer_preview TEXT,
  citations TEXT[],
  feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_conversations_user ON public.kb_conversations(user_id, created_at DESC);

-- Embeddings table for pgvector semantic search
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_entity ON public.embeddings(entity_type, entity_id);

-- Similarity search RPC function
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_entity_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  entity_id TEXT,
  entity_type TEXT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.entity_id,
    e.entity_type,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata
  FROM public.embeddings e
  WHERE
    (filter_entity_types IS NULL OR e.entity_type = ANY(filter_entity_types))
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS policies
ALTER TABLE public.intelligence_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on intelligence_outputs
CREATE POLICY "admin_all_intelligence" ON public.intelligence_outputs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Others can only see published outputs for deals they have access to
CREATE POLICY "published_intelligence_read" ON public.intelligence_outputs
  FOR SELECT USING (is_published = true);

-- Admin all on ai_generations
CREATE POLICY "admin_all_ai_gen" ON public.ai_generations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can read/write own kb conversations
CREATE POLICY "own_kb_conversations" ON public.kb_conversations
  FOR ALL USING (user_id = auth.uid());

-- Embeddings readable by authenticated
CREATE POLICY "embeddings_read" ON public.embeddings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin insert embeddings
CREATE POLICY "admin_embeddings_write" ON public.embeddings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
