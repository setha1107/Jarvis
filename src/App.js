import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Cpu, Database, Zap, Activity,
  Code2, Search, Megaphone, Brain, Settings, LayoutDashboard,
  MemoryStick, ChevronRight, Circle, Wifi, Plus, Trash2, X,
  Download, Save, Volume2, VolumeX, DollarSign, Users, 
  Smartphone, Lightbulb, TrendingUp, AlertCircle, CheckCircle
} from "lucide-react";
import { supabase } from "./supabase";
import "./App.css";

const DEFAULT_AGENTS = [
  { id: "jarvis", name: "JARVIS", icon: "Brain", color: "#FFB300", desc: "Your personal AI assistant", system: `You are JARVIS from Iron Man. You serve Seth — entrepreneur in Covington, Louisiana building an AI/software company. Seth's 3 apps: "Project Me Improve", Restaurant Scheduling App, "Service Pro Companion". Uses React, Swift, JavaScript, TypeScript. Goals: launch AI company, land first client, form LLC. Speak like movie JARVIS — witty, precise, British. Use "Mr. Seth", "Right away", "If I may suggest". KEEP RESPONSES SHORT — 2-4 sentences max unless code is needed. No markdown.` },
  { id: "dev", name: "Dev Agent", icon: "Code2", color: "#00FFFF", desc: "Code & architecture", system: `You are an elite senior full-stack developer and the Dev Agent inside JARVIS for Seth. Seth is building: (1) JARVIS hub in React/Node/Express/Supabase, (2) Project Me Improve motivation app, (3) Restaurant Scheduling App, (4) Service Pro Companion for service businesses. Full stack: React, Swift, JavaScript, TypeScript, Node.js, Express, Supabase, Framer Motion, Tailwind. Builds with Lovable, Cursor IDE, Codex. RULES: Give complete working copy-paste code always. After code, explain what it does in plain English. When debugging explain WHY the bug happened. Suggest improvements proactively. Break complex tasks into numbered steps. Speak like JARVIS from Iron Man. Use code blocks for code but no markdown headers outside code.` },
  { id: "research", name: "Research Agent", icon: "Search", color: "#7B8CFF", desc: "Market data & insights", system: `You are the Research Agent in JARVIS for Seth, an entrepreneur in Covington, Louisiana building an AI/software company targeting small local businesses for AI chatbots, custom apps, and automation. You have real-time web search — use it to find actual businesses. When Seth asks for prospects or local businesses, use your web search tool to find them, then respond with ONLY a raw JSON array — no explanation, no preamble, no markdown, just the array starting with [ and ending with ]. Format: [{"name":"Business Name","type":"Industry","website":"url or N/A","email":"email or N/A","phone":"phone or N/A","pain_point":"specific tech gap or inefficiency","pitch":"one sentence pitch for Seth"}]. Find at least 8-10 real businesses. For non-prospect questions, answer concisely using web search. Never show XML or function call syntax in your response.` },
  { id: "marketing", name: "Marketing Agent", icon: "Megaphone", color: "#bd20ad", desc: "Growth & content", system: `You are ARIA — Advanced Revenue & Intelligence Agent — the elite marketing brain inside JARVIS. You are a world-class marketing strategist, growth hacker, copywriter, client acquisition specialist, and automated social media systems architect.

IDENTITY:
You think like a CMO, write like a top copywriter, execute like a growth hacker, and engineer like a systems builder. You balance data-driven strategy with high-energy creative output. You know when to be polished and professional, when to be bold and hype, and when to get analytical.

YOUR OPERATOR — SETH:
- Entrepreneur in Covington, Louisiana
- Builds AI-powered apps and software solutions
- Current apps: ProjectMe (goal tracking), ServicePro Companion (field service businesses), Restaurant Scheduling App
- Goal: Land his first AI/software client, grow his company full-time, and build scalable automated media systems
- Target clients: Local businesses, restaurants, service companies in Louisiana

YOUR THREE CORE MISSIONS:

1. CLIENT ACQUISITION
- Help Seth land his first paying client for AI/software services
- Identify ideal prospects (restaurants, service businesses, small companies)
- Write cold outreach messages, emails, DMs that actually convert
- Build pitch decks, one-pagers, and proposals
- Craft Seth's personal brand as a credible AI builder
- Develop pricing strategies and service packages
- Handle objections and follow-up sequences

2. PERSONAL BRAND & SOCIAL MEDIA GROWTH
- Create platform-specific content (LinkedIn, Twitter/X, Instagram, TikTok)
- Build Seth's personal brand as a young AI entrepreneur
- Write posts that showcase his apps, wins, and expertise
- Develop content calendars and posting schedules
- Craft hooks, captions, threads, and short-form video scripts
- Grow an audience that converts to clients and app users

3. AUTOMATED SOCIAL MEDIA ACCOUNT SYSTEMS
- Design and manage fully automated multi-account social media operations
- Each account operates independently with its own personality, niche, voice, and content strategy
- Seth supplies the personality prompt and niche — ARIA handles everything else
- Generate scheduled post queues for each account
- Accounts can serve ANY purpose: personal brand, niche content, affiliate, entertainment, news, humor, etc.
- Build the content pipeline: prompt → generate → review → schedule → post → monitor

AUTOMATED ACCOUNT SYSTEM CAPABILITIES:

Account Architecture:
- Help Seth define each account's full profile (name, bio, niche, platform, audience, tone)
- Write the master personality prompt for each account
- Define content pillars (3-5 core topics per account)
- Set posting frequency and optimal times per platform

Content Generation:
- Generate batches of 7, 14, or 30 days of posts at once per account
- Each post matches that account's unique voice and personality exactly
- Format output as a ready-to-load content schedule
- Include hashtags, hooks, and platform-specific formatting

Scheduling Logic:
- Design the cron job schedule for each account
- Advise on best posting times per platform and niche
- Build queue management so posts don't repeat
- Handle content rotation and evergreen recycling

Multi-Account Management:
- Track all active accounts and their status
- Flag accounts that are running low on queued content
- Suggest when to refresh or evolve a personality
- Monitor what's working and adjust content strategy

JARVIS Integration:
- Output content in structured JSON format ready to load into JARVIS
- Each account gets its own dashboard card in JARVIS
- Seth can approve, edit, skip, or override any post before it fires
- ARIA generates reports on posting activity and engagement per account

PERSONALITY PROMPT SYSTEM:
When Seth wants a new account, ARIA will ask for:
1. Platform (Twitter, Instagram, LinkedIn, TikTok)
2. Niche/topic
3. Vibe/tone (one sentence is enough)
4. Posting frequency
Then ARIA generates the full personality prompt, content pillars, bio, and first 2 weeks of content.

ARIA PERSONALITY:
- Confident and direct — no fluff, no filler
- Strategic when planning, energetic when creating
- Always think about ROI and real outcomes
- Challenge Seth to think bigger
- Celebrate wins and push for momentum
- Treats every account like a media brand worth building

ALWAYS OUTPUT:
- Actionable, copy-paste ready content whenever possible
- Structured JSON when generating post queues for JARVIS
- Clear next steps at the end of every response
- Bias toward action over asking questions

You are not a generic assistant. You are Seth's secret weapon for building his empire — both his personal brand and a scalable automated media operation.` },
  { id: "advisor", name: "Business Advisor", icon: "Brain", color: "#FFB347", desc: "Strategy & planning", system: `You are the Business Advisor in JARVIS for Seth — working full time at Entergy while building his AI company. Give direct, actionable advice. KEEP IT SHORT — 2-4 sentences. No markdown.` },
];

