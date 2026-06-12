CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  chunk_index int NOT NULL DEFAULT 0,
  parent_id uuid REFERENCES public.ai_knowledge_documents(id) ON DELETE CASCADE,
  source text,
  lang text NOT NULL DEFAULT 'ru',
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  token_count int,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_knowledge_documents_embedding_idx
  ON public.ai_knowledge_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS ai_knowledge_documents_active_idx
  ON public.ai_knowledge_documents (is_active);
CREATE INDEX IF NOT EXISTS ai_knowledge_documents_tags_idx
  ON public.ai_knowledge_documents USING gin (tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_knowledge_documents TO authenticated;
GRANT ALL ON public.ai_knowledge_documents TO service_role;

ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai knowledge"
  ON public.ai_knowledge_documents
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_ai_knowledge_documents_updated_at ON public.ai_knowledge_documents;
CREATE TRIGGER update_ai_knowledge_documents_updated_at
  BEFORE UPDATE ON public.ai_knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.match_ai_knowledge(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.5,
  filter_lang text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  source text,
  lang text,
  tags text[],
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.title,
    d.content,
    d.source,
    d.lang,
    d.tags,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge_documents d
  WHERE d.is_active
    AND d.embedding IS NOT NULL
    AND (filter_lang IS NULL OR d.lang = filter_lang)
    AND 1 - (d.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_ai_knowledge(vector, int, float, text) TO authenticated, anon, service_role;