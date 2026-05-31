# ARIA Studio — Phase 1: Personalities & Data Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Seth create, store, edit, and delete social-media "personalities" (accounts), where ARIA auto-generates each personality's master prompt, bio, and content pillars, all managed from a new ARIA Studio dashboard under the Marketing Agent tab.

**Architecture:** Two Supabase tables (`social_accounts`, `social_posts`) plus a public storage bucket created via SQL. New Express endpoints under `/api/social/accounts` handle CRUD; the create endpoint calls Anthropic (via the existing chat plumbing) to generate the persona. A new self-contained React module `src/aria/` renders the ARIA Studio shell and the Personalities tab + create wizard, surfaced from the existing Marketing/Agents area.

**Tech Stack:** React (CRA), Express, Supabase JS, Anthropic API, Framer Motion, lucide-react.

**Testing approach:** This repo has no backend test harness. Each backend task is verified with concrete `curl` commands and expected JSON. Frontend tasks are verified with explicit UI-interaction checks. Commit after every task.

---

## File Structure

**Create:**
- `db/phase1_schema.sql` — SQL to create tables + storage bucket (run once in Supabase SQL editor).
- `social/personas.js` — backend helper: builds the ARIA persona-generation prompt and parses the result.
- `src/aria/AriaStudio.js` — top-level ARIA Studio component (tab shell).
- `src/aria/PersonalitiesTab.js` — grid of personality cards + entry point to the wizard.
- `src/aria/NewPersonalityWizard.js` — modal form to create a personality.
- `src/aria/ariaApi.js` — small client-side fetch wrappers for `/api/social/*`.
- `src/aria/aria.css` — styles for the studio (matches JARVIS aesthetic).

**Modify:**
- `server.js` — add the `/api/social/accounts` routes (GET/POST/PATCH/DELETE).
- `src/App.js` — add ARIA Studio as a view reachable from the Marketing context.

---

## Task 1: Database schema

**Files:**
- Create: `db/phase1_schema.sql`

- [ ] **Step 1: Write the schema SQL**

Create `db/phase1_schema.sql`:

```sql
-- ARIA Studio Phase 1 schema

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null default 'facebook',
  fb_page_id text,
  fb_access_token text,
  niche text,
  audience text,
  tone text,
  bio text,
  personality_prompt text,
  content_pillars jsonb default '[]'::jsonb,
  posting_frequency text default 'daily',
  optimal_times jsonb default '[]'::jsonb,
  auto_publish boolean default false,
  trust_count integer default 0,
  accent_color text default '#bd20ad',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references social_accounts(id) on delete cascade,
  source text default 'on_demand',
  prompt text,
  generated_text text,
  image_prompt text,
  image_url text,
  hashtags text,
  status text default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  fb_post_id text,
  error text,
  created_at timestamptz default now()
);

-- Public bucket for generated graphics (used in Phase 2)
insert into storage.buckets (id, name, public)
values ('social-images', 'social-images', true)
on conflict (id) do nothing;
```

- [ ] **Step 2: Apply it in Supabase**

Open Supabase dashboard -> SQL Editor -> paste the contents of `db/phase1_schema.sql` -> Run.
Expected: "Success. No rows returned." Then in Table Editor confirm `social_accounts` and
`social_posts` exist, and in Storage confirm a `social-images` bucket exists.

- [ ] **Step 3: Commit**

```bash
git add db/phase1_schema.sql
git commit -m "feat(aria): add Phase 1 Supabase schema for social accounts/posts"
```

---

## Task 2: Backend persona-generation helper

**Files:**
- Create: `social/personas.js`

- [ ] **Step 1: Write the helper**

Create `social/personas.js`:

