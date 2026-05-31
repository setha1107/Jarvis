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
