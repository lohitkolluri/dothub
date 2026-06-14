# DotHub Architecture Synthesis: 11-Platform Analysis

> **Constraint:** Everything FREE on Vercel Hobby/Pro + Supabase free tier.
> ❌ No Redis (Vercel KV not free at scale) │ ❌ No Elasticsearch │ ❌ No background queues
> ✅ Supabase PostgreSQL │ ✅ Supabase Realtime (WebSocket) │ ✅ Vercel ISR │ ✅ In-memory

---

## 1. EXECUTIVE SUMMARY

DotHub sits at a unique intersection — content discovery (Dribbble/Product Hunt), open-source social (dev.to), and package ecosystem (npm). The 11 platforms studied split into two architectural families:

| Family | Platforms | Pattern | DotHub Applicability |
|--------|-----------|---------|---------------------|
| **In-DB Ranking** | Lemmy, Hacker News | Rank computed in PostgreSQL during read | ✅ **Directly adoptable** — we already have Drizzle |
| **Background Queue** | Mastodon, X, Misskey | Sidekiq/BullMQ fan-out to Redis sorted sets | ❌ **Blocked** — no Redis, no paid queue |
| **Stateless Feeds** | Bluesky, GoToSocial | Pre-computed feeds as stateless HTTP | ✅ **Adoptable** — ISR revalidation pattern |
| **Media-First** | PeerTube, Pixelfed | Background transcoding, CDN | 🟡 **Partial** — Supabase transforms for images |

**The verdict:** DotHub's architecture already leans the right way (in-DB ranking via Wilson score). The platform comparison reveals **no immediate architectural pivot needed** — but 7 specific capabilities are missing (social graph, real-time, quality scoring, plugin feeds, media pipeline, moderation, federated identity).

**Strategic direction:** Evolve from monolithic gallery → feed-based architecture with composable ranking, using what's free (PG + Realtime + Vercel ISR) not what's unavailable (Redis, queues).

---

## 2. GAP ANALYSIS VS 11 PLATFORMS

### 2a. Features Present in DotHub (baseline)

- ✅ User accounts + GitHub OAuth (Auth.js)
- ✅ Content submission + metadata
- ✅ Upvoting system
- ✅ Threaded comments
- ✅ Trending calculation (Wilson score)
- ✅ Tag categorization
- ✅ Basic search (ILIKE)
- ✅ Pagination

### 2b. Features Present in ≥3 Platforms but Missing in DotHub

| Missing Feature | Present In | DotHub Priority | Notes |
|---|---|---|---|
| **Social graph (follow)** | Mastodon, Bluesky, X, Misskey, GoToSocial, Friendica | **P0** — unlocks feed core | Without follows, no personalized feed |
| **Real-time feed updates** | Mastodon, Bluesky, X, Misskey | **P1** — competitive diff | Use Supabase Realtime, not WebSockets |
| **Trending with quality score** | Lemmy, X, HackerNews | **P0** — fixes current "any upvote = trending" | Expand Wilson score with author rep, report penalty |
| **Media pipeline (thumbnails, blurhash)** | Pixelfed, Misskey, PeerTube, X | **P1** — screenshot quality | Supabase image transforms + blurhash |
| **Moderation system** | Mastodon, Bluesky, Lemmy, Friendica, OSSN | **P2** — needed before growth | Reports → flags → soft/hard delete |
| **Content federation (ActivityPub)** | Mastodon, Lemmy, Friendica, GoToSocial, PeerTube, Pixelfed | **P3** — distant roadmap | Cross-post dotfiles to Fediverse |
| **Plugin/extension system** | OSSN, Misskey, Friendica | **P3** — platform play | Custom feed algorithms, themes |
| **Custom feeds (user-defined)** | Bluesky, Mastodon (lists), X (lists) | **P2** — power user feature | Save tag combos as named feeds |
| **Recommendation engine** | X, Bluesky, Mastodon (explore) | **P2** — discovery | Collaborative + content-based filtering |

### 2c. What DotHub Should NOT Copy

- **Mastodon's Sidekiq feed fan-out** — requires Redis, doesn't scale on free tier
- **X's Heavy Ranker (Grok)** — 500ms ML inference, way beyond scope
- **Bluesky's full AT Protocol** — overengineered for a dotfiles platform
- **PeerTube's video transcoding** — unnecessary (screenshots only)
- **OSSN's plugin system** — premature at this stage

---

## 3. ARCHITECTURE RECOMMENDATION

### 3a. Core Architecture: Feed-Over-PostgreSQL (Lemmy-Inspired)