```js
// Builds the prompt that asks ARIA to design a social-media personality,
// and parses the JSON it returns.

function buildPersonaPrompt({ name, platform, niche, audience, tone, posting_frequency }) {
  const system =
    "You are ARIA, an expert social media brand architect. Design a complete " +
    "account personality. Respond with ONLY a raw JSON object (no markdown, no preamble) " +
    "with exactly these keys: " +
    '"bio" (string, <=160 chars, the account bio), ' +
    '"personality_prompt" (string, a detailed system prompt that will be used to write ' +
    "every future post in this account's voice — describe voice, style, do/don'ts, emoji use), " +
    '"content_pillars" (array of 3-5 short topic strings), ' +
    '"optimal_times" (array of 2-3 "HH:MM" 24h strings best for this niche/platform).';

  const user =
    `Design a ${platform} account personality.\n` +
    `Name: ${name}\n` +
    `Niche: ${niche || "general"}\n` +
    `Audience: ${audience || "general"}\n` +
    `Tone/vibe: ${tone || "friendly and professional"}\n` +
    `Posting frequency: ${posting_frequency || "daily"}`;

  return { system, user };
}

// Anthropic may wrap JSON in prose; extract the first {...} block and parse it.
function parsePersona(text) {
  if (!text) throw new Error("Empty persona response");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in persona response");
  const obj = JSON.parse(text.slice(start, end + 1));
  return {
    bio: obj.bio || "",
    personality_prompt: obj.personality_prompt || "",
    content_pillars: Array.isArray(obj.content_pillars) ? obj.content_pillars : [],
    optimal_times: Array.isArray(obj.optimal_times) ? obj.optimal_times : [],
  };
}

module.exports = { buildPersonaPrompt, parsePersona };
```

- [ ] **Step 2: Verify it parses (Node one-liner)**

Run:

```bash
node -e "const {parsePersona}=require('./social/personas'); console.log(parsePersona('here you go {\"bio\":\"b\",\"personality_prompt\":\"p\",\"content_pillars\":[\"x\"],\"optimal_times\":[\"09:00\"]} done'))"
```

Expected output (object):
`{ bio: 'b', personality_prompt: 'p', content_pillars: [ 'x' ], optimal_times: [ '09:00' ] }`

- [ ] **Step 3: Commit**

```bash
git add social/personas.js
git commit -m "feat(aria): add persona prompt builder and parser"
```

---

## Task 3: Backend account routes

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add a Supabase service client + routes to `server.js`**

At the top of `server.js`, after the existing `require`s, add:

```js
const { createClient } = require("@supabase/supabase-js");
const { buildPersonaPrompt, parsePersona } = require("./social/personas");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Calls Anthropic for persona text. Reuses the same key/endpoint as /api/chat.
async function generatePersona(input) {
  const { system, user } = buildPersonaPrompt(input);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || "Anthropic error");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return parsePersona(text);
}
```

Then, anywhere after `app.use(express.json());` and before the catch-all `app.get("/{*path}", ...)`, add:

```js
// ---- ARIA Studio: social account routes ----

app.get("/api/social/accounts", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("social_accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ accounts: data });
});

app.post("/api/social/accounts", async (req, res) => {
  try {
    const { name, platform = "facebook", niche, audience, tone,
            posting_frequency = "daily", accent_color = "#bd20ad" } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const persona = await generatePersona({ name, platform, niche, audience, tone, posting_frequency });

    const { data, error } = await supabaseAdmin.from("social_accounts").insert({
      name, platform, niche, audience, tone, posting_frequency, accent_color,
      bio: persona.bio,
      personality_prompt: persona.personality_prompt,
      content_pillars: persona.content_pillars,
      optimal_times: persona.optimal_times,
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ account: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/social/accounts/:id", async (req, res) => {
  const allowed = ["name","niche","audience","tone","bio","personality_prompt",
                   "content_pillars","posting_frequency","optimal_times",
                   "auto_publish","accent_color","status","fb_page_id","fb_access_token"];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  const { data, error } = await supabaseAdmin
    .from("social_accounts").update(update).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ account: data });
});

app.delete("/api/social/accounts/:id", async (req, res) => {
  const { error } = await supabaseAdmin
    .from("social_accounts").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
```

- [ ] **Step 2: Start the server**

Run: `node server.js`
Expected: console prints `JARVIS API running at http://localhost:3001` and `API key loaded: YES`.

- [ ] **Step 3: Create an account via curl**

Run:

```bash
curl -s -X POST http://localhost:3001/api/social/accounts -H "Content-Type: application/json" -d "{\"name\":\"Bayou Eats\",\"niche\":\"Louisiana restaurants\",\"tone\":\"fun, local, mouth-watering\",\"posting_frequency\":\"daily\"}"
```

Expected: JSON `{ "account": { ... } }` where the account has a non-empty `bio`,
`personality_prompt`, and a `content_pillars` array of 3-5 items. (Requires
`ANTHROPIC_API_KEY` in `.env`.)

