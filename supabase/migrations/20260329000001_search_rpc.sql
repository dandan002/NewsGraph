CREATE OR REPLACE FUNCTION search_articles(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_tier int DEFAULT NULL,
  filter_since timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  url text,
  source_name text,
  credibility_tier int,
  published_at timestamptz,
  summary_en text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM (
    SELECT
      a.id,
      a.url,
      a.source_name,
      a.credibility_tier,
      a.published_at,
      a.summary_en,
      1 - (a.embedding <=> query_embedding) AS similarity
    FROM articles a
    WHERE
      (filter_tier IS NULL OR a.credibility_tier = filter_tier)
      AND (filter_since IS NULL OR a.published_at >= filter_since)
    ORDER BY a.embedding <=> query_embedding
    LIMIT match_count * 2
  ) sub
  WHERE similarity > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