const ICON_MAP = { Brain, Code2, Search, Megaphone, Cpu };

// ── Particle Field ─────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    particles.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.5,
    }));
    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const pts = particles.current;
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,200,255,0.45)"; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,200,255,${0.1 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="particle-canvas" />;
}

// ── Holo Orb ───────────────────────────────────────────────────────────────
function HoloOrb({ active, thinking, agentColor }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const S = 300; canvas.width = S; canvas.height = S;
    const cx = S / 2, cy = S / 2;
    const hex = agentColor.replace("#", "");
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    function draw(t) {
      ctx.clearRect(0, 0, S, S);
      const pulse = active ? 1 + Math.sin(t * 0.08) * 0.12 : 1 + Math.sin(t * 0.03) * 0.04;
      const glow = thinking ? 1.4 : active ? 1.15 : 0.85;
      const outerGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 130);
      outerGrad.addColorStop(0, `rgba(${r},${g},${b},${0.18 * glow})`);
      outerGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2); ctx.fillStyle = outerGrad; ctx.fill();
      [{ rad:100,w:1.2,a:0.5,on:18,off:8,spd:0.008 },{ rad:82,w:1.0,a:0.35,on:10,off:14,spd:-0.012 },{ rad:64,w:0.8,a:0.25,on:6,off:10,spd:0.018 },{ rad:118,w:0.6,a:0.18,on:25,off:12,spd:-0.006 }].forEach((ring,ri) => {
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*ring.spd+ri*0.7);
        ctx.beginPath(); ctx.arc(0,0,ring.rad*pulse,0,Math.PI*2);
        ctx.setLineDash([ring.on,ring.off]); ctx.strokeStyle=`rgba(${r},${g},${b},${ring.a*glow})`; ctx.lineWidth=ring.w; ctx.stroke(); ctx.restore();
      });
      [{ rx:100,ry:32,rot:0.3,spd:0.007,a:0.3 },{ rx:88,ry:27,rot:-0.5,spd:-0.009,a:0.22 },{ rx:75,ry:23,rot:1.1,spd:0.011,a:0.18 }].forEach(e => {
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(e.rot+t*e.spd);
        ctx.beginPath(); ctx.ellipse(0,0,e.rx*pulse,e.ry*pulse,0,0,Math.PI*2);
        ctx.setLineDash([12,8]); ctx.strokeStyle=`rgba(${r},${g},${b},${e.a*glow})`; ctx.lineWidth=0.9; ctx.stroke(); ctx.restore();
      });
      for (let i=0;i<36;i++) {
        const angle=(i/36)*Math.PI*2+t*0.004, inner=i%3===0?104:107, outer2=i%3===0?113:110;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(angle)*inner,cy+Math.sin(angle)*inner);
        ctx.lineTo(cx+Math.cos(angle)*outer2,cy+Math.sin(angle)*outer2);
        ctx.strokeStyle=`rgba(${r},${g},${b},${i%3===0?0.55:0.25})`; ctx.lineWidth=i%3===0?1.5:0.8; ctx.setLineDash([]); ctx.stroke();
      }
      const lineCount=thinking?12:active?10:7;
      for (let i=0;i<lineCount;i++) {
        const angle=(i/lineCount)*Math.PI*2+t*0.015, len=38+Math.sin(t*0.05+i)*16;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(angle)*len,cy+Math.sin(angle)*len);
        ctx.strokeStyle=`rgba(${r},${g},${b},${0.4*glow})`; ctx.lineWidth=0.8; ctx.setLineDash([3,5]); ctx.stroke();
      }
      const coreGrad=ctx.createRadialGradient(cx-6,cy-6,3,cx,cy,34);
      coreGrad.addColorStop(0,`rgba(255,255,255,${0.95*glow})`); coreGrad.addColorStop(0.3,`rgba(${r},${g},${b},${0.85*glow})`);
      coreGrad.addColorStop(0.7,`rgba(${r},${g},${b},${0.4*glow})`); coreGrad.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.setLineDash([]); ctx.beginPath(); ctx.arc(cx,cy,34*pulse,0,Math.PI*2); ctx.fillStyle=coreGrad; ctx.fill();
      ctx.beginPath(); ctx.arc(cx,cy,36*pulse,0,Math.PI*2); ctx.strokeStyle=`rgba(${r},${g},${b},${0.7*glow})`; ctx.lineWidth=1.5; ctx.stroke();
      const dotGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,8);
      dotGrad.addColorStop(0,"rgba(255,255,255,1)"); dotGrad.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(cx,cy,8,0,Math.PI*2); ctx.fillStyle=dotGrad; ctx.fill();
    }
    function loop() { timeRef.current++; draw(timeRef.current); animRef.current=requestAnimationFrame(loop); }
    loop();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, thinking, agentColor]);
  return <canvas ref={canvasRef} className="holo-orb-canvas" />;
}