- [ ] **Step 4: List accounts via curl**

Run: `curl -s http://localhost:3001/api/social/accounts`
Expected: JSON `{ "accounts": [ { "name": "Bayou Eats", ... } ] }` containing the account just created.

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat(aria): add social account CRUD routes with ARIA persona generation"
```

---

## Task 4: Frontend API client

**Files:**
- Create: `src/aria/ariaApi.js`

- [ ] **Step 1: Write the fetch wrappers**

Create `src/aria/ariaApi.js`:

```js
const BASE = "/api/social";

export async function listAccounts() {
  const r = await fetch(`${BASE}/accounts`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.accounts || [];
}

export async function createAccount(payload) {
  const r = await fetch(`${BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.account;
}

export async function updateAccount(id, patch) {
  const r = await fetch(`${BASE}/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.account;
}

export async function deleteAccount(id) {
  const r = await fetch(`${BASE}/accounts/${id}`, { method: "DELETE" });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/aria/ariaApi.js
git commit -m "feat(aria): add client API wrappers for social accounts"
```

---

## Task 5: New Personality wizard

**Files:**
- Create: `src/aria/NewPersonalityWizard.js`

- [ ] **Step 1: Write the wizard component**

Create `src/aria/NewPersonalityWizard.js`:

```jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { createAccount } from "./ariaApi";

export default function NewPersonalityWizard({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", platform: "facebook", niche: "", audience: "",
    tone: "", posting_frequency: "daily",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setError("Give the account a name."); return; }
    setBusy(true); setError("");
    try {
      const account = await createAccount(form);
      onCreated(account);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <motion.div className="aria-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="aria-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div className="aria-modal-head">
          <span><Sparkles size={16} /> New Personality</span>
          <button className="aria-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="aria-form">
          <label>Account name
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Bayou Eats" />
          </label>
          <label>Platform
            <select value={form.platform} onChange={e => set("platform", e.target.value)}>
              <option value="facebook">Facebook</option>
            </select>
          </label>
          <label>Niche / topic
            <input value={form.niche} onChange={e => set("niche", e.target.value)} placeholder="e.g. Louisiana restaurants" />
          </label>
          <label>Audience
            <input value={form.audience} onChange={e => set("audience", e.target.value)} placeholder="e.g. local foodies 25-45" />
          </label>
          <label>Tone / vibe
            <input value={form.tone} onChange={e => set("tone", e.target.value)} placeholder="e.g. fun, local, mouth-watering" />
          </label>
          <label>Posting frequency
            <select value={form.posting_frequency} onChange={e => set("posting_frequency", e.target.value)}>
              <option value="daily">Daily</option>
              <option value="3x/week">3x / week</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          {error && <div className="aria-error">{error}</div>}
          <button className="aria-primary-btn" onClick={submit} disabled={busy}>
            {busy ? "ARIA is designing the persona..." : "Generate Personality"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/aria/NewPersonalityWizard.js
git commit -m "feat(aria): add New Personality wizard modal"
```

---

## Task 6: Personalities tab

**Files:**
- Create: `src/aria/PersonalitiesTab.js`

- [ ] **Step 1: Write the tab component**

Create `src/aria/PersonalitiesTab.js`:

```jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import { listAccounts, deleteAccount } from "./ariaApi";
import NewPersonalityWizard from "./NewPersonalityWizard";

export default function PersonalitiesTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setAccounts(await listAccounts()); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await deleteAccount(id);
    setAccounts(a => a.filter(x => x.id !== id));
  };

  return (
    <div className="aria-tab">
      <div className="aria-tab-actions">
        <button className="aria-primary-btn" onClick={() => setShowWizard(true)}>
          <Plus size={14} /> New Personality
        </button>
      </div>

      {loading ? (
        <div className="aria-empty">Loading personalities...</div>
      ) : accounts.length === 0 ? (
        <div className="aria-empty">No personalities yet. Create your first account above.</div>
      ) : (
        <div className="aria-card-grid">
          {accounts.map((a, i) => (
            <motion.div key={a.id} className="aria-persona-card"
              style={{ "--accent": a.accent_color || "#bd20ad" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="apc-top">
                <div className="apc-icon"><Users size={16} /></div>
                <div className="apc-title">
                  <div className="apc-name">{a.name}</div>
                  <div className="apc-niche">{a.niche || "general"} • {a.platform}</div>
                </div>
                <button className="aria-icon-btn" onClick={() => remove(a.id)}><Trash2 size={13} /></button>
              </div>
              <div className="apc-bio">{a.bio}</div>
              <div className="apc-pillars">
                {(a.content_pillars || []).map((p, j) => <span key={j} className="apc-pill">{p}</span>)}
              </div>
              <div className="apc-foot">
                <span className={`apc-badge${a.auto_publish ? " auto" : ""}`}>
                  {a.auto_publish ? "Auto-publish" : "Review first"}
                </span>
                <span className="apc-status">{a.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showWizard && (
        <NewPersonalityWizard
          onClose={() => setShowWizard(false)}
          onCreated={(acct) => setAccounts(a => [acct, ...a])}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/aria/PersonalitiesTab.js
git commit -m "feat(aria): add Personalities tab with persona cards"
```

---

## Task 7: ARIA Studio shell + styles

**Files:**
- Create: `src/aria/AriaStudio.js`
- Create: `src/aria/aria.css`

- [ ] **Step 1: Write the studio shell**

Create `src/aria/AriaStudio.js`:

```jsx
import { useState } from "react";
import { Megaphone } from "lucide-react";
import PersonalitiesTab from "./PersonalitiesTab";
import "./aria.css";

export default function AriaStudio() {
  // Composer and Queue tabs arrive in Phase 2/3; Phase 1 ships Personalities.
  const [tab, setTab] = useState("personalities");
  const tabs = [
    { id: "personalities", label: "Personalities" },
    { id: "composer", label: "Composer" },
    { id: "queue", label: "Queue" },
  ];
  return (
    <div className="aria-studio">
      <div className="aria-head">
        <div className="aria-head-icon"><Megaphone size={20} /></div>
        <div>
          <div className="aria-head-title">ARIA Studio</div>
          <div className="aria-head-sub">Automated social media command center</div>
        </div>
      </div>
      <div className="aria-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`aria-tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "personalities" && <PersonalitiesTab />}
      {tab === "composer" && <div className="aria-empty">Composer arrives in Phase 2.</div>}
      {tab === "queue" && <div className="aria-empty">Queue arrives in Phase 3.</div>}
    </div>
  );
}
```

- [ ] **Step 2: Write the styles**

Create `src/aria/aria.css`:

```css
.aria-studio { padding: 1.5rem; max-width: 1100px; margin: 0 auto; color: #e8e8f0; }
.aria-head { display: flex; align-items: center; gap: .8rem; margin-bottom: 1.2rem; }
.aria-head-icon { color: #bd20ad; border: 1px solid #bd20ad44; border-radius: 10px; padding: .5rem; }
.aria-head-title { font-size: 1.4rem; font-weight: 700; color: #bd20ad; }
.aria-head-sub { font-size: .85rem; color: #9a9ab0; }
.aria-tabs { display: flex; gap: .5rem; margin-bottom: 1.2rem; border-bottom: 1px solid #ffffff14; }
.aria-tab-btn { background: none; border: none; color: #9a9ab0; padding: .6rem 1rem; cursor: pointer; font-size: .9rem; border-bottom: 2px solid transparent; }
.aria-tab-btn.active { color: #bd20ad; border-bottom-color: #bd20ad; }
.aria-tab-actions { margin-bottom: 1rem; }
.aria-primary-btn { display: inline-flex; align-items: center; gap: .4rem; background: #bd20ad; color: #fff; border: none; border-radius: 8px; padding: .6rem 1rem; cursor: pointer; font-size: .88rem; }
.aria-primary-btn:disabled { opacity: .6; cursor: default; }
.aria-empty { padding: 2rem; text-align: center; color: #9a9ab0; }
.aria-error { color: #ff6b6b; font-size: .82rem; }
.aria-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.aria-persona-card { border: 1px solid var(--accent); border-radius: 12px; padding: 1rem; background: #0d0d18; }
.apc-top { display: flex; align-items: center; gap: .6rem; }
.apc-icon { color: var(--accent); }
.apc-title { flex: 1; }
.apc-name { font-weight: 600; }
.apc-niche { font-size: .78rem; color: #9a9ab0; }
.apc-bio { font-size: .85rem; color: #c8c8d8; margin: .7rem 0; }
.apc-pillars { display: flex; flex-wrap: wrap; gap: .3rem; }
.apc-pill { font-size: .72rem; background: var(--accent); color: #fff; border-radius: 20px; padding: .15rem .55rem; opacity: .85; }
.apc-foot { display: flex; justify-content: space-between; margin-top: .8rem; font-size: .75rem; }
.apc-badge { color: #ffb347; }
.apc-badge.auto { color: #00ff88; }
.apc-status { color: #9a9ab0; }
.aria-icon-btn { background: none; border: none; color: #9a9ab0; cursor: pointer; }
.aria-modal-overlay { position: fixed; inset: 0; background: #000a; display: flex; align-items: center; justify-content: center; z-index: 1000; }
.aria-modal { width: 440px; max-width: 92vw; background: #0d0d18; border: 1px solid #bd20ad55; border-radius: 14px; padding: 1.2rem; }
.aria-modal-head { display: flex; justify-content: space-between; align-items: center; color: #bd20ad; font-weight: 600; margin-bottom: 1rem; }
.aria-form { display: flex; flex-direction: column; gap: .7rem; }
.aria-form label { display: flex; flex-direction: column; gap: .25rem; font-size: .78rem; color: #9a9ab0; }
.aria-form input, .aria-form select { background: #15152a; border: 1px solid #ffffff1f; border-radius: 7px; padding: .5rem; color: #e8e8f0; font-size: .9rem; }
```

- [ ] **Step 3: Commit**

```bash
git add src/aria/AriaStudio.js src/aria/aria.css
git commit -m "feat(aria): add ARIA Studio shell and styling"
```

---

## Task 8: Surface ARIA Studio in the app

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Import AriaStudio**

In `src/App.js`, add near the other imports (after the `./supabase` import line):

```js
import AriaStudio from "./aria/AriaStudio";
```

- [ ] **Step 2: Add an "ARIA Studio" nav item**

In `src/App.js`, find the `navItems` array (around line 968) and add an entry after the "business" item:

```js
    { id: "aria", label: "ARIA Studio", Icon: Megaphone },
```

(`Megaphone` is already imported at the top of `App.js`.)

- [ ] **Step 3: Render the studio for that nav id**

In `src/App.js`, find the page-wrapper block that renders non-dashboard pages
(around line 1016, the run of `{activeNav === "business" && ...}` lines) and add:

```jsx
            {activeNav === "aria" && <AriaStudio />}
```

- [ ] **Step 4: Build and run**

Run: `npm run build`
Expected: `Compiled successfully.`

Then run: `node server.js` and open `http://localhost:3001`.

- [ ] **Step 5: Manual UI verification**

1. Click the **ARIA Studio** nav item. Expected: the studio header + Personalities/Composer/Queue tabs render.
2. Click **New Personality**, fill Name "Bayou Eats", niche "Louisiana restaurants", tone "fun, local", click **Generate Personality**.
   Expected: after a few seconds the modal closes and a new card appears showing an ARIA-written bio + 3-5 pillar chips + a "Review first" badge.
3. Refresh the page, return to ARIA Studio. Expected: the card persists (loaded from Supabase).
4. Click the trash icon on the card. Expected: the card disappears and stays gone after refresh.

- [ ] **Step 6: Commit**

```bash
git add src/App.js
git commit -m "feat(aria): surface ARIA Studio as a nav view"
```

---

## Task 9: Push Phase 1

- [ ] **Step 1: Push all commits**

```bash
git push
```

Expected: commits land on `origin/main`.

---

## Self-Review notes

- **Spec coverage (Phase 1 scope):** account create/edit/store/delete (Tasks 1,3,4,5,6,8),
  ARIA-generated personality_prompt/bio/content_pillars (Tasks 2,3), dashboard under
  Marketing/ARIA (Tasks 7,8), separate `src/aria/` module (all FE tasks). Scheduling,
  generation pipeline, and Facebook publishing are intentionally deferred to Phases 2-4.
- **New env var:** optional `SUPABASE_SERVICE_KEY` / `SUPABASE_URL`; code falls back to the
  existing `REACT_APP_SUPABASE_*` values so no new secret is strictly required for Phase 1.
- **Type consistency:** account fields used in FE cards (`bio`, `content_pillars`,
  `accent_color`, `auto_publish`, `status`, `niche`, `platform`) all exist in the Task 1 schema
  and are returned by the Task 3 routes.
