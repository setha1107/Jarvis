import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { createAccount } from "./ariaApi";

export default function NewPersonalityWizard({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", platform: "facebook", niche: "", audience: "",
    tone: "", posting_frequency: "daily",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setError("Give the account a name."); return; }
    setBusy(true); setError("");
    try {
      const account = await createAccount(form);
      onCreated(account);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <motion.div className="aria-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="aria-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div className="aria-modal-head">
          <span><Sparkles size={16} /> New Personality</span>
          <button className="aria-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="aria-form">
          <label>Account name
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Bayou Eats" />
          </label>
          <label>Platform
            <select value={form.platform} onChange={e => set("platform", e.target.value)}>
              <option value="facebook">Facebook</option>
            </select>
          </label>
          <label>Niche / topic
            <input value={form.niche} onChange={e => set("niche", e.target.value)} placeholder="e.g. Louisiana restaurants" />
          </label>
          <label>Audience
            <input value={form.audience} onChange={e => set("audience", e.target.value)} placeholder="e.g. local foodies 25-45" />
          </label>
          <label>Tone / vibe
            <input value={form.tone} onChange={e => set("tone", e.target.value)} placeholder="e.g. fun, local, mouth-watering" />
          </label>
          <label>Posting frequency
            <select value={form.posting_frequency} onChange={e => set("posting_frequency", e.target.value)}>
              <option value="daily">Daily</option>
              <option value="3x/week">3x / week</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          {error && <div className="aria-error">{error}</div>}
          <button className="aria-primary-btn" onClick={submit} disabled={busy}>
            {busy ? "ARIA is designing the persona..." : "Generate Personality"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