```
┌─ Browser ─────────────────────────────────────┐
│  Gallery Page  │  Profile  │  Config Detail    │
└───────┬────────────────────────────────────────┘
        │ HTTP + ISR
┌───────▼────────────────────────────────────────┐
│  Next.js App Router (Vercel)                    │
│  ├─ API Routes (serverless, 60s timeout)       │
│  ├─ ISR Cache (stale-while-revalidate)          │
│  └─ Supabase Realtime (WebSocket → client)     │
└───────┬────────────────────────────────────────┘
        │ Drizzle ORM
┌───────▼────────────────────────────────────────┐
│  Supabase PostgreSQL (FREE TIER)                │
│  ├─ Materialized Views for trending feeds       │
│  ├─ SQL ranking functions (Wilson score)        │
│  ├─ Trigram GIN indexes for full-text search    │
│  ├─ Realtime publication channels               │
│  └─ pg_cron for periodic refresh                │
└────────────────────────────────────────────────┘
```

### 3b. Feed Generation Strategy

**Phase 1 (Current → Next 2 weeks):** Request-time computed feeds
- Gallery page calls `getConfigs()` with Drizzle query + Wilson score ordering
- Works now, degrades at ~10k configs (full table scan for count)

**Phase 2 (Scalability fix):** Partial materialization
- `configs` table gets materialized `trending_score` column
- Updated on INSERT/UPDATE via Drizzle hooks + on upvote via trigger
- Gallery query becomes `ORDER BY trending_score DESC, LIMIT/OFFSET`
- Eliminates per-request score recomputation

**Phase 3 (Personalization):** Follow-based personal feeds
- New `follows` table (followerId, followingId, createdAt)
- Personal feed: configs from followed users, interspersed with trending
- Computed per-request (fits <100ms for 1000 follows)

### 3c. Real-Time Strategy (No Redis)

| Need | Solution | How |
|---|---|---|
| Live vote count updates | Supabase Realtime channel | Client subscribes to `config_updates` channel |
| New config notifications | Supabase Realtime broadcast | `pg_notify` → Realtime → browser toast |
| Activity feed | Realtime channel per user | Follow events streamed to subscribers |
| Trending freshness | ISR revalidation | `revalidatePath('/explore')` on new upvote |

### 3d. Ranking Formula (PostgreSQL Implementation)

