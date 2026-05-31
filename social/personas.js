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
