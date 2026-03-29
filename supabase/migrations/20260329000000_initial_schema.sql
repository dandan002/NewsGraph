-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Articles table
CREATE TABLE articles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url              text UNIQUE NOT NULL,
  source_name      text NOT NULL,
  credibility_tier int  NOT NULL CHECK (credibility_tier IN (1, 2, 3)),
  country          char(2) NOT NULL,
  published_at     timestamptz,
  summary_en       text NOT NULL,
  embedding        vector(1536),
  created_at       timestamptz DEFAULT now()
);

-- Market snapshots table
CREATE TABLE market_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset         text NOT NULL,
  market_type   text NOT NULL CHECK (market_type IN ('perp', 'spot')),
  mark_price    numeric,
  open_interest numeric,
  funding_rate  numeric,
  snapshot_at   timestamptz DEFAULT now()
);

ALTER TABLE market_snapshots
  ADD CONSTRAINT market_snapshots_asset_snapshot_key UNIQUE (asset, snapshot_at);

-- Indexes
-- NOTE: This index is built on an empty table. After the first bulk ingest,
-- run: REINDEX INDEX CONCURRENTLY articles_embedding_idx;
-- to rebuild cluster centroids for accurate approximate nearest-neighbor search.
CREATE INDEX articles_embedding_idx ON articles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON articles (published_at DESC);
CREATE INDEX ON market_snapshots (snapshot_at DESC);

-- Row-level security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read" ON articles
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read" ON market_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

-- NOTE: INSERT/UPDATE operations on both tables are performed by the Python ingest
-- worker using the Supabase service role key, which bypasses RLS by design.
-- Do NOT use the anon key for writes in the worker.
