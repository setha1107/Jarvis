const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ override: true });
const { createClient } = require("@supabase/supabase-js");
const { buildPersonaPrompt, parsePersona } = require("./social/personas");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Calls Anthropic for persona text. Reuses the same key/endpoint as /api/chat.
async function generatePersona(input) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY missing from server environment");
  }
  const { system, user } = buildPersonaPrompt(input);
  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
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
  } catch (e) {
    const cause = e.cause ? ` (cause: ${e.cause.code || e.cause.message || e.cause})` : "";
    throw new Error(`Anthropic request failed: ${e.message}${cause}`);
  }
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || "Anthropic error");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return parsePersona(text);
}

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-paste-your-key-here") {
    return res.status(500).json({ error: "API key not found in .env file" });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;
    const isResearch = system && system.includes("Research Agent");
    const isMarketing = system && system.includes("ARIA");

    const requestBody = {
      model: (isResearch || isMarketing) ? "claude-sonnet-4-5-20250929" : model,
      max_tokens: isResearch ? 8000 : isMarketing ? 4000 : max_tokens,
      system,
      messages,
    };

    if (isResearch || isMarketing) {
      requestBody.tools = [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 10
      }];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05"
      },
      body: JSON.stringify(requestBody)
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      if (data.error) {
        console.error("Anthropic API error:", data.error);
        return res.status(response.status).json({ error: data.error.message || JSON.stringify(data.error) });
      }

      // Extract text blocks from content (handles web_search tool_use blocks)
      if (data.content && Array.isArray(data.content)) {
        const textParts = data.content
          .filter(b => b.type === "text")
          .map(b => b.text)
          .join("\n")
          .trim();
        if (textParts) {
          return res.json({ ...data, content: [{ type: "text", text: textParts }] });
        }
      }

      return res.json(data);
    } catch (e) {
      console.error("Raw response from Anthropic:", text);
      return res.status(500).json({ error: "Unexpected response: " + text.slice(0, 200) });
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

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

    if (error) return res.status(500).json({ error: "Supabase insert failed: " + error.message });
    res.json({ account: data });
  } catch (e) {
    console.error("POST /api/social/accounts error:", e);
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

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const SUPA_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

app.listen(3001, async () => {
  console.log("JARVIS API running at http://localhost:3001");
  console.log("  ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "loaded" : "MISSING");
  console.log("  SUPABASE URL:", SUPA_URL ? "loaded" : "MISSING");
  console.log("  SUPABASE KEY:", SUPA_KEY ? "loaded" : "MISSING");
  // Quick connectivity check so failures show at boot, not mid-request.
  try {
    const { error } = await supabaseAdmin.from("social_accounts").select("id").limit(1);
    if (error) console.log("  Supabase check: REACHED, but query error ->", error.message);
    else console.log("  Supabase check: OK (social_accounts table reachable)");
  } catch (e) {
    console.log("  Supabase check: CANNOT CONNECT ->", e.message,
      e.cause ? "(cause: " + (e.cause.code || e.cause.message) + ")" : "");
  }
});
