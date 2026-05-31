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
