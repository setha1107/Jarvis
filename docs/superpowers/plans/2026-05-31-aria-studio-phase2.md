# ARIA Studio — Phase 2: Content Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** From a personality + a prompt, ARIA writes a post in that account's voice (caption + hashtags + image prompt), generates a graphic with OpenAI gpt-image-1, stores it, and shows a preview in a new Composer tab — saved to the queue as `pending_review`.

**Architecture:** Two backend helpers (`social/content.js` for caption/hashtag/image-prompt generation, `social/images.js` for gpt-image-1 + Supabase Storage upload). Two new endpoints (`/api/social/generate`, `/api/social/autogenerate`). A new `ComposerTab.js` frontend. Image generation degrades gracefully if `OPENAI_API_KEY` is absent (caption still generated, image skipped).

**Tech Stack:** Express, Anthropic API, OpenAI Images API (gpt-image-1), Supabase JS + Storage.

**Testing:** Manual curl + UI checks with expected output (no backend test harness in repo).

---

## Task 1: Content-generation helper

**Files:** Create `social/content.js`

- [ ] **Step 1: Write helper**

```js
// Builds the prompt that turns a personality + a topic into a finished post,
// and parses the JSON ARIA returns.

function buildContentPrompt({ personality_prompt, topic }) {
  const system =
    (personality_prompt || "You are a skilled social media writer.") +
    "\n\nWrite ONE social media post about the user's topic, in the voice described above. " +
    "Respond with ONLY a raw JSON object (no markdown) with exactly these keys: " +
    '"caption" (the post text, ready to publish), ' +
    '"hashtags" (a single string of 3-6 space-separated hashtags), ' +
    '"image_prompt" (a vivid, detailed prompt for an AI image generator to create an ' +
    "eye-catching graphic for this post — describe scene, style, colors, mood).";
  const user = `Topic: ${topic}`;
  return { system, user };
}

function parseContent(text) {
  if (!text) throw new Error("Empty content response");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in content response");
  const obj = JSON.parse(text.slice(start, end + 1));
  return {
    caption: obj.caption || "",
    hashtags: obj.hashtags || "",
    image_prompt: obj.image_prompt || "",
  };
}

module.exports = { buildContentPrompt, parseContent };
```

- [ ] **Step 2: Verify parse**

Run: `node -e "const {parseContent}=require('./social/content'); console.log(parseContent('x {\"caption\":\"c\",\"hashtags\":\"#a #b\",\"image_prompt\":\"p\"} y'))"`
Expected: `{ caption: 'c', hashtags: '#a #b', image_prompt: 'p' }`

- [ ] **Step 3: Commit** — `git commit -m "feat(aria): add content-generation prompt builder/parser"`

---

## Task 2: Image-generation helper

**Files:** Create `social/images.js`

- [ ] **Step 1: Write helper**

```js
// Generates an image with OpenAI gpt-image-1 and uploads it to Supabase Storage.
// Returns a public URL, or null if no OPENAI_API_KEY (graceful skip).

async function generateAndStoreImage(supabaseAdmin, imagePrompt) {
  if (!process.env.OPENAI_API_KEY) return { url: null, skipped: "no OPENAI_API_KEY" };
  if (!imagePrompt) return { url: null, skipped: "no image prompt" };

  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "gpt-image-1", prompt: imagePrompt, size: "1024x1024", n: 1 }),
  });
  const data = await r.json();
  if (data.error) throw new Error("OpenAI image error: " + data.error.message);
  const b64 = data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) throw new Error("OpenAI returned no image data");

  const buffer = Buffer.from(b64, "base64");
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error: upErr } = await supabaseAdmin.storage
    .from("social-images")
    .upload(path, buffer, { contentType: "image/png", upsert: false });
  if (upErr) throw new Error("Storage upload failed: " + upErr.message);

  const { data: pub } = supabaseAdmin.storage.from("social-images").getPublicUrl(path);
  return { url: pub.publicUrl, skipped: null };
}

module.exports = { generateAndStoreImage };
```

- [ ] **Step 2: Syntax check** — `node --check social/images.js`
- [ ] **Step 3: Commit** — `git commit -m "feat(aria): add gpt-image-1 generation + Supabase Storage upload helper"`

