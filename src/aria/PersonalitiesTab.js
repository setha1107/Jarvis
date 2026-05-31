import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import { listAccounts, deleteAccount } from "./ariaApi";
import NewPersonalityWizard from "./NewPersonalityWizard";

export default function PersonalitiesTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setAccounts(await listAccounts()); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await deleteAccount(id);
    setAccounts(a => a.filter(x => x.id !== id));
  };

  return (
    <div className="aria-tab">
      <div className="aria-tab-actions">
        <button className="aria-primary-btn" onClick={() => setShowWizard(true)}>
          <Plus size={14} /> New Personality
        </button>
      </div>

      {loading ? (
        <div className="aria-empty">Loading personalities...</div>
      ) : accounts.length === 0 ? (
        <div className="aria-empty">No personalities yet. Create your first account above.</div>
      ) : (
        <div className="aria-card-grid">
          {accounts.map((a, i) => (
            <motion.div key={a.id} className="aria-persona-card"
              style={{ "--accent": a.accent_color || "#bd20ad" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="apc-top">
                <div className="apc-icon"><Users size={16} /></div>
                <div className="apc-title">
                  <div className="apc-name">{a.name}</div>
                  <div className="apc-niche">{a.niche || "general"} • {a.platform}</div>
                </div>
                <button className="aria-icon-btn" onClick={() => remove(a.id)}><Trash2 size={13} /></button>
              </div>
              <div className="apc-bio">{a.bio}</div>
              <div className="apc-pillars">
                {(a.content_pillars || []).map((p, j) => <span key={j} className="apc-pill">{p}</span>)}
              </div>
              <div className="apc-foot">
                <span className={`apc-badge${a.auto_publish ? " auto" : ""}`}>
                  {a.auto_publish ? "Auto-publish" : "Review first"}
                </span>
                <span className="apc-status">{a.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showWizard && (
        <NewPersonalityWizard
          onClose={() => setShowWizard(false)}
          onCreated={(acct) => setAccounts(a => [acct, ...a])}
        />
      )}
    </div>
  );
}