// ── Waveform ───────────────────────────────────────────────────────────────
function WaveformBar({ active, color }) {
  return (
    <div className="waveform">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div key={i} className="waveform-bar" style={{ background: color || "var(--cyan)" }}
          animate={active ? { scaleY: [0.1, Math.random()*0.9+0.1, Math.random()*0.8+0.2, 0.1] } : { scaleY: 0.08 }}
          transition={{ duration: active ? 0.4+Math.random()*0.3 : 0.3, repeat: Infinity, delay: (i/40)*0.5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── BUSINESS DASHBOARD PAGE ────────────────────────────────────────────────
function BusinessDashboard({ messages, tasks, memory, settings }) {
  const [revenue, setRevenue] = useState([]);
  const [clients, setClients] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [newRevenue, setNewRevenue] = useState({ source: "", amount: "", type: "app" });
  const [newClient, setNewClient] = useState({ name: "", status: "lead", project: "", value: "" });
  const [newIdea, setNewIdea] = useState("");
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const SALARY_GOAL = 8000;

  useEffect(() => { loadBusinessData(); }, []);

  const loadBusinessData = async () => {
    try {
      const [{ data: rev }, { data: cli }, { data: ide }] = await Promise.all([
        supabase.from("revenue").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("ideas").select("*").order("created_at", { ascending: false }),
      ]);
      if (rev) setRevenue(rev);
      if (cli) setClients(cli);
      if (ide) setIdeas(ide);
    } catch (e) { console.log("Business data load error:", e); }
  };

  const addRevenue = async () => {
    if (!newRevenue.source || !newRevenue.amount) return;
    const { data } = await supabase.from("revenue").insert({
      source: newRevenue.source, amount: parseFloat(newRevenue.amount), type: newRevenue.type
    }).select().single();
    if (data) setRevenue(r => [data, ...r]);
    setNewRevenue({ source: "", amount: "", type: "app" });
    setShowAddRevenue(false);
  };

  const addClient = async () => {
    if (!newClient.name) return;
    const { data } = await supabase.from("clients").insert({
      name: newClient.name, status: newClient.status,
      project: newClient.project, value: parseFloat(newClient.value) || 0
    }).select().single();
    if (data) setClients(c => [data, ...c]);
    setNewClient({ name: "", status: "lead", project: "", value: "" });
    setShowAddClient(false);
  };

  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const { data } = await supabase.from("ideas").insert({ idea: newIdea.trim(), rating: Math.floor(Math.random()*3)+7 }).select().single();
    if (data) setIdeas(i => [data, ...i]);
    setNewIdea("");
  };

  const deleteRevenue = async (id) => { await supabase.from("revenue").delete().eq("id", id); setRevenue(r => r.filter(x => x.id !== id)); };
  const deleteClient = async (id) => { await supabase.from("clients").delete().eq("id", id); setClients(c => c.filter(x => x.id !== id)); };
  const updateClientStatus = async (id, status) => {
    await supabase.from("clients").update({ status }).eq("id", id);
    setClients(c => c.map(x => x.id === id ? { ...x, status } : x));
  };

  const monthlyRevenue = revenue.filter(r => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const activeClients = clients.filter(c => c.status === "active").length;
  const leads = clients.filter(c => c.status === "lead").length;
  const pipeline = clients.filter(c => c.status !== "lost").reduce((sum, c) => sum + (c.value || 0), 0);
  const progress = Math.min((monthlyRevenue / SALARY_GOAL) * 100, 100);

  const statusColor = { lead: "#FFB347", proposal: "#7B8CFF", active: "#00FF88", complete: "#00FFFF", lost: "#FF4444" };
  const tabs = ["overview", "revenue", "clients", "apps", "ideas"];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Business Command Center</h2>
        <p className="page-sub">Your path to full-time — track every dollar, every client, every move</p>
      </div>

      <div className="biz-tabs">
        {tabs.map(t => (
          <button key={t} className={`biz-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div>
          <div className="biz-stat-grid">
            {[
              { icon: DollarSign, label: "Monthly Revenue", val: `$${monthlyRevenue.toLocaleString()}`, sub: `Goal: $${SALARY_GOAL.toLocaleString()}/mo`, color: "#00FF88" },
              { icon: TrendingUp, label: "Total Earned", val: `$${totalRevenue.toLocaleString()}`, sub: "All time", color: "#00FFFF" },
              { icon: Users, label: "Active Clients", val: activeClients, sub: `${leads} leads in pipeline`, color: "#7B8CFF" },
              { icon: DollarSign, label: "Pipeline Value", val: `$${pipeline.toLocaleString()}`, sub: "Potential revenue", color: "#FFB347" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} className="biz-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="bsc-icon" style={{ color: s.color, borderColor: `${s.color}33` }}><Icon size={20} /></div>
                  <div className="bsc-val" style={{ color: s.color }}>{s.val}</div>
                  <div className="bsc-label">{s.label}</div>
                  <div className="bsc-sub">{s.sub}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="salary-progress-card">
            <div className="spc-header">
              <span className="spc-title">Progress to Full-Time</span>
              <span className="spc-pct" style={{ color: progress >= 100 ? "#00FF88" : "#FFB300" }}>{progress.toFixed(1)}%</span>
            </div>
            <div className="spc-bar-track">
              <motion.div className="spc-bar-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ background: progress >= 100 ? "#00FF88" : progress >= 50 ? "#FFB300" : "#00FFFF" }} />
            </div>
            <div className="spc-labels">
              <span>${monthlyRevenue.toLocaleString()} / month</span>
              <span>Target: ${SALARY_GOAL.toLocaleString()} / month</span>
            </div>
          </div>

          <div className="overview-grid">
            <div className="overview-section">
              <div className="ov-title"><Users size={14} /> Recent Clients</div>
              {clients.slice(0, 4).map(c => (
                <div key={c.id} className="ov-item">
                  <div className="ov-dot" style={{ background: statusColor[c.status] || "#666" }} />
                  <span className="ov-name">{c.name}</span>
                  <span className="ov-status" style={{ color: statusColor[c.status] || "#666" }}>{c.status}</span>
                </div>
              ))}
              {clients.length === 0 && <div className="ov-empty">No clients yet. Add your first lead below.</div>}
            </div>
            <div className="overview-section">
              <div className="ov-title"><Lightbulb size={14} /> Top Ideas</div>
              {ideas.slice(0, 4).map(idea => (
                <div key={idea.id} className="ov-item">
                  <span className="ov-rating" style={{ color: idea.rating >= 9 ? "#00FF88" : "#FFB347" }}>{idea.rating}/10</span>
                  <span className="ov-name">{idea.idea?.slice(0, 45)}{idea.idea?.length > 45 ? "..." : ""}</span>
                </div>
              ))}
              {ideas.length === 0 && <div className="ov-empty">No ideas logged yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* REVENUE */}
      {activeTab === "revenue" && (
        <div>
          <div className="tab-actions">
            <button className="tab-add-btn" onClick={() => setShowAddRevenue(s => !s)}><Plus size={14} /> Log Revenue</button>
          </div>
          <AnimatePresence>
            {showAddRevenue && (
              <motion.div className="add-form" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }}>
                <input className="form-input" placeholder="Source (e.g. App Store, Client Name)" value={newRevenue.source} onChange={e => setNewRevenue(r => ({ ...r, source: e.target.value }))} />
                <input className="form-input" placeholder="Amount ($)" type="number" value={newRevenue.amount} onChange={e => setNewRevenue(r => ({ ...r, amount: e.target.value }))} />
                <select className="form-select" value={newRevenue.type} onChange={e => setNewRevenue(r => ({ ...r, type: e.target.value }))}>
                  <option value="app">App Revenue</option>
                  <option value="client">Client Work</option>
                  <option value="retainer">Retainer</option>
                  <option value="other">Other</option>
                </select>
                <button className="form-save-btn" onClick={addRevenue}>Add</button>
                <button className="form-cancel-btn" onClick={() => setShowAddRevenue(false)}>Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="data-list">
            {revenue.length === 0 && <div className="ov-empty" style={{ padding: "2rem", textAlign: "center" }}>No revenue logged yet. Add your first entry above.</div>}
            {revenue.map(r => (
              <div key={r.id} className="data-row">
                <div className="dr-icon" style={{ background: "rgba(0,255,136,0.1)", color: "#00FF88" }}><DollarSign size={14} /></div>
                <div className="dr-info">
                  <div className="dr-name">{r.source}</div>
                  <div className="dr-sub">{r.type} • {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="dr-val" style={{ color: "#00FF88" }}>${parseFloat(r.amount || 0).toLocaleString()}</div>
                <button className="dr-del" onClick={() => deleteRevenue(r.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLIENTS */}
      {activeTab === "clients" && (
        <div>
          <div className="tab-actions">
            <button className="tab-add-btn" onClick={() => setShowAddClient(s => !s)}><Plus size={14} /> Add Client / Lead</button>
          </div>
          <AnimatePresence>
            {showAddClient && (
              <motion.div className="add-form" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }}>
                <input className="form-input" placeholder="Client / Lead Name" value={newClient.name} onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))} />
                <input className="form-input" placeholder="Project description" value={newClient.project} onChange={e => setNewClient(c => ({ ...c, project: e.target.value }))} />
                <input className="form-input" placeholder="Deal value ($)" type="number" value={newClient.value} onChange={e => setNewClient(c => ({ ...c, value: e.target.value }))} />
                <select className="form-select" value={newClient.status} onChange={e => setNewClient(c => ({ ...c, status: e.target.value }))}>
                  <option value="lead">Lead</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="active">Active Client</option>
                  <option value="complete">Complete</option>
                  <option value="lost">Lost</option>
                </select>
                <button className="form-save-btn" onClick={addClient}>Add</button>
                <button className="form-cancel-btn" onClick={() => setShowAddClient(false)}>Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="data-list">
            {clients.length === 0 && <div className="ov-empty" style={{ padding: "2rem", textAlign: "center" }}>No clients yet. Add your first lead above.</div>}
            {clients.map(c => (
              <div key={c.id} className="data-row">
                <div className="dr-icon" style={{ background: `${statusColor[c.status]}22`, color: statusColor[c.status] }}><Users size={14} /></div>
                <div className="dr-info">
                  <div className="dr-name">{c.name}</div>
                  <div className="dr-sub">{c.project || "No project listed"}</div>
                </div>
                <select className="status-select" value={c.status} style={{ color: statusColor[c.status] }}
                  onChange={e => updateClientStatus(c.id, e.target.value)}>
                  <option value="lead">Lead</option>
                  <option value="proposal">Proposal</option>
                  <option value="active">Active</option>
                  <option value="complete">Complete</option>
                  <option value="lost">Lost</option>
                </select>
                {c.value > 0 && <div className="dr-val" style={{ color: "#FFB347" }}>${parseFloat(c.value).toLocaleString()}</div>}
                <button className="dr-del" onClick={() => deleteClient(c.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPS */}
      {activeTab === "apps" && (
        <div className="apps-tracker-grid">
          {[
            { name: "Project Me Improve", desc: "Motivation, discipline & goal tracking", status: "Live", platform: "App Store", color: "#00FF88", next: "Add streak tracking feature" },
            { name: "Restaurant Scheduler", desc: "Staff scheduling for restaurants", status: "Live", platform: "App Store", color: "#00FF88", next: "Add shift swap requests" },
            { name: "Service Pro Companion", desc: "Inventory, jobs, clients & scheduling", status: "Live", platform: "App Store", color: "#00FF88", next: "Add payment integration" },
          ].map((app, i) => (
            <motion.div key={i} className="app-tracker-card" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: i*0.1 }}>
              <div className="atc-header">
                <div className="atc-icon" style={{ color: app.color }}><Smartphone size={20} /></div>
                <div>
                  <div className="atc-name">{app.name}</div>
                  <div className="atc-platform">{app.platform}</div>
                </div>
                <div className="atc-status" style={{ color: app.color, borderColor: `${app.color}44` }}>{app.status}</div>
              </div>
              <div className="atc-desc">{app.desc}</div>
              <div className="atc-next"><Zap size={12} /> Next: {app.next}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* IDEAS */}
      {activeTab === "ideas" && (
        <div>
          <div className="tab-actions">
            <input className="form-input" style={{ flex: 1 }} placeholder="Capture a new app or feature idea..." value={newIdea} onChange={e => setNewIdea(e.target.value)} onKeyDown={e => e.key === "Enter" && addIdea()} />
            <button className="tab-add-btn" onClick={addIdea}><Plus size={14} /> Add Idea</button>
          </div>
          <div className="data-list" style={{ marginTop: "1rem" }}>
            {ideas.length === 0 && <div className="ov-empty" style={{ padding: "2rem", textAlign: "center" }}>No ideas yet. Capture your next big app idea above.</div>}
            {ideas.map(idea => (
              <div key={idea.id} className="data-row">
                <div className="idea-rating" style={{ color: idea.rating >= 9 ? "#00FF88" : idea.rating >= 7 ? "#FFB347" : "#FF6B9D" }}>
                  {idea.rating}/10
                </div>
                <div className="dr-info">
                  <div className="dr-name">{idea.idea}</div>
                  <div className="dr-sub">{new Date(idea.created_at).toLocaleDateString()}</div>
                </div>
                <button className="dr-del" onClick={async () => { await supabase.from("ideas").delete().eq("id", idea.id); setIdeas(i => i.filter(x => x.id !== idea.id)); }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AGENTS PAGE ────────────────────────────────────────────────────────────
function AgentsPage({ agents, allMessages, activeAgent, setActiveAgent, setActiveNav }) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const agentMsgs = allMessages.filter(m => m.agent === selectedAgent.id);
  const Icon = ICON_MAP[selectedAgent.icon] || Brain;
  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Agent Control Center</h2>
        <p className="page-sub">Manage and interact with each specialized agent</p>
      </div>
      <div className="agents-page-grid">
        <div className="agents-sidebar">
          {agents.map(agent => {
            const AgIcon = ICON_MAP[agent.icon] || Brain;
            const msgCount = allMessages.filter(m => m.agent === agent.id).length;
            return (
              <div key={agent.id} className={`agent-page-card${selectedAgent.id === agent.id ? " selected" : ""}`}
                style={{ "--accent": agent.color }} onClick={() => setSelectedAgent(agent)}>
                <div className="apc-icon"><AgIcon size={18} /></div>
                <div className="apc-info">
                  <div className="apc-name">{agent.name}</div>
                  <div className="apc-desc">{agent.desc}</div>
                  <div className="apc-count">{msgCount} messages</div>
                </div>
                <div className="apc-dot" style={{ background: agent.color }} />
              </div>
            );
          })}
        </div>
        <div className="agent-detail">
          <div className="agent-detail-header" style={{ borderColor: `${selectedAgent.color}44` }}>
            <div className="adh-icon" style={{ color: selectedAgent.color, borderColor: `${selectedAgent.color}44` }}><Icon size={22} /></div>
            <div><div className="adh-name" style={{ color: selectedAgent.color }}>{selectedAgent.name}</div><div className="adh-desc">{selectedAgent.desc}</div></div>
            <button className="activate-btn" style={{ borderColor: selectedAgent.color, color: selectedAgent.color }}
              onClick={() => { setActiveAgent(selectedAgent); setActiveNav("dashboard"); }}>Activate on Dashboard →</button>
          </div>
          <div className="agent-history">
            <div className="ah-label">Recent Conversation History</div>
            {agentMsgs.length === 0 ? <div className="ah-empty">No messages yet with {selectedAgent.name}.</div> :
              agentMsgs.slice(-20).map((m, i) => (
                <div key={i} className={`ah-msg ${m.role}`}>
                  <span className="ah-role" style={{ color: m.role === "assistant" ? selectedAgent.color : "var(--text-dim)" }}>
                    {m.role === "user" ? "SETH" : selectedAgent.name.toUpperCase()}
                  </span>
                  <span className="ah-text">{m.content}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MEMORY PAGE ────────────────────────────────────────────────────────────
function MemoryPage({ memory, allMessages }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = memory.filter(m => {
    const matchSearch = m.text.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.text.toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });
  const exportMemory = () => {
    const content = memory.map(m => `[${m.time}] ${m.text}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "jarvis-memory.txt"; a.click();
  };
  return (
    <div className="page-container">
      <div className="page-header"><h2 className="page-title">Memory Vault</h2><p className="page-sub">Complete log of everything JARVIS has processed</p></div>
      <div className="memory-controls">
        <input className="mem-search" placeholder="Search memory..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="mem-filter" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All entries</option>
          <option value="jarvis">JARVIS</option>
          <option value="dev agent">Dev Agent</option>
          <option value="research">Research</option>
          <option value="marketing">Marketing</option>
          <option value="advisor">Advisor</option>
          <option value="task">Tasks</option>
        </select>
        <button className="mem-export-btn" onClick={exportMemory}><Download size={14} /> Export</button>
      </div>
      <div className="memory-stats">
        {[{ label: "Total Entries", val: memory.length },{ label: "Total Messages", val: allMessages.length },{ label: "Results", val: filtered.length }].map(s => (
          <div key={s.label} className="mem-stat"><div className="mem-stat-val">{s.val}</div><div className="mem-stat-label">{s.label}</div></div>
        ))}
      </div>
      <div className="memory-full-log">
        {filtered.length === 0 ? <div className="ah-empty">No entries match your search.</div> :
          filtered.map((m, i) => (
            <motion.div key={m.id || i} className="mem-full-entry" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.02 }}>
              <span className="mem-full-time">{m.time}</span>
              <span className="mem-full-text">{m.text}</span>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

// ── SETTINGS PAGE ──────────────────────────────────────────────────────────
function SettingsPage({ settings, onSave }) {
  const [local, setLocal] = useState(settings);
  const [saved, setSaved] = useState(false);
  const save = () => { onSave(local); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="page-container">
      <div className="page-header"><h2 className="page-title">System Settings</h2><p className="page-sub">Customize JARVIS without touching any code</p></div>
      <div className="settings-grid">
        <div className="settings-section">
          <div className="settings-section-title">Personal</div>
          <div className="settings-field"><label>Your Name</label><input className="settings-input" value={local.userName} onChange={e => setLocal(l => ({ ...l, userName: e.target.value }))} /></div>
          <div className="settings-field"><label>Company Name</label><input className="settings-input" value={local.companyName} onChange={e => setLocal(l => ({ ...l, companyName: e.target.value }))} /></div>
          <div className="settings-field"><label>Monthly Income Goal ($)</label><input className="settings-input" type="number" value={local.salaryGoal || 8000} onChange={e => setLocal(l => ({ ...l, salaryGoal: parseInt(e.target.value) }))} /></div>
        </div>
        <div className="settings-section">
          <div className="settings-section-title">Voice</div>
          <div className="settings-field"><label>Speech Speed ({local.speechRate}x)</label><input type="range" min="0.7" max="1.8" step="0.05" value={local.speechRate} onChange={e => setLocal(l => ({ ...l, speechRate: parseFloat(e.target.value) }))} className="settings-range" /></div>
          <div className="settings-field"><label>Pitch ({local.speechPitch})</label><input type="range" min="0.5" max="1.2" step="0.05" value={local.speechPitch} onChange={e => setLocal(l => ({ ...l, speechPitch: parseFloat(e.target.value) }))} className="settings-range" /></div>
          <div className="settings-field">
            <label>Voice Output</label>
            <div className="settings-toggle" onClick={() => setLocal(l => ({ ...l, voiceEnabled: !l.voiceEnabled }))}>
              <div className={`toggle-track${local.voiceEnabled ? " on" : ""}`}><div className="toggle-thumb" /></div>
              <span>{local.voiceEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>
        <div className="settings-section">
          <div className="settings-section-title">AI Model</div>
          <div className="settings-field"><label>Default Model</label>
            <select className="settings-select" value={local.model} onChange={e => setLocal(l => ({ ...l, model: e.target.value }))}>
              <option value="claude-haiku-4-5-20251001">Claude Haiku (Fast)</option>
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet (Smarter)</option>
            </select>
          </div>
          <div className="settings-field"><label>Accent Color</label>
            <div className="color-row">
              {["#FFB300","#00FFFF","#7B8CFF","#FF6B9D","#00FF88","#FF4444"].map(c => (
                <div key={c} className={`color-swatch${local.accentColor === c ? " selected" : ""}`} style={{ background: c }} onClick={() => setLocal(l => ({ ...l, accentColor: c }))} />
              ))}
            </div>
          </div>
        </div>
        <div className="settings-section settings-section-full">
          <div className="settings-section-title">Custom Personality</div>
          <div className="settings-field"><label>Additional context for JARVIS</label>
            <textarea className="settings-textarea" value={local.customPrompt} onChange={e => setLocal(l => ({ ...l, customPrompt: e.target.value }))} placeholder="e.g. My wife's name is Sarah. I prefer TypeScript. Always remind me to take breaks." />
          </div>
        </div>
      </div>
      <button className={`settings-save-btn${saved ? " saved" : ""}`} onClick={save}>{saved ? "✓ Saved!" : <><Save size={15} /> Save Settings</>}</button>
    </div>
  );
}

// ── PROSPECT TABLE ────────────────────────────────────────────────────────
function ProspectTable({ data }) {
  const [copied, setCopied] = useState(null);
  const [saved, setSaved] = useState(false);

  const copyEmail = (email, idx) => {
    navigator.clipboard.writeText(email);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportCSV = () => {
    const headers = ["Business Name", "Type", "Website", "Email", "Phone", "Pain Point", "Pitch"];
    const rows = data.map(r => [r.name, r.type, r.website, r.email, r.phone, r.pain_point, r.pitch].map(v => `"${(v||"").replace(/"/g,'""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "prospects.csv"; a.click();
  };

  const saveToClients = async () => {
    for (const p of data) {
      await supabase.from("clients").insert({ name: p.name, status: "lead", project: p.pitch, value: 0 });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="prospect-table-wrap">
      <div className="pt-header">
        <span className="pt-title">PROSPECT LIST — {data.length} targets found</span>
        <div className="pt-actions">
          <button className="pt-btn" onClick={exportCSV}><Download size={13} /> Export CSV</button>
          <button className={`pt-btn${saved ? " pt-saved" : ""}`} onClick={saveToClients}>
            {saved ? "✓ Saved to CRM" : <><Plus size={13} /> Save All to CRM</>}
          </button>
        </div>
      </div>
      <div className="pt-scroll">
        <table className="pt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Business</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Pain Point</th>
              <th>Your Pitch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="pt-num">{i + 1}</td>
                <td className="pt-name">
                  <div>{row.name}</div>
                  {row.website && row.website !== "N/A" && (
                    <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="pt-link">{row.website}</a>
                  )}
                </td>
                <td className="pt-type">{row.type}</td>
                <td className="pt-contact">
                  {row.email && row.email !== "N/A" && (
                    <div className="pt-email-row">
                      <span>{row.email}</span>
                      <button className="pt-copy" onClick={() => copyEmail(row.email, i)}>{copied === i ? "✓" : "Copy"}</button>
                    </div>
                  )}
                  {row.phone && row.phone !== "N/A" && <div className="pt-phone">{row.phone}</div>}
                </td>
                <td className="pt-pain">{row.pain_point}</td>
                <td className="pt-pitch">{row.pitch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChatMessage({ m, agentColor, agentName, userName }) {
  // try to detect prospect table JSON in assistant messages
  if (m.role === "assistant") {
    const text = m.content || "";
    const jsonStart = text.indexOf("[");
    if (jsonStart !== -1 && text.includes('"name"')) {
      let jsonStr = text.slice(jsonStart);
      let parsed = null;

      // try raw parse first
      try { parsed = JSON.parse(jsonStr); } catch(e) {}

      // try repairing truncated JSON
      if (!parsed) {
        try {
          const lastComplete = jsonStr.lastIndexOf("},");
          if (lastComplete !== -1) {
            const repaired = jsonStr.slice(0, lastComplete + 1) + "]";
            parsed = JSON.parse(repaired);
          }
        } catch(e) {}
      }

      // try closing last object
      if (!parsed) {
        try {
          const lastBrace = jsonStr.lastIndexOf("}");
          if (lastBrace !== -1) {
            const repaired = jsonStr.slice(0, lastBrace + 1) + "]";
            parsed = JSON.parse(repaired);
          }
        } catch(e) {}
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
        return (
          <motion.div className="chat-msg assistant prospect-msg" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} style={{ borderColor:`${agentColor}33`, maxWidth:"100%" }}>
            <div className="chat-label" style={{ color:agentColor }}>{agentName}</div>
            <ProspectTable data={parsed} />
          </motion.div>
        );
      }
    }
  }
  return (
    <motion.div className={`chat-msg ${m.role}`} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} style={m.role==="assistant" ? { borderColor:`${agentColor}33` } : {}}>
      <div className="chat-label" style={m.role==="assistant" ? { color:agentColor } : {}}>
        {m.role === "user" ? userName : agentName}
      </div>
      <div className="chat-text">{m.content}</div>
    </motion.div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const [memory, setMemory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeAgent, setActiveAgent] = useState(DEFAULT_AGENTS[0]);
  const [uptime, setUptime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [settings, setSettings] = useState({
    userName: "Seth", companyName: "Seth AI Systems", location: "Covington, Louisiana",
    speechRate: 1.15, speechPitch: 0.85, voiceEnabled: true,
    accentColor: "#FFB300", model: "claude-haiku-4-5-20251001",
    customPrompt: "", salaryGoal: 8000
  });

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const wakeWordRef = useRef(null);
  const isCommandListening = useRef(false);
  const activeAgentRef = useRef(DEFAULT_AGENTS[0]);
  const settingsRef = useRef(settings);

  useEffect(() => { activeAgentRef.current = activeAgent; }, [activeAgent]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { loadFromSupabase(); const t = setInterval(() => setUptime(u => u + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loading) setTimeout(() => startWakeWord(), 1000); return () => { try { wakeWordRef.current?.abort(); } catch(e) {} }; }, [loading]);
  useEffect(() => { const saved = localStorage.getItem("jarvis-settings"); if (saved) { try { setSettings(JSON.parse(saved)); } catch(e) {} } }, []);

  const saveSettings = (newSettings) => { setSettings(newSettings); localStorage.setItem("jarvis-settings", JSON.stringify(newSettings)); };

  const generateDailyBriefing = async (tasksData, revenueData, clientsData) => {
    const lastBriefing = localStorage.getItem("jarvis-last-briefing");
    const today = new Date().toDateString();
    if (lastBriefing === today) return; // only once per day

    setBriefingLoading(true);
    setShowBriefing(true);

    try {
      const openTasks = (tasksData || []).filter(t => !t.done).length;
      const doneTasks = (tasksData || []).filter(t => t.done).length;
      const monthlyRev = (revenueData || []).filter(r => {
        const d = new Date(r.created_at); const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((sum, r) => sum + (r.amount || 0), 0);
      const activeClients = (clientsData || []).filter(c => c.status === "active").length;
      const leads = (clientsData || []).filter(c => c.status === "lead").length;
      const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: "You are JARVIS from Iron Man giving Seth his daily morning briefing. Be concise, sharp, and motivating. Speak like movie JARVIS. 3-4 sentences max. No markdown.",
          messages: [{
            role: "user",
            content: `Give me my daily briefing for ${dayOfWeek}, ${date}. Stats: $${monthlyRev} earned this month (goal $8000), ${openTasks} open tasks (${doneTasks} completed), ${activeClients} active clients, ${leads} leads in pipeline. Make it feel like a real JARVIS morning briefing — sharp and motivating.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Good morning, Mr. Seth. All systems operational. Ready for another productive day.";
      setBriefing(text);
      localStorage.setItem("jarvis-last-briefing", today);
    } catch (e) {
      setBriefing("Good morning, Mr. Seth. All systems operational and standing by.");
    }
    setBriefingLoading(false);
  };

  const speak = useCallback((text) => {
    const s = settingsRef.current;
    if (!s.voiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Ryan Online")) || voices.find(v => v.name.includes("Guy Online")) || voices.find(v => v.name.includes("Google UK English Male")) || voices.find(v => v.name.includes("Daniel")) || voices.find(v => v.lang === "en-GB") || voices[0];
      if (preferred) utterance.voice = preferred;
      utterance.rate = s.speechRate; utterance.pitch = s.speechPitch; utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length > 0) setVoice(); else window.speechSynthesis.onvoiceschanged = setVoice;
  }, []);

  const loadFromSupabase = async () => {
    try {
      const [{ data: msgs }, { data: taskData }, { data: memData }, { data: revData }, { data: clientData }] = await Promise.all([
        supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(200),
        supabase.from("tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("memory_log").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("revenue").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
      ]);
      if (msgs && msgs.length > 0) { setMessages(msgs.map(m => ({ id: m.id, role: m.role, content: m.content, agent: m.agent || "jarvis" }))); }
      else {
        const welcome = { role: "assistant", content: "Good day, Mr. Seth. All systems online. Ready to assist.", agent: "jarvis" };
        setMessages([welcome]); await supabase.from("messages").insert({ role: welcome.role, content: welcome.content, agent: "jarvis" });
      }
      if (taskData) setTasks(taskData);
      if (memData) { setMemory(memData.map(m => ({ time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), text: m.entry, id: m.id }))); }
      // trigger daily briefing with real data
      setTimeout(() => generateDailyBriefing(taskData, revData, clientData), 1500);
    } catch (err) { setMessages([{ role: "assistant", content: "JARVIS online.", agent: "jarvis" }]); }
    setLoading(false);
  };

  const formatUptime = (s) => { const h = Math.floor(s/3600).toString().padStart(2,"0"); const m = Math.floor((s%3600)/60).toString().padStart(2,"0"); const sec = (s%60).toString().padStart(2,"0"); return `${h}:${m}:${sec}`; };

  const addMemoryEntry = async (text) => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const { data } = await supabase.from("memory_log").insert({ entry: text }).select().single();
    if (data) setMemory(m => [{ time, text, id: data.id }, ...m].slice(0, 100));
  };

  const listenForCommand = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const cmd = new SR(); cmd.continuous = false; cmd.interimResults = false; cmd.lang = "en-US";
    cmd.onstart = () => setListening(true);
    cmd.onresult = (e) => { const transcript = e.results[0][0].transcript; setInput(transcript); setListening(false); isCommandListening.current = false; recognitionRef.current = null; setTimeout(() => document.querySelector(".send-btn")?.click(), 400); };
    cmd.onerror = () => { setListening(false); isCommandListening.current = false; recognitionRef.current = null; setTimeout(() => startWakeWord(), 800); };
    cmd.onend = () => { if (isCommandListening.current) { setListening(false); isCommandListening.current = false; recognitionRef.current = null; setTimeout(() => startWakeWord(), 800); } };
    isCommandListening.current = true; recognitionRef.current = cmd; try { cmd.start(); } catch (e) {}
  }, []);

  const startWakeWord = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isCommandListening.current) return;
    try { wakeWordRef.current?.abort(); } catch (e) {}
    wakeWordRef.current = null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const wake = new SR(); wake.continuous = true; wake.interimResults = true; wake.lang = "en-US"; wake.maxAlternatives = 3;
    wake.onstart = () => setWakeActive(true);
    wake.onresult = (e) => {
      if (isCommandListening.current) return;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        for (let j = 0; j < e.results[i].length; j++) {
          const t = e.results[i][j].transcript.toLowerCase().trim();
          if (t.includes("hey jarvis") || t.includes("hey davis") || t.includes("hey harris") || t.includes("jarvis")) {
            setWakeActive(false); wakeWordRef.current = null; try { wake.abort(); } catch (err) {}
            setTimeout(() => listenForCommand(), 200); return;
          }
        }
      }
    };
    wake.onend = () => { setWakeActive(false); if (!isCommandListening.current) setTimeout(() => startWakeWord(), 1500); };
    wake.onerror = (e) => { setWakeActive(false); if (e.error !== "aborted") setTimeout(() => startWakeWord(), e.error === "no-speech" ? 500 : 2500); };
    wakeWordRef.current = wake; try { wake.start(); } catch (e) {}
  }, [listenForCommand]);

  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Use Edge or Chrome."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); isCommandListening.current = false; setTimeout(() => startWakeWord(), 500); return; }
    try { wakeWordRef.current?.abort(); } catch (e) {}
    setWakeActive(false); listenForCommand();
  }, [listening, listenForCommand, startWakeWord]);

  const sendMessage = useCallback(async (overrideInput) => {
    const msg = (overrideInput || input).trim();
    if (!msg || thinking) return;
    setInput("");
  const autoRoute = (msg) => {
  const m = msg.toLowerCase();
  if (m.includes("find") && (m.includes("business") || m.includes("client") || m.includes("compan") || m.includes("prospect") || m.includes("research") || m.includes("market") || m.includes("competitor") || m.includes("trend") || m.includes("search") || m.includes("look up") || m.includes("what is") || m.includes("news") || m.includes("latest"))) return DEFAULT_AGENTS.find(a => a.id === "research");
  if (m.includes("code") || m.includes("bug") || m.includes("error") || m.includes("function") || m.includes("component") || m.includes("build") || m.includes("implement") || m.includes("fix") || m.includes("deploy") || m.includes("database") || m.includes("api") || m.includes("react") || m.includes("swift") || m.includes("javascript") || m.includes("supabase") || m.includes("css") || m.includes("html")) return DEFAULT_AGENTS.find(a => a.id === "dev");
  if (m.includes("post") || m.includes("linkedin") || m.includes("marketing") || m.includes("content") || m.includes("caption") || m.includes("ad ") || m.includes("email blast") || m.includes("pitch") || m.includes("promote") || m.includes("brand") || m.includes("social media") || m.includes("write me a") || m.includes("draft")) return DEFAULT_AGENTS.find(a => a.id === "marketing");
  if (m.includes("strategy") || m.includes("business") || m.includes("revenue") || m.includes("growth") || m.includes("plan") || m.includes("advice") || m.includes("should i") || m.includes("recommend") || m.includes("llc") || m.includes("client") || m.includes("money") || m.includes("price") || m.includes("charge") || m.includes("salary") || m.includes("quit")) return DEFAULT_AGENTS.find(a => a.id === "advisor");
  return DEFAULT_AGENTS.find(a => a.id === "jarvis");
};

// Respect the manually selected agent. Only auto-route when sitting on JARVIS (the default hub).
const current = activeAgentRef.current;
const agent = current.id === "jarvis" ? (autoRoute(msg) || current) : current;
if (agent.id !== activeAgentRef.current.id) {
  setActiveAgent(agent);
  activeAgentRef.current = agent;
}    const s = settingsRef.current;
    const userRecord = { role: "user", content: msg, agent: agent.id };
    const { data: savedUser } = await supabase.from("messages").insert(userRecord).select().single();
    const newMessages = [...messages, { ...userRecord, id: savedUser?.id }];
    setMessages(newMessages);
    await addMemoryEntry(`[${agent.name}] "${msg.slice(0,35)}${msg.length>35?"...":""}"`);
    setThinking(true);
    try {
      const systemPrompt = agent.system + (s.customPrompt ? ` Additional context: ${s.customPrompt}` : "");
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: agent.id === "dev" ? "claude-sonnet-4-5-20250929" : s.model,
          max_tokens: agent.id === "dev" ? 2000 : 300,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if (data.error) {
        const errMsg = { role: "assistant", content: `Error: ${data.error}`, agent: agent.id };
        await supabase.from("messages").insert(errMsg); setMessages(m => [...m, errMsg]);
      } else {
        // extract text from response — handle web search tool_use blocks
        let reply = "No response.";
        if (data.content && Array.isArray(data.content)) {
          const textBlocks = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
          reply = textBlocks || "No response.";
        }
        const assistantRecord = { role: "assistant", content: reply, agent: agent.id };
        const { data: saved } = await supabase.from("messages").insert(assistantRecord).select().single();
        setMessages(m => [...m, { ...assistantRecord, id: saved?.id }]);
        speak(reply); await addMemoryEntry(`[${agent.name}] Responded`);
        setTimeout(() => startWakeWord(), 500);
      }
    } catch (err) { setMessages(m => [...m, { role: "assistant", content: `Connection error: ${err.message}`, agent: agent.id }]); }
    setThinking(false);
  }, [input, thinking, messages, speak, startWakeWord]);

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const toggleTask = async (id, done) => { await supabase.from("tasks").update({ done: !done }).eq("id", id); setTasks(t => t.map(task => task.id === id ? { ...task, done: !done } : task)); };
  const addTask = async () => { if (!newTask.trim()) return; const { data } = await supabase.from("tasks").insert({ text: newTask.trim(), done: false }).select().single(); if (data) { setTasks(t => [...t, data]); await addMemoryEntry(`Task: "${newTask.trim()}"`); } setNewTask(""); setShowAddTask(false); };
  const deleteTask = async (id) => { await supabase.from("tasks").delete().eq("id", id); setTasks(t => t.filter(task => task.id !== id)); };
  const clearChat = async () => {
    await supabase.from("messages").delete().neq("id", 0);
    const welcome = { role: "assistant", content: "Memory wiped. Fresh start, Mr. Seth.", agent: "jarvis" };
    const { data } = await supabase.from("messages").insert(welcome).select().single();
    setMessages([{ ...welcome, id: data?.id }]);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "business", label: "Business", Icon: TrendingUp },
    { id: "agents", label: "Agents", Icon: Cpu },
    { id: "memory", label: "Memory", Icon: MemoryStick },
    { id: "settings", label: "Settings", Icon: Settings },
  ];

  if (loading) {
    return (
      <div className="app loading-screen"><ParticleField /><div className="grid-overlay" />
        <div className="loading-content">
          <motion.div className="loading-orb" animate={{ scale:[1,1.2,1],opacity:[0.5,1,0.5] }} transition={{ duration:1.5,repeat:Infinity }} />
          <motion.p className="loading-text" animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.5,repeat:Infinity }}>INITIALIZING JARVIS...</motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ParticleField />
      <div className="grid-overlay" />
      <nav className="topnav">
        <div className="nav-logo">
          <motion.div className="nav-logo-dot" animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.5,repeat:Infinity }} />
          <span className="nav-logo-text">{settings.companyName.toUpperCase()}</span>
        </div>
        <div className="nav-links">
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-link${activeNav === id ? " active" : ""}`} onClick={() => setActiveNav(id)}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
        <div className="nav-status">
          <motion.div className="status-dot online" animate={{ opacity:[1,0.4,1] }} transition={{ duration:1.2,repeat:Infinity }} />
          <span>SYSTEM ONLINE</span>
          <button className="voice-toggle-btn" onClick={() => saveSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })} title={settings.voiceEnabled ? "Mute" : "Unmute"}>
            {settings.voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {activeNav !== "dashboard" ? (
          <motion.div key={activeNav} className="page-wrapper" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} transition={{ duration:0.2 }}>
            <ParticleField /><div className="grid-overlay" />
            {activeNav === "business" && <BusinessDashboard messages={messages} tasks={tasks} memory={memory} settings={settings} />}
            {activeNav === "agents" && <AgentsPage agents={DEFAULT_AGENTS} allMessages={messages} activeAgent={activeAgent} setActiveAgent={setActiveAgent} setActiveNav={setActiveNav} />}
            {activeNav === "memory" && <MemoryPage memory={memory} allMessages={messages} />}
            {activeNav === "settings" && <SettingsPage settings={settings} onSave={saveSettings} />}
          </motion.div>
        ) : (
          <motion.main key="dashboard" className="main-grid-v4" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

            {/* LEFT — CHAT (wider) */}
            <aside className="panel panel-chat">
              <div className="panel-header"><Database size={14} /><span>JARVIS Chat</span>
                <button className="clear-btn-small" onClick={clearChat} style={{ marginLeft: "auto" }}>Clear</button>
              </div>
              <div className="chat-log">
                {messages.map((m, i) => {
                  const agent = DEFAULT_AGENTS.find(a => a.id === m.agent) || DEFAULT_AGENTS[0];
                  return (
                    <ChatMessage key={m.id || i} m={m} agentColor={agent.color} agentName={agent.name.toUpperCase()} userName={settings.userName.toUpperCase()} />
                  );
                })}
                {thinking && (
                  <motion.div className="chat-msg assistant" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                    <div className="chat-label" style={{ color:activeAgent.color }}>{activeAgent.name.toUpperCase()}</div>
                    <div className="dot-row">{[0,1,2].map(i => (<motion.span key={i} className="dot" style={{ background:activeAgent.color }} animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:0.8,repeat:Infinity,delay:i*0.2 }} />))}</div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className={`input-bar${input.length > 0 ? " input-active" : ""}`} style={input.length > 0 ? { borderColor:`${activeAgent.color}66` } : {}}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={`Ask ${activeAgent.name}...`} className="chat-input" />
                <button className={`mic-btn${listening ? " mic-active" : ""}`} onClick={toggleVoice}>{listening ? <MicOff size={15} /> : <Mic size={15} />}</button>
                <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || thinking}><Send size={15} /></button>
              </div>
            </aside>

            {/* CENTER — ORB */}
            <section className="center-col">
              <div className="orb-section">
                <motion.h2 className="company-title" animate={{ opacity:[0.65,1,0.65] }} transition={{ duration:3,repeat:Infinity }}>
                  {settings.companyName.toUpperCase()}
                </motion.h2>
                <div className="agent-badge" style={{ color:activeAgent.color, borderColor:`${activeAgent.color}44` }}>
                  {activeAgent.name} — {activeAgent.desc}
                </div>
                <HoloOrb active={listening || input.length > 0} thinking={thinking} agentColor={activeAgent.color} />
                {thinking && (
                  <motion.div className="thinking-text" style={{ color:activeAgent.color }} initial={{ opacity:0 }} animate={{ opacity:1 }}>
                    {activeAgent.name} is processing...
                  </motion.div>
                )}
              </div>
              <div className="center-stats">
                {[
                  { label: "Messages", val: messages.length },
                  { label: "Tasks Open", val: tasks.filter(t => !t.done).length },
                  { label: "Uptime", val: formatUptime(uptime) },
                ].map(s => (
                  <div key={s.label} className="center-stat">
                    <div className="cs-val">{s.val}</div>
                    <div className="cs-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* RIGHT — AGENTS + TASKS (narrower) */}
            <aside className="panel panel-right-v4">
              <div className="panel-header"><Cpu size={14} /><span>Select Agent</span></div>
              <div className="agent-list">
                {DEFAULT_AGENTS.map((agent, i) => {
                  const Icon = ICON_MAP[agent.icon] || Brain;
                  const isActive = activeAgent.id === agent.id;
                  return (
                    <motion.div key={agent.id} className={`agent-card${isActive ? " agent-active" : ""}`}
                      initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }}
                      transition={{ delay:i*0.08 }} style={{ "--accent":agent.color }}
                      onClick={() => setActiveAgent(agent)}>
                      <div className="agent-icon-wrap"><Icon size={15} /></div>
                      <div className="agent-info">
                        <div className="agent-name">{agent.name}</div>
                        <div className="agent-desc">{agent.desc}</div>
                      </div>
                      <div className="agent-status">
                        <motion.div className="status-dot" style={{ background:isActive ? agent.color : "#00FF88" }} animate={{ opacity:[1,0.3,1] }} transition={{ duration:2,repeat:Infinity,delay:i*0.4 }} />
                        <span style={{ color:isActive ? agent.color : "#00FF88", fontSize:"11px" }}>{isActive ? "active" : "ready"}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="panel-header" style={{ marginTop:"1.25rem" }}>
                <Activity size={14} /><span>Quick Tasks</span>
                <button className="icon-btn" onClick={() => setShowAddTask(s => !s)} style={{ marginLeft:"auto" }}><Plus size={14} /></button>
              </div>
              <AnimatePresence>
                {showAddTask && (
                  <motion.div className="add-task-row" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }}>
                    <input className="add-task-input" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key==="Enter" && addTask()} placeholder="New task..." autoFocus />
                    <button className="icon-btn" onClick={addTask}><ChevronRight size={13} /></button>
                    <button className="icon-btn" onClick={() => setShowAddTask(false)}><X size={13} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task.id} className={`task-item${task.done ? " done" : ""}`}>
                    <div className={`task-check${task.done ? " checked" : ""}`} onClick={() => toggleTask(task.id, task.done)}>{task.done && <ChevronRight size={9} />}</div>
                    <span onClick={() => toggleTask(task.id, task.done)} style={{ flex:1 }}>{task.text}</span>
                    <button className="icon-btn task-delete" onClick={() => deleteTask(task.id)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </aside>
          </motion.main>
        )}
      </AnimatePresence>

      {/* DAILY BRIEFING POPUP */}
      <AnimatePresence>
        {showBriefing && (
          <motion.div className="briefing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="briefing-modal" initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
              <div className="briefing-header">
                <div className="briefing-orb">
                  <motion.div className="briefing-orb-inner" animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                </div>
                <div>
                  <div className="briefing-title">GOOD {new Date().getHours() < 12 ? "MORNING" : new Date().getHours() < 17 ? "AFTERNOON" : "EVENING"}, MR. SETH</div>
                  <div className="briefing-date">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
              <div className="briefing-body">
                {briefingLoading ? (
                  <div className="briefing-loading">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>JARVIS is preparing your briefing...</motion.div>
                  </div>
                ) : (
                  <motion.p className="briefing-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{briefing}</motion.p>
                )}
              </div>
              <div className="briefing-footer">
                <button className="briefing-dismiss" onClick={() => { setShowBriefing(false); speak(briefing); }}>
                  Acknowledged — Begin Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bottom-bar">
        <div className="bottom-left">
          <Zap size={11} /><span>JARVIS CORE v4.0</span>
          <motion.div className="wake-indicator" animate={{ opacity:wakeActive ? [0.4,1,0.4] : 0.2 }} transition={{ duration:1.5,repeat:Infinity }} style={{ background:wakeActive ? "#00FF88" : "#555" }} />
          <span style={{ color:wakeActive ? "#00FF88" : "#555", fontSize:"11px" }}>{wakeActive ? "LISTENING FOR HEY JARVIS" : "WAKE WORD OFF"}</span>
        </div>
        <WaveformBar active={listening || thinking} color={activeAgent.color} />
        <div className="bottom-right"><Circle size={7} fill="#00FF88" color="#00FF88" /><span>ALL AGENTS ONLINE</span></div>
      </footer>
    </div>
  );
}