# ARIA Studio — Automated Multi-Account Social Media System

**Date:** 2026-05-31
**Owner:** Seth
**Lives in:** JARVIS hub, under the Marketing Agent (ARIA) experience

## Goal

Turn ARIA into the control + monitoring hub for an automated social media
operation: multiple accounts, each with its own AI personality, that generate
high-end posts (text + graphics) from a prompt or autonomously, schedule them,
and publish them to live platforms — all monitored from a JARVIS dashboard.

## Decisions (locked during brainstorming)

| Topic | Decision |
|-------|----------|
| Publishing | Fully automated live publishing |
| First platform | Facebook Page (Meta Graph API) |
| Graphics engine | OpenAI `gpt-image-1` (architected swappable; FLUX later) |
| Scheduler host | Local Express server (`node-cron`) for now; cloud later |
| Approval flow | Hybrid — new accounts require review; trusted accounts auto-publish |
| Generation mode | Both on-demand (prompt) and auto-generate (from content pillars) |
| Code structure | New `src/aria/` frontend module + `social/` backend helper (keep out of the 1,180-line App.js) |

## Architecture

```
JARVIS — Marketing Agent tab -> "ARIA Studio" dashboard
  [Personalities]  [Composer]  [Queue/Calendar]
                 |  (Supabase = shared brain)
   social_accounts   social_posts   Storage: social-images
                 ^
   Express backend (server.js + social/ helper)
     - ARIA text gen (Anthropic)
     - Image gen (OpenAI gpt-image-1)
     - Facebook publish (Graph API)         [Phase 4]
     - node-cron scheduler (fires posts)
```

## Build phases (each independently testable)

1. **Personalities & data layer** — create/edit/store accounts + Supabase tables.
   *Test: create a personality, see its card.*
2. **Content generation** — prompt -> ARIA caption + image prompt -> gpt-image-1
   graphic -> queued preview. *Test: type a prompt, get a finished post + image.*
3. **Queue, scheduling & approval** — calendar/queue view, hybrid approval,
   node-cron scheduler, auto-generate from pillars. *Test: schedule a post, watch
   it move through states.*
4. **Facebook publishing** — Graph API wiring so approved/scheduled posts go live.
   Includes the Meta app-setup checklist (external approval gates).
   *Test: a real post appears on the Facebook Page.*

## Data model

### Table `social_accounts` (personalities)
- `id` uuid pk
- `name` text
- `platform` text — "facebook" (more later)
- `fb_page_id` text
- `fb_access_token` text — long-lived Page token (store securely)
- `niche` text
- `audience` text
- `tone` text — one-line vibe
- `bio` text — ARIA-generated
- `personality_prompt` text — master system prompt for this persona
- `content_pillars` jsonb — 3-5 core topics for auto-generation
- `posting_frequency` text — e.g. "daily", "3x/week"
- `optimal_times` jsonb — preferred posting times
- `auto_publish` bool — hybrid gate, starts false
- `trust_count` int — approved-post count; unlocks auto_publish at threshold
- `accent_color` text — dashboard card color
- `status` text — active / paused
- `created_at` timestamptz

### Table `social_posts` (the queue)
- `id` uuid pk
- `account_id` uuid fk -> social_accounts
- `source` text — "on_demand" | "auto"
- `prompt` text — your prompt (null for auto)
- `generated_text` text — caption ARIA wrote
- `image_prompt` text — image prompt ARIA wrote
- `image_url` text — gpt-image-1 result in Supabase Storage
- `hashtags` text
- `status` text — draft -> pending_review -> approved -> scheduled -> published / failed / skipped
- `scheduled_for` timestamptz
- `published_at` timestamptz
- `fb_post_id` text — returned by Facebook on success
- `error` text — failure reason if any
- `created_at` timestamptz

### Storage
- Bucket `social-images` (public) — generated graphics; Facebook needs a public image URL.

## Backend endpoints (`server.js` + `social/` helper)

**Accounts**
- `POST /api/social/accounts` — input name + platform + niche + tone + frequency;
  ARIA generates `personality_prompt`, `bio`, `content_pillars`; save.
- `GET /api/social/accounts`
- `PATCH /api/social/accounts/:id` — pause, flip auto_publish, edit personality
- `DELETE /api/social/accounts/:id`

**Generation**
- `POST /api/social/generate` `{ account_id, prompt }` — load personality_prompt
  -> Anthropic caption + hashtags + image prompt -> OpenAI gpt-image-1 -> upload to
  Storage -> insert `social_posts` (pending_review). Returns preview.
- `POST /api/social/autogenerate` `{ account_id }` — same pipeline, picks a content
  pillar automatically, `source="auto"`.

**Queue actions**
- `POST /api/social/posts/:id/approve` — set approved + scheduled_for; bump
  trust_count; flip account.auto_publish once threshold crossed.
- `POST /api/social/posts/:id/regenerate`
- `POST /api/social/posts/:id/skip`
- `PATCH /api/social/posts/:id` — edit text/time
- `DELETE /api/social/posts/:id`
- `GET /api/social/posts?status=&account_id=`

**Scheduler (node-cron, every minute)**
1. Publish pass: posts with status in (approved, scheduled) and scheduled_for <= now
   -> publish to Facebook -> mark published / failed.
2. Auto-publish gate: accounts with auto_publish=true -> new pending_review auto-posts
   become scheduled without review.
3. Top-up pass: active accounts whose future queue is below frequency target ->
   autogenerate to refill.

**Secrets (.env):** `OPENAI_API_KEY`; Facebook Page token(s) in Phase 4.

## Frontend — ARIA Studio (`src/aria/`)

Surfaced inside the Marketing Agent experience. Three tabs:

1. **Personalities** — grid of account cards (name, niche, status dot, auto/review
   badge, queue count). "+ New Personality" wizard: platform -> niche -> tone ->
   frequency -> ARIA generates persona -> confirm.
2. **Composer** — pick account, type prompt, Generate -> live preview of caption +
   graphic + hashtags. Buttons: Approve & Schedule, Regenerate, Edit, Discard.
3. **Queue / Calendar** — posts grouped by status (Pending Review, Scheduled,
   Published, Failed) with thumbnail, caption, account, time; inline
   approve/skip/edit/delete.

Styled to match JARVIS holographic aesthetic (particle field, Framer Motion),
ARIA accent `#bd20ad`.

## External dependencies / gates

- **OpenAI API key** — for gpt-image-1 (Phases 2+).
- **Meta Developer app** + Facebook Page + long-lived Page access token +
  `pages_manage_posts` permission (app review) — Phase 4 only. This is the
  primary external-approval gate; Phases 1-3 do not depend on it.

## Out of scope (for now)

- Platforms beyond Facebook (X, LinkedIn, Instagram, TikTok) — architecture leaves
  room but they are separate integrations.
- Cloud/always-on hosting — local node-cron for now; revisit for true 24/7 posting.
- Engagement analytics beyond basic published/failed status.
