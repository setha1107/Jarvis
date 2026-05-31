# W AI Systems — JARVIS Hub v2
# Setup Guide (5 minutes)

## Step 1 — Add your API key

1. Find the file called `.env.example` in this folder
2. Rename it to `.env` (just remove the `.example` part)
3. Open `.env` and replace `sk-ant-paste-your-key-here` with your actual Anthropic API key
4. Save it

Your `.env` file should look like this:
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx

Never share this file or commit it to GitHub. It's already in .gitignore.

---

## Step 2 — Install dependencies

Open a terminal in this folder and run:

   npm install

---

## Step 3 — Install Vercel CLI (one time only)

   npm install -g vercel

---

## Step 4 — Run the hub

   vercel dev

This starts everything at http://localhost:3000
The backend API runs automatically — no CORS errors.

---

## Step 5 — Deploy live to Vercel (optional)

1. Push this folder to a GitHub repo
2. Go to vercel.com and import the repo
3. In Vercel dashboard → Settings → Environment Variables
4. Add: ANTHROPIC_API_KEY = your key
5. Deploy — your hub is live at https://your-project.vercel.app

---

## Troubleshooting

"vercel: command not found"
→ Run: npm install -g vercel

Hub loads but JARVIS doesn't respond
→ Check your .env file has the correct key with no spaces
→ Make sure you used: vercel dev (not npm start)

Still not working?
→ Open browser DevTools (F12) → Console tab → look for red errors
