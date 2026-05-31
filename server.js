const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

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

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(3001, () => {
  console.log("JARVIS API running at http://localhost:3001");
  console.log("API key loaded:", process.env.ANTHROPIC_API_KEY ? "YES" : "NO - check your .env file");
});