```sql
-- Expanded from X Algorithm + Lemmy hybrid
CREATE OR REPLACE FUNCTION dothub_rank(
  upvotes INT,
  downvotes INT,      -- currently 0, reserved for future
  created_at TIMESTAMPTZ,
  author_reputation FLOAT DEFAULT 1.0,   -- log10(followers) normalized
  report_penalty FLOAT DEFAULT 0.0       -- 0..1 from moderation flags
) RETURNS FLOAT AS $$
DECLARE
  n FLOAT := upvotes + downvotes;
  z FLOAT := 1.96;  -- 95% confidence
  p_hat FLOAT;
  wilson_lower FLOAT;
  age_hours FLOAT;
BEGIN
  IF n = 0 THEN RETURN 0; END IF;
  p_hat := (upvotes + 2) / (n + 4);  -- Laplace smoothing
  wilson_lower := (p_hat + z*z/(2*n) - z * sqrt((p_hat*(1-p_hat) + z*z/(4*n))/n)) / (1 + z*z/n);  
  age_hours := EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600;
  -- Wilson score * author rep * recency decay * (1 - report penalty)
  RETURN wilson_lower * author_reputation * (1.0 / (1.0 + age_hours / 72.0)) * (1.0 - report_penalty);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Why this works without Redis:** The entire ranking computation lives in PostgreSQL during the read. No queue, no caching layer, no materialized timeline. At DotHub's scale (thousands, not millions of configs), this executes in <5ms.

---

## 4. PHASED ROADMAP

### Phase 1: Foundation (Now — 2 weeks) ← YOU ARE HERE

| Item | Effort | Impact | Dependencies |
|---|---|---|---|
| Partial follow relationship (DB + API) | 1 day | Unlocks personal feed | None |
| Materialized trending_score on configs | 0.5 day | Eliminates per-request score compute | None |
| DB indexes from scalability audit | 0.5 day | 10x query speed at scale | None |
| Fetch AbortControllers + timeouts | 0.5 day | Prevents hanging requests | None |
| Supabase Realtime for live voting | 1 day | Real-time UX | None |

**Total: ~3.5 days**

### Phase 2: Discovery (2 — 4 weeks)

| Item | Effort | Impact | Dependencies |
|---|---|---|---|
| Personal feed (follows-based) | 2 days | Core social feature | Phase 1 follows |
| Quality scoring (author rep, report penalty) | 1 day | Better trending | Phase 1 materialized score |
| Collection/playlist (bundle configs) | 2 days | Content grouping | None |
| Rich markdown editor for descriptions | 1 day | Richer content | None |
| Recommended configs (collaborative) | 3 days | Discovery | Phase 1 follows |

**Total: ~9 days**

### Phase 3: Platform (4 — 8 weeks)

| Item | Effort | Impact | Dependencies |
|---|---|---|---|
| Moderation dashboard (flags + reports) | 3 days | Trust & safety | None |
| Custom feeds (save tag combos) | 2 days | Power user feature | Phase 2 follows |
| Notification system (Realtime) | 2 days | Engagement | Phase 1 Realtime |
| Multi-reaction types (like/wow/fire) | 1 day | Engagement | None |
| ActivityPub bridge (cross-post) | 5 days | Federation | Phase 1 follows |
| API rate-limiting on ALL routes | 1 day | Abuse prevention | None |

**Total: ~14 days**

---

## 5. DB SCHEMA EVOLUTION

### 5a. Immediate Indexes (from scalability audit)

```sql
CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configs(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_config_id ON comments(config_id);
CREATE INDEX IF NOT EXISTS idx_config_tags_tag_id ON config_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_configs_upvote_count ON configs(upvote_count DESC, created_at DESC);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_configs_search ON configs 
  USING GIN (title gin_trgm_ops, description gin_trgm_ops);
```

### 5b. Phase 1 Schema Additions

```sql
-- Follow relationship (self-referential many-to-many)
CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES users(id),
  following_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Materialized trending score column
ALTER TABLE configs ADD COLUMN trending_score FLOAT NOT NULL DEFAULT 0;
CREATE INDEX idx_configs_trending ON configs(trending_score DESC, created_at DESC);

-- Recalculate trending_score on upvote
CREATE OR REPLACE FUNCTION recalc_trending_score() RETURNS TRIGGER AS $$
BEGIN
  -- Simplified: recalc based on upvote_count + created_at + author's follower count
  UPDATE configs c SET trending_score = 
    dothub_rank(c.upvote_count, 0, c.created_at, COALESCE(f.follower_rep, 1.0), 0)
  FROM (SELECT COUNT(*)::FLOAT / 100.0 AS follower_rep FROM follows WHERE following_id = c.user_id) f
  WHERE c.id = NEW.config_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_recalc_trending AFTER INSERT OR DELETE ON upvotes
  FOR EACH ROW EXECUTE FUNCTION recalc_trending_score();
```

### 5c. Phase 2 Schema

```sql
-- Reports/moderation
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES users(id),
  config_id UUID REFERENCES configs(id),
  comment_id UUID REFERENCES comments(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES users(id)
);

-- Multi-reaction types
CREATE TYPE reaction_type AS ENUM ('like', 'wow', 'fire', 'useful');
CREATE TABLE reactions (
  user_id TEXT NOT NULL REFERENCES users(id),
  config_id UUID NOT NULL REFERENCES configs(id),
  reaction reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, config_id, reaction)
);

