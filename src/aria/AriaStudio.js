import { useState } from "react";
import { Megaphone } from "lucide-react";
import PersonalitiesTab from "./PersonalitiesTab";
import "./aria.css";

export default function AriaStudio() {
  // Composer and Queue tabs arrive in Phase 2/3; Phase 1 ships Personalities.
  const [tab, setTab] = useState("personalities");
  const tabs = [
    { id: "personalities", label: "Personalities" },
    { id: "composer", label: "Composer" },
    { id: "queue", label: "Queue" },
  ];
  return (
    <div className="aria-studio">
      <div className="aria-head">
        <div className="aria-head-icon"><Megaphone size={20} /></div>
        <div>
          <div className="aria-head-title">ARIA Studio</div>
          <div className="aria-head-sub">Automated social media command center</div>
        </div>
      </div>
      <div className="aria-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`aria-tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "personalities" && <PersonalitiesTab />}
      {tab === "composer" && <div className="aria-empty">Composer arrives in Phase 2.</div>}
      {tab === "queue" && <div className="aria-empty">Queue arrives in Phase 3.</div>}
    </div>
  );
}
