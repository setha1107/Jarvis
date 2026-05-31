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