-- Collections/playlists
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE collection_configs (
  collection_id UUID NOT NULL REFERENCES collections(id),
  config_id UUID NOT NULL REFERENCES configs(id),
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, config_id)
);
```

---

## 6. MIGRATION STRATEGY

### 6a. Migration Philosophy

- **No-downtime schema changes** — all DDL statements in this plan are additive (CREATE INDEX, ADD COLUMN, CREATE TABLE)
- **Rolling deployment** — Drizzle migrations auto-detect unapplied changes
- **Data backfill** — `trending_score` can be backfilled via one-time SQL: `UPDATE configs SET trending_score = dothub_rank(upvote_count, 0, created_at, 1.0, 0)`
- **Indexes added concurrently** — use `CREATE INDEX CONCURRENTLY` for production

### 6b. Migration Order (Phase 1)

```
Step 1: CREATE INDEX statements (no downtime, concurrent)
Step 2: CREATE TABLE follows
Step 3: CREATE FUNCTION dothub_rank
Step 4: ALTER TABLE configs ADD COLUMN trending_score
Step 5: Backfill trending_score via UPDATE
Step 6: CREATE INDEX on trending_score
Step 7: CREATE TRIGGER for recalc_trending_score
```

Each step is reversible. Rollback plan: DROP INDEX, DROP TRIGGER, DROP FUNCTION.

### 6c. Vercel Deployment Considerations

- **Edge runtime**: Feed API routes must use `runtime: 'nodejs'` (no Edge, needs Drizzle)
- **ISR revalidation**: `revalidatePath('/explore')` triggered from vote API route
- **Timeout management**: DB queries <100ms, GitHub API fetches need client-side timeout (5s)
- **Cold start**: Drizzle connection pool stays warm via Supabase pooler (PgBouncer)
- **Image optimization**: Use Supabase Image Transformations (`?width=400&quality=80`) instead of next/image in serverless (avoids sharp dependency issues)

---

## 7. IMPLEMENTATION PLAN — NEXT 2 WEEKS

### Week 1: Foundation (Days 1-4)

**Day 1: DB Indexes + AbortControllers**
- Add 5 missing indexes (Drizzle migration)
- Add AbortController to ALL fetch() calls (config-card, vote-widget, gallery-page, submit, settings, config/[id], comments)
- Add 5s timeout to GitHub API fetches (detection.ts, config/[id])
- Add AbortController to useVote hook

**Day 2: Follow System (DB + API)**
- CRATE TABLE follows in schema.ts
- POST /api/follow (auth required, upsert)
- GET /api/followers?userId=X (paginated)
- GET /api/following?userId=X (paginated)
- Add follower_count to users table

**Day 3: Materialized Trending Score**
- Add trending_score column to configs
- Create dothub_rank() SQL function
- Create recalc_trending_score trigger on upvotes
- Backfill existing configs
- Update gallery queries to ORDER BY trending_score DESC

**Day 4: Supabase Realtime + Live Voting**
- Set up Supabase Realtime channel for config_updates
- Subscribe on gallery page to live vote count updates
- Broadcast on upvote via pg_notify or Realtime mutation
- Add revalidatePath('/explore') on vote

### Week 2: Personal Feeds (Days 5-8)

**Day 5: Personal Feed API**
- GET /api/feed?page=X — returns configs from followed users + trending
- Uses UNION: (SELECT from configs WHERE userId IN follows) UNION (top trending)
- Pagination via cursor (opaque `_cursor` encoding createdAt + id)
- ISR with 60s revalidation

**Day 6-7: Personal Feed UI**
- New /feed route (authenticated)
- Feed tabs: "Following" | "Trending" | "Latest"
- Visual indicator for new items (Realtime subscription)
- Empty state: "Follow some users to see their configs here"

**Day 8: Quality + Polish**
- Author reputation in trending scores
- Add report_penalty field
- Moderate reports UI
- Polish: fetch states, error boundaries, loading skeletons

---

## 8. RISK ANALYSIS

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase Realtime DB connections exceed free tier (200 concurrent) | Medium | Medium | Connection pooling via PgBouncer; throttle client subscriptions |
| Vercel 60s timeout on heavy queries | Low | High | Add LIMIT 50 default; query optimizer; early pagination cut |
| PG trigram index write overhead at scale | Low | Low | Only on title/description; update rate is low (new configs, not updates) |
| Materialized view staleness | Medium | Low | Acceptable for trending; ISR revalidation via upvote trigger |
| Follow spam (mass follow/unfollow) | Low | Medium | Rate-limit follow API; add follow_cooldown column |
| Git repo detection hangs for large repos | High | Medium | Client-side 10s timeout; limit to root file listing |
| No background queue = request-time computation | Medium | Low | Sub-5ms per ranking query; acceptable at 10k+ configs |

---

## 9. RECOMMENDATION

**Do not pivot architecture. Evolve it.**

The current in-DB ranking approach (Wilson score in query time) is correct for DotHub's scale. The 11-platform analysis confirms:

1. **DotHub's simplest path** is the Lemmy approach — PostgreSQL-based ranking with materialized columns — not the Mastodon/X approach (Redis fan-out). We're already on it.
2. **The single highest-impact missing feature** is social graph (follows). Everything else (personal feed, notifications, recommendation engine) requires it.
3. **The biggest scalability risk** is NOT query time — it's the absence of fetch AbortControllers and missing DB indexes. Fix these now before growing.
4. **Supabase Realtime** replaces what Mastodon uses Redis for (streaming updates). It's free and we should use it for live voting first.
5. **Moderation** can wait until user-generated reports arrive organically. Don't build it preemptively.

---

## APPENDIX: Key Formulas from Research

### Wilson Score (current)
Used in trending: `(p_hat + z²/2n - z√(p_hat(1-p_hat)+z²/4n)/n) / (1+z²/n)`

### Recency Decay (X Algorithm)
`exp(-λ * hours_since_creation)` where λ = ln(2)/72 (72-hour half-life)

### Author Reputation
`log10(followers + 1) / log10(max_followers + 1)` normalized to 0..1

### Report Penalty
`1.0 - min(report_count / threshold, 1.0)` where threshold = 5

### Combined Score (Lemmy-inspired)
`wilson_lower * author_rep * recency_factor * (1 - report_penalty)`