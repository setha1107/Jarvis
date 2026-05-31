export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (data.content && Array.isArray(data.content)) {
      const textParts = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("\n")
        .trim();

      if (textParts) {
        // If it looks like a JSON array that might be cut off, try to repair it
        let finalText = textParts;
        const jsonStart = textParts.indexOf("[");
        if (jsonStart !== -1) {
          let jsonStr = textParts.slice(jsonStart);
          // Try to parse as-is first
          try {
            JSON.parse(jsonStr);
          } catch(e) {
            // Try to repair truncated JSON by closing open structures
            // Remove trailing incomplete object
            const lastComplete = jsonStr.lastIndexOf("},");
            if (lastComplete !== -1) {
              jsonStr = jsonStr.slice(0, lastComplete + 1) + "]";
            } else {
              const lastBrace = jsonStr.lastIndexOf("}");
              if (lastBrace !== -1) {
                jsonStr = jsonStr.slice(0, lastBrace + 1) + "]";
              }
            }
            finalText = textParts.slice(0, jsonStart) + jsonStr;
          }
        }

        return res.status(200).json({
          ...data,
          content: [{ type: "text", text: finalText }]
        });
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message });
  }
}