---

## Task 3: Generation endpoints

**Files:** Modify `server.js`

- [ ] **Step 1:** Add requires near the other social requires:

```js
const { buildContentPrompt, parseContent } = require("./social/content");
const { generateAndStoreImage } = require("./social/images");
```

- [ ] **Step 2:** Add an Anthropic helper + the two endpoints (place before the catch-all `app.get("/{*path}"...)`):

```js
// Generate caption/hashtags/image_prompt for an account about a topic.
async function generatePostContent(account, topic) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
  const { system, user } = buildContentPrompt({ personality_prompt: account.personality_prompt, topic });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system, messages: [{ role: "user", content: user }] }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || "Anthropic error");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return parseContent(text);
}

async function createPost(account, topic, source) {
  const content = await generatePostContent(account, topic);
  let imageUrl = null, imageNote = null;
  try {
    const img = await generateAndStoreImage(supabaseAdmin, content.image_prompt);
    imageUrl = img.url; imageNote = img.skipped;
  } catch (e) {
    imageNote = e.message; // keep the post even if the image fails
  }
  const { data, error } = await supabaseAdmin.from("social_posts").insert({
    account_id: account.id, source,
    prompt: source === "on_demand" ? topic : null,
    generated_text: content.caption,
    image_prompt: content.image_prompt,
    image_url: imageUrl,
    hashtags: content.hashtags,
    status: "pending_review",
  }).select().single();
  if (error) throw new Error("Supabase insert failed: " + error.message);
  return { post: data, image_note: imageNote };
}

app.post("/api/social/generate", async (req, res) => {
  try {
    const { account_id, prompt } = req.body;
    if (!account_id || !prompt) return res.status(400).json({ error: "account_id and prompt are required" });
    const { data: account, error } = await supabaseAdmin.from("social_accounts").select("*").eq("id", account_id).single();
    if (error || !account) return res.status(404).json({ error: "account not found" });
    const result = await createPost(account, prompt, "on_demand");
    res.json(result);
  } catch (e) {
    console.error("POST /api/social/generate error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/social/autogenerate", async (req, res) => {
  try {
    const { account_id } = req.body;
    const { data: account, error } = await supabaseAdmin.from("social_accounts").select("*").eq("id", account_id).single();
    if (error || !account) return res.status(404).json({ error: "account not found" });
    const pillars = Array.isArray(account.content_pillars) ? account.content_pillars : [];
    const topic = pillars.length ? pillars[Math.floor(Math.random() * pillars.length)] : (account.niche || "an update");
    const result = await createPost(account, topic, "auto");
    res.json(result);
  } catch (e) {
    console.error("POST /api/social/autogenerate error:", e);
    res.status(500).json({ error: e.message });
  }
});
```

- [ ] **Step 3:** Syntax check — `node --check server.js`
- [ ] **Step 4:** Restart `node server.js`, then create a post via curl (replace ACCOUNT_ID with a real id from `GET /api/social/accounts`):

```bash
curl -s -X POST http://localhost:3001/api/social/generate -H "Content-Type: application/json" -d "{\"account_id\":\"ACCOUNT_ID\",\"prompt\":\"weekend special on crawfish etouffee\"}"
```

Expected: JSON `{ "post": { "generated_text": "...", "hashtags": "...", "image_url": "..."|null, "status": "pending_review" }, "image_note": ... }`. If you have no `OPENAI_API_KEY`, `image_url` is null and `image_note` is "no OPENAI_API_KEY" — caption still present.

- [ ] **Step 5:** Commit — `git commit -m "feat(aria): add generate/autogenerate endpoints (caption + image -> pending_review)"`

---

## Task 4: Composer frontend

**Files:** Modify `src/aria/ariaApi.js`; Create `src/aria/ComposerTab.js`; Modify `src/aria/AriaStudio.js`

- [ ] **Step 1:** Append to `src/aria/ariaApi.js`:

```js
export async function generatePost(account_id, prompt) {
  const r = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id, prompt }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d; // { post, image_note }
}
```

- [ ] **Step 2:** Create `src/aria/ComposerTab.js`:

```jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { listAccounts, generatePost } from "./ariaApi";

export default function ComposerTab() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    listAccounts().then(a => { setAccounts(a); if (a[0]) setAccountId(a[0].id); }).catch(e => setError(e.message));
  }, []);

  const generate = async () => {
    if (!accountId) { setError("Create a personality first."); return; }
    if (!prompt.trim()) { setError("Type a prompt."); return; }
    setBusy(true); setError(""); setResult(null);
    try { setResult(await generatePost(accountId, prompt)); }
    catch (e) { setError(e.message); }
    setBusy(false);
  };

  if (accounts.length === 0) {
    return <div className="aria-empty">No personalities yet. Create one in the Personalities tab first.</div>;
  }

  return (
    <div className="aria-tab">
      <div className="aria-composer-controls">
        <select className="aria-select" value={accountId} onChange={e => setAccountId(e.target.value)}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <textarea className="aria-textarea" placeholder="What should this post be about?" value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button className="aria-primary-btn" onClick={generate} disabled={busy}>
          <Sparkles size={14} /> {busy ? "Generating..." : "Generate Post"}
        </button>
        {error && <div className="aria-error">{error}</div>}
      </div>

      {result && result.post && (
        <motion.div className="aria-post-preview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          {result.post.image_url
            ? <img className="app-post-img" src={result.post.image_url} alt="post graphic" />
            : <div className="app-post-noimg">No image{result.image_note ? ` — ${result.image_note}` : ""}</div>}
          <div className="app-post-caption">{result.post.generated_text}</div>
          <div className="app-post-tags">{result.post.hashtags}</div>
          <div className="app-post-status">Saved as: {result.post.status}</div>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 3:** In `src/aria/AriaStudio.js`, import and render Composer. Replace the import block top and the composer placeholder line.

Add import: `import ComposerTab from "./ComposerTab";`
Replace `{tab === "composer" && <div className="aria-empty">Composer arrives in Phase 2.</div>}`
with `{tab === "composer" && <ComposerTab />}`

- [ ] **Step 4:** Append styles to `src/aria/aria.css`:

```css
.aria-composer-controls { display: flex; flex-direction: column; gap: .7rem; max-width: 640px; }
.aria-select, .aria-textarea { background: #15152a; border: 1px solid #ffffff1f; border-radius: 7px; padding: .6rem; color: #e8e8f0; font-size: .9rem; }
.aria-textarea { min-height: 90px; resize: vertical; }
.aria-post-preview { margin-top: 1.4rem; max-width: 540px; border: 1px solid #bd20ad44; border-radius: 14px; padding: 1rem; background: #0d0d18; }
.app-post-img { width: 100%; border-radius: 10px; display: block; }
.app-post-noimg { padding: 2rem; text-align: center; color: #9a9ab0; border: 1px dashed #ffffff22; border-radius: 10px; }
.app-post-caption { margin: .8rem 0 .4rem; color: #e8e8f0; white-space: pre-wrap; }
.app-post-tags { color: #bd20ad; font-size: .85rem; }
.app-post-status { margin-top: .6rem; font-size: .72rem; color: #ffb347; }
```

- [ ] **Step 5:** Build — `npm run build` → Expected `Compiled successfully.`
- [ ] **Step 6:** UI check — restart `node server.js`, open ARIA Studio → Composer tab → pick personality, type a prompt, Generate → a preview appears with caption + hashtags (+ image if OPENAI_API_KEY set).
- [ ] **Step 7:** Commit + push — `git commit -m "feat(aria): add Composer tab for prompt -> post generation"` then `git push`

---

## Self-Review notes
- **Spec coverage:** on-demand prompt -> styled post (Tasks 1,3,4); gpt-image-1 graphic + storage (Task 2,3); auto-generate from pillars (Task 3 autogenerate); preview in Composer (Task 4); saved to queue as pending_review (Task 3). Approval/scheduling is Phase 3.
- **New env:** `OPENAI_API_KEY` (optional — image gen degrades gracefully without it).
- **Type consistency:** `social_posts` fields written (generated_text, image_prompt, image_url, hashtags, status, source, prompt, account_id) all exist in Phase 1 schema.
