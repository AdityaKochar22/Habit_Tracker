import { useState, useEffect, useCallback } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const HABITS = [
  { id: "water",    label: "Drink 8 glasses of water",     icon: "💧", color: "#3b82f6", bg: "#eff6ff", category: "Health & Fitness",      goal: 8    },
  { id: "stretch",  label: "Stretch for 10 min",           icon: "🧘", color: "#8b5cf6", bg: "#f5f3ff", category: "Health & Fitness",      goal: 1    },
  { id: "abs",      label: "30 min Abs Exercise",          icon: "🏋️", color: "#f97316", bg: "#fff7ed", category: "Health & Fitness",      goal: 1    },
  { id: "steps",    label: "Hit 5,000 steps",              icon: "👟", color: "#10b981", bg: "#ecfdf5", category: "Health & Fitness",      goal: 5000 },
  { id: "veggies",  label: "Eat 3 servings of vegetables", icon: "🥦", color: "#22c55e", bg: "#f0fdf4", category: "Nutrition & Lifestyle", goal: 3    },
  { id: "no_sugar", label: "Avoid sugary drinks",          icon: "🚫", color: "#ef4444", bg: "#fef2f2", category: "Nutrition & Lifestyle", goal: 1    },
  { id: "vitamins", label: "Take vitamins",                icon: "💊", color: "#f59e0b", bg: "#fffbeb", category: "Nutrition & Lifestyle", goal: 1    },
  { id: "bedtime",  label: "Go to bed before 11pm",        icon: "🌙", color: "#6366f1", bg: "#eef2ff", category: "Nutrition & Lifestyle", goal: 1    },
];
const CATEGORIES = [...new Set(HABITS.map((h) => h.category))];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const G = {
  green: "#3d7a56", greenLight: "#edf5eb", greenBorder: "#c8debc",
  greenMid: "#2d5a3d", text: "#1e293b", muted: "#64748b", faint: "#94a3b8",
  white: "#fff", card: "#f8fafc", border: "#e2eed9",
};

function todayKey() { return new Date().toISOString().slice(0, 10); }
function fmtDate(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
// partial % of goal achieved (capped at 100)
function partialPct(count, goal) { return Math.min(Math.round((count / goal) * 100), 100); }

function calcStreak(entries) {
  if (!entries?.length) return 0;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const cur = new Date();
  if (sorted[0].date !== todayKey()) cur.setDate(cur.getDate() - 1);
  let streak = 0;
  for (const e of sorted) {
    const exp = cur.toISOString().slice(0, 10);
    if (e.date === exp && e.count > 0) { streak++; cur.setDate(cur.getDate() - 1); }
    else if (e.date === exp) break;
  }
  return streak;
}
function successRate(entries, goal) {
  if (!entries?.length) return 0;
  return Math.round(entries.filter((e) => e.count >= goal).length / entries.length * 100);
}
function totalSuccesses(entries, goal) { return (entries || []).filter((e) => e.count >= goal).length; }

// colour based on partial completion
function progressColor(pct) {
  if (pct >= 100) return "#22c55e";
  if (pct >= 60)  return "#f59e0b";
  if (pct > 0)    return "#f97316";
  return "#fecaca";
}

// ─── Shared components ────────────────────────────────────────────────────────
function StreakBadge({ streak }) {
  const emoji = streak >= 20 ? "👑" : streak >= 10 ? "🔥" : streak >= 3 ? "⚡" : "📈";
  const color = streak >= 20 ? "#f59e0b" : streak >= 10 ? "#a855f7" : streak >= 3 ? "#22c55e" : G.faint;
  return (
    <span style={{ fontSize: 12, color, fontWeight: streak >= 3 ? 600 : 400, display: "flex", alignItems: "center", gap: 3 }}>
      <span>{emoji}</span> {streak} day streak
    </span>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: G.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${G.border}` }}>
      <div style={{ fontSize: 11, color: G.faint, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 4, fontFamily: "DM Sans, sans-serif" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "DM Serif Display, serif", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: G.faint, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{sub}</div>}
    </div>
  );
}

// Mini circular-style progress ring (SVG)
function RingProgress({ pct, size = 44, color = G.green, children }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8f0e8" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Habit List Card ──────────────────────────────────────────────────────────
function HabitCard({ habit, entries, onOpen }) {
  const streak = calcStreak(entries);
  const rate   = successRate(entries, habit.goal);
  const succ   = totalSuccesses(entries, habit.goal);

  // today's partial progress
  const todayEntry = entries.find((e) => e.date === todayKey());
  const todayPct   = todayEntry ? partialPct(todayEntry.count, habit.goal) : null;
  const ringColor  = todayPct != null ? progressColor(todayPct) : G.border;

  return (
    <button onClick={() => onOpen(habit.id)} style={{
      display: "flex", alignItems: "center", gap: 14, width: "100%",
      background: G.white, border: `1px solid ${G.border}`, borderRadius: 16,
      padding: "14px 16px", cursor: "pointer", textAlign: "left", marginBottom: 10,
      boxShadow: "0 1px 4px rgba(30,80,30,.06)", outline: "none",
    }}>
      {/* Icon with today's ring */}
      <RingProgress pct={todayPct ?? 0} size={50} color={ringColor}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: habit.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {habit.icon}
        </div>
      </RingProgress>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 15, color: G.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {habit.label}
        </div>
        {/* today's count / goal */}
        <div style={{ fontSize: 12, color: G.muted, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <span>
            {todayEntry
              ? <span style={{ color: ringColor, fontWeight: 600 }}>{todayEntry.count}/{habit.goal} today ({todayPct}%)</span>
              : <span style={{ color: G.faint }}>No entry today</span>}
          </span>
          <span style={{ color: G.faint }}>· {succ} total wins</span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: rate >= 70 ? "#22c55e" : rate >= 40 ? "#f59e0b" : entries.length ? "#ef4444" : G.faint, fontFamily: "DM Serif Display, serif", lineHeight: 1, marginBottom: 3 }}>
          {entries.length ? `${rate}%` : "—"}
        </div>
        <StreakBadge streak={streak} />
      </div>
    </button>
  );
}

// ─── Add / Edit Entry Modal ───────────────────────────────────────────────────
function EntryModal({ habit, existing, onSave, onCancel }) {
  const isEdit = !!existing;
  const [count, setCount]     = useState(existing ? existing.count : 0);
  const [inputVal, setInputVal] = useState(existing ? String(existing.count) : "0");
  const sliderMax = Math.max(habit.goal * 2, 20);
  const pct = partialPct(count, habit.goal);

  const handleInput = (v) => {
    setInputVal(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0) setCount(Math.min(n, sliderMax));
  };
  const handleSlider = (v) => { const n = parseInt(v, 10); setCount(n); setInputVal(String(n)); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
      <div style={{ background: "#f4faf2", borderRadius: 24, padding: "26px 24px 22px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,.22)", animation: "modalIn .2s ease" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: habit.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{habit.icon}</div>
          <div>
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 17, color: G.text, lineHeight: 1.2 }}>{isEdit ? "Edit Entry" : "Add Entry"}</div>
            <div style={{ fontSize: 12.5, color: G.faint, fontFamily: "DM Sans, sans-serif", marginTop: 1 }}>{habit.label}</div>
          </div>
        </div>

        {isEdit && <div style={{ fontSize: 12.5, color: G.faint, marginBottom: 16, fontFamily: "DM Sans, sans-serif" }}>{fmtDate(existing.date)}</div>}

        {/* Live progress bar */}
        <div style={{ background: G.white, borderRadius: 14, padding: "16px", border: `1px solid ${G.greenBorder}`, marginBottom: 16, marginTop: 16 }}>

          {/* Progress visual */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <RingProgress pct={pct} size={56} color={progressColor(pct)}>
              <span style={{ fontSize: 11, fontWeight: 700, color: progressColor(pct), fontFamily: "DM Sans, sans-serif" }}>{pct}%</span>
            </RingProgress>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G.muted, fontFamily: "DM Sans, sans-serif", marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: G.text }}>{count} <span style={{ fontWeight: 400, color: G.faint }}>/ {habit.goal}</span></span>
                <span style={{ color: progressColor(pct), fontWeight: 600 }}>
                  {pct >= 100 ? "✓ Goal reached!" : pct > 0 ? `${habit.goal - count} more to go` : "0 means failure"}
                </span>
              </div>
              <div style={{ height: 8, background: "#e8f5e9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: progressColor(pct), borderRadius: 99, transition: "width .2s ease" }} />
              </div>
            </div>
          </div>

          {/* Number input */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => handleInput(String(Math.max(0, count - 1)))}
              style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid #c8debc`, background: "transparent", cursor: "pointer", fontSize: 20, color: G.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>−</button>
            <input type="number" min={0} max={sliderMax} value={inputVal} onChange={(e) => handleInput(e.target.value)}
              style={{ flex: 1, border: `1.5px solid #d4e8cf`, borderRadius: 10, outline: "none", fontFamily: "DM Sans, sans-serif", fontSize: 18, color: G.text, padding: "8px 14px", textAlign: "center", background: G.white }} />
            <button onClick={() => handleInput(String(count + 1))}
              style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid #c8debc`, background: "transparent", cursor: "pointer", fontSize: 20, color: G.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
          </div>

          {/* Slider */}
          <div style={{ fontSize: 12, color: G.faint, marginBottom: 6, fontFamily: "DM Sans, sans-serif" }}>Or drag slider:</div>
          <input type="range" min={0} max={sliderMax} value={count} onChange={(e) => handleSlider(e.target.value)}
            style={{ width: "100%", cursor: "pointer", "--pct": `${Math.round((count / sliderMax) * 100)}%` }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 15, color: G.green, fontWeight: 600, padding: "10px 16px" }}>Cancel</button>
          <button onClick={() => onSave(count)} style={{ background: G.white, border: `2px solid ${G.green}`, borderRadius: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 15, color: G.green, fontWeight: 700, padding: "10px 24px" }}>
            {isEdit ? "Update Entry" : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ habit, entries }) {
  const streak = calcStreak(entries);
  const rate   = successRate(entries, habit.goal);
  const succ   = totalSuccesses(entries, habit.goal);
  const fail   = entries.filter((e) => e.count < habit.goal).length;

  // avg partial completion
  const avgPct = entries.length
    ? Math.round(entries.reduce((s, e) => s + partialPct(e.count, habit.goal), 0) / entries.length)
    : 0;

  return (
    <div style={{ padding: "24px clamp(16px,4vw,48px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Success Rate"      value={entries.length ? `${rate}%` : "—"}  color="#22c55e" />
        <StatCard label="Avg Completion"    value={entries.length ? `${avgPct}%` : "—"} color={progressColor(avgPct)} sub="partial progress avg" />
        <StatCard label="Current Streak"    value={`${streak}d`}   color={streak >= 10 ? "#a855f7" : "#3b82f6"} />
        <StatCard label="Total Successes"   value={succ}           color="#10b981" />
        <StatCard label="Total Failures"    value={fail}           color="#ef4444" />
        <StatCard label="Daily Goal"        value={habit.goal === 1 ? "Once/day" : `${habit.goal}×`} color="#f59e0b" />
      </div>

      {streak >= 3 && (
        <div style={{
          background: streak >= 20 ? "linear-gradient(135deg,#fef3c7,#fde68a)" : streak >= 10 ? "linear-gradient(135deg,#f3e8ff,#e9d5ff)" : "linear-gradient(135deg,#d1fae5,#a7f3d0)",
          borderRadius: 14, padding: "16px 20px", textAlign: "center",
          fontFamily: "DM Serif Display, serif", fontSize: 17, color: G.text,
          border: `1px solid ${streak >= 20 ? "#fcd34d" : streak >= 10 ? "#c084fc" : "#6ee7b7"}`,
        }}>
          {streak >= 20 ? `👑 ${streak}-day Legend!` : streak >= 10 ? `🔥 ${streak}-day Streak!` : `⚡ ${streak}-day Streak! Keep it going!`}
        </div>
      )}
      {!entries.length && <div style={{ textAlign: "center", color: G.faint, fontFamily: "DM Sans, sans-serif", padding: "32px 0" }}>No entries yet — tap + to log your first!</div>}
    </div>
  );
}

// ─── Report Tab ───────────────────────────────────────────────────────────────
function ReportTab({ entries, habit }) {
  if (!entries?.length) return <div style={{ padding: 40, textAlign: "center", color: G.faint, fontFamily: "DM Sans, sans-serif" }}>No entries yet</div>;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  return (
    <div style={{ padding: "24px clamp(16px,4vw,48px)" }}>
      <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 17, color: G.text, marginBottom: 20 }}>Last {sorted.length} days</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130, marginBottom: 10 }}>
        {sorted.map((e) => {
          const pct = partialPct(e.count, habit.goal);
          const col = progressColor(pct);
          return (
            <div key={e.id} title={`${fmtDate(e.date)}: ${e.count}/${habit.goal} (${pct}%)`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 9, color: G.faint, fontFamily: "DM Sans, sans-serif" }}>{pct}%</div>
              <div style={{ width: "100%", flex: 1, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                <div style={{ width: "100%", height: `${Math.max(pct, 3)}%`, background: col, borderRadius: "4px 4px 0 0", transition: "height .3s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: G.faint, fontFamily: "DM Sans, sans-serif" }}>{fmtDate(sorted[0].date)}</span>
        <span style={{ fontSize: 11, color: G.faint, fontFamily: "DM Sans, sans-serif" }}>{fmtDate(sorted[sorted.length - 1].date)}</span>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[["#22c55e","100% (Goal met)"],["#f59e0b","60–99%"],["#f97316","1–59%"],["#fecaca","0% (Failed"]].map(([c,l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: G.muted, fontFamily: "DM Sans, sans-serif" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Entries Tab ──────────────────────────────────────────────────────────────
function EntriesTab({ entries, habit, onEdit, onDelete }) {
  if (!entries?.length) return <div style={{ padding: 40, textAlign: "center", color: G.faint, fontFamily: "DM Sans, sans-serif" }}>No entries yet — tap + to add your first!</div>;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {sorted.map((entry, i) => {
        const pct = partialPct(entry.count, habit.goal);
        const col = progressColor(pct);
        const ok  = entry.count >= habit.goal;

        return (
          <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px clamp(16px,4vw,48px)", borderBottom: i < sorted.length - 1 ? "1px solid #f1f5f9" : "none" }}>

            {/* Ring with pct */}
            <RingProgress pct={pct} size={46} color={col}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: col, fontFamily: "DM Sans, sans-serif" }}>{pct}%</span>
            </RingProgress>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: G.text, fontFamily: "DM Sans, sans-serif" }}>Day {sorted.length - i}</span>
                <span style={{ fontSize: 12, color: G.faint, fontFamily: "DM Sans, sans-serif" }}>{fmtDate(entry.date)}</span>
              </div>

              {/* Count / goal bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontFamily: "DM Sans, sans-serif", color: col, fontWeight: 600 }}>
                  {entry.count} <span style={{ color: G.faint, fontWeight: 400 }}>/ {habit.goal}</span>
                </span>
                <div style={{ flex: 1, height: 5, background: "#e8f5e9", borderRadius: 99, overflow: "hidden", maxWidth: 120 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 99, transition: "width .3s" }} />
                </div>
                <span style={{ fontSize: 11.5, color: ok ? "#16a34a" : col, fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
                  {ok ? "✓ Done" : pct > 0 ? `${habit.goal - entry.count} short` : "✗ Failed"}
                </span>
              </div>
            </div>

            {/* Edit / delete */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button onClick={() => onEdit(entry)} title="Edit"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, cursor: "pointer", padding: "6px 10px", color: G.green, fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600 }}>
                Edit
              </button>
              <button onClick={() => onDelete(entry.id)} title="Delete"
                style={{ background: "#fff0f0", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", padding: "6px 8px", color: "#ef4444" }}>
                <svg width="14" height="16" fill="none"><path d="M1 3.5h12M5 3.5V2h4v1.5M2.5 3.5l.9 10.5h7.2l.9-10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Habit Detail View ────────────────────────────────────────────────────────
function HabitDetailView({ habit, entries, onBack, onAddEntry, onEditEntry, onDeleteEntry }) {
  const [tab, setTab]           = useState("entries");
  const [showAdd, setShowAdd]   = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const handleSaveNew  = (c) => { onAddEntry(habit.id, c);                setShowAdd(false); };
  const handleSaveEdit = (c) => { onEditEntry(habit.id, editEntry.id, c); setEditEntry(null); };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: G.greenLight, display: "flex", flexDirection: "column" }}>

      {/* Sticky header */}
      <div style={{ background: G.greenLight, position: "sticky", top: 0, zIndex: 100, width: "100%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px clamp(16px,4vw,48px) 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px 4px 0", color: G.text, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <svg width="20" height="16" fill="none"><path d="M19 8H1M1 8L8 1M1 8L8 15" stroke={G.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: habit.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{habit.icon}</div>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "clamp(16px,2.5vw,22px)", color: G.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.label}</span>
          </div>

          <div style={{ display: "flex", borderBottom: `2px solid ${G.greenBorder}` }}>
            {["entries","overview","report"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                padding: "10px 0", fontFamily: "DM Sans, sans-serif", fontSize: 14,
                fontWeight: tab === t ? 600 : 400, color: tab === t ? G.greenMid : G.muted,
                borderBottom: tab === t ? `2.5px solid ${G.greenMid}` : "2.5px solid transparent",
                marginBottom: -2, textTransform: "capitalize",
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: G.white, overflowY: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          {tab === "entries"  && <EntriesTab entries={entries} habit={habit} onEdit={setEditEntry} onDelete={(id) => onDeleteEntry(habit.id, id)} />}
          {tab === "overview" && <OverviewTab habit={habit} entries={entries} />}
          {tab === "report"   && <ReportTab entries={entries} habit={habit} />}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} style={{ position: "fixed", bottom: 28, right: 28, width: 54, height: 54, borderRadius: "50%", background: G.green, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(61,122,86,.45)", fontSize: 30, color: G.white, zIndex: 300 }}>+</button>

      {showAdd   && <EntryModal habit={habit} onSave={handleSaveNew}  onCancel={() => setShowAdd(false)} />}
      {editEntry && <EntryModal habit={habit} existing={editEntry} onSave={handleSaveEdit} onCancel={() => setEditEntry(null)} />}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ habitEntries }) {
  const today = todayKey();
  const totalEntries = HABITS.reduce((s, h) => s + (habitEntries[h.id]?.length || 0), 0);
  const allStreaks   = HABITS.map((h) => calcStreak(habitEntries[h.id] || []));
  const bestStreak  = Math.max(...allStreaks, 0);
  const bestHabit   = HABITS[allStreaks.indexOf(bestStreak)];
  const doneToday   = HABITS.filter((h) => { const e = (habitEntries[h.id] || []).find((x) => x.date === today); return e && e.count >= h.goal; }).length;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const done = HABITS.filter((h) => { const e = (habitEntries[h.id] || []).find((x) => x.date === key); return e && e.count >= h.goal; }).length;
    return { key, done, label: d.toLocaleDateString("en-US", { weekday: "short" }) };
  });

  const habitStats = HABITS.map((h) => ({
    ...h,
    rate:   successRate(habitEntries[h.id] || [], h.goal),
    streak: calcStreak(habitEntries[h.id] || []),
    avgPct: (() => {
      const ents = habitEntries[h.id] || [];
      return ents.length ? Math.round(ents.reduce((s, e) => s + partialPct(e.count, h.goal), 0) / ents.length) : 0;
    })(),
    entries: (habitEntries[h.id] || []).length,
  })).sort((a, b) => b.avgPct - a.avgPct);

  const catStats = CATEGORIES.map((cat) => {
    const hs = HABITS.filter((h) => h.category === cat);
    const avg = hs.length ? Math.round(hs.reduce((s, h) => s + successRate(habitEntries[h.id] || [], h.goal), 0) / hs.length) : 0;
    return { cat, avg };
  });

  return (
    <div style={{ padding: "24px clamp(16px,4vw,48px)", maxWidth: 1100, margin: "0 auto" }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Today Complete" value={`${doneToday}/${HABITS.length}`} color={doneToday === HABITS.length ? "#22c55e" : G.green} />
        <StatCard label="Total Entries"  value={totalEntries} color="#3b82f6" />
        <StatCard label="Best Streak"    value={`${bestStreak}d`} color={bestStreak >= 10 ? "#a855f7" : "#f59e0b"} />
        <StatCard label="Habits Tracked" value={HABITS.length} color={G.muted} />
      </div>

      {bestStreak >= 3 && (
        <div style={{
          background: bestStreak >= 20 ? "linear-gradient(135deg,#fef3c7,#fde68a)" : bestStreak >= 10 ? "linear-gradient(135deg,#f3e8ff,#e9d5ff)" : "linear-gradient(135deg,#d1fae5,#a7f3d0)",
          borderRadius: 16, padding: "16px 20px", marginBottom: 28,
          border: `1px solid ${bestStreak >= 20 ? "#fcd34d" : bestStreak >= 10 ? "#c084fc" : "#6ee7b7"}`,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 32 }}>{bestStreak >= 20 ? "👑" : bestStreak >= 10 ? "🔥" : "⚡"}</span>
          <div>
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, color: G.text }}>{bestHabit?.icon} {bestHabit?.label}</div>
            <div style={{ fontSize: 13, color: G.muted, fontFamily: "DM Sans, sans-serif", marginTop: 2 }}>{bestStreak >= 20 ? `${bestStreak}-day legend!` : bestStreak >= 10 ? `${bestStreak}-day streak — amazing!` : `${bestStreak}-day streak — keep going!`}</div>
          </div>
        </div>
      )}

      {/* Last 7 days */}
      <div style={{ background: G.white, borderRadius: 18, padding: "20px 22px", marginBottom: 24, border: `1px solid ${G.border}`, boxShadow: "0 1px 6px rgba(30,80,30,.05)" }}>
        <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 17, color: G.text, marginBottom: 16 }}>Last 7 Days</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {last7.map(({ key, done, label }) => {
            const pct = HABITS.length ? Math.round((done / HABITS.length) * 100) : 0;
            const isToday = key === today;
            return (
              <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 11, color: G.faint, fontFamily: "DM Sans, sans-serif" }}>{pct}%</div>
                <div style={{ width: "100%", height: 80, background: "#f1f5f9", borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                  <div style={{ width: "100%", height: `${Math.max(pct, 4)}%`, background: done === HABITS.length ? "#22c55e" : done > 0 ? G.green : "#e2e8f0", borderRadius: "6px 6px 0 0", transition: "height .4s" }} />
                </div>
                <div style={{ fontSize: 11, color: isToday ? G.greenMid : G.faint, fontWeight: isToday ? 700 : 400, fontFamily: "DM Sans, sans-serif" }}>{label}</div>
                <div style={{ fontSize: 10.5, color: G.faint, fontFamily: "DM Sans, sans-serif" }}>{done}/{HABITS.length}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div style={{ background: G.white, borderRadius: 18, padding: "20px 22px", marginBottom: 24, border: `1px solid ${G.border}`, boxShadow: "0 1px 6px rgba(30,80,30,.05)" }}>
        <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 17, color: G.text, marginBottom: 16 }}>Category Performance</div>
        {catStats.map(({ cat, avg }) => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "DM Sans, sans-serif", fontSize: 13, color: G.muted }}>
              <span style={{ color: G.text, fontWeight: 500 }}>{cat}</span>
              <span style={{ color: avg >= 70 ? "#22c55e" : avg >= 40 ? "#f59e0b" : avg > 0 ? "#ef4444" : G.faint, fontWeight: 600 }}>{avg}%</span>
            </div>
            <div style={{ height: 8, background: "#e8f5e9", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${avg}%`, background: avg >= 70 ? "#22c55e" : avg >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 99, transition: "width .5s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ background: G.white, borderRadius: 18, padding: "20px 22px", border: `1px solid ${G.border}`, boxShadow: "0 1px 6px rgba(30,80,30,.05)" }}>
        <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 17, color: G.text, marginBottom: 4 }}>Habit Leaderboard</div>
        <div style={{ fontSize: 12, color: G.faint, fontFamily: "DM Sans, sans-serif", marginBottom: 16 }}>Ranked by avg completion %</div>
        {habitStats.map((h, i) => {
          const col = progressColor(h.avgPct);
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < habitStats.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ width: 24, fontFamily: "DM Serif Display, serif", fontSize: 15, color: i < 3 ? ["#f59e0b","#94a3b8","#cd7f32"][i] : G.faint, textAlign: "center", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: h.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500, fontSize: 14, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{h.label}</div>
                <div style={{ height: 5, background: "#e8f5e9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${h.avgPct}%`, background: col, borderRadius: 99, transition: "width .5s" }} />
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
                <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 17, fontWeight: 700, color: col }}>{h.entries ? `${h.avgPct}%` : "—"}</div>
                <StreakBadge streak={h.streak} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [habitEntries, setHabitEntries] = useState({});
  const [openHabitId, setOpenHabitId]   = useState(null);
  const [mainTab, setMainTab]           = useState("habits");
  const [loaded, setLoaded]             = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("habit:entries:v5"); if (r) setHabitEntries(JSON.parse(r.value)); } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (next) => {
    setHabitEntries(next);
    try { await window.storage.set("habit:entries:v5", JSON.stringify(next)); } catch {}
  }, []);

  // Add new entry for today (replaces existing today entry)
  const addEntry = useCallback((hid, count) => {
    const today = todayKey();
    const prev  = (habitEntries[hid] || []).filter((e) => e.date !== today);
    save({ ...habitEntries, [hid]: [...prev, { id: `${hid}-${today}`, date: today, count }] });
  }, [habitEntries, save]);

  // Edit any existing entry by id
  const editEntry = useCallback((hid, eid, count) => {
    const prev = habitEntries[hid] || [];
    save({ ...habitEntries, [hid]: prev.map((e) => e.id === eid ? { ...e, count } : e) });
  }, [habitEntries, save]);

  // Delete entry by id
  const delEntry = useCallback((hid, eid) => {
    save({ ...habitEntries, [hid]: (habitEntries[hid] || []).filter((e) => e.id !== eid) });
  }, [habitEntries, save]);

  const openHabit = openHabitId ? HABITS.find((h) => h.id === openHabitId) : null;
  const today = todayKey();
  const doneToday = HABITS.filter((h) => { const e = (habitEntries[h.id] || []).find((x) => x.date === today); return e && e.count >= h.goal; }).length;

  if (!loaded) return (
    <div style={{ minHeight: "100vh", width: "100%", background: G.greenLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: G.green, fontFamily: "DM Serif Display, serif", fontSize: 22 }}>Loading…</span>
    </div>
  );

  if (openHabit) return (
    <HabitDetailView
      habit={openHabit}
      entries={habitEntries[openHabit.id] || []}
      onBack={() => setOpenHabitId(null)}
      onAddEntry={addEntry}
      onEditEntry={editEntry}
      onDeleteEntry={delEntry}
    />
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100%; }
        body { background: ${G.greenLight}; -webkit-font-smoothing: antialiased; }
        @keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(10px); } to { opacity:1; transform:none; } }
        input[type=range] { -webkit-appearance:none; background:transparent; width:100%; }
        input[type=range]::-webkit-slider-runnable-track { background:linear-gradient(to right,${G.green} var(--pct,0%),${G.greenBorder} var(--pct,0%)); height:5px; border-radius:99px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:${G.green}; margin-top:-7px; cursor:pointer; box-shadow:0 1px 6px rgba(61,122,86,.35); }
        button { -webkit-tap-highlight-color:transparent; }
        .habit-grid { display:grid; grid-template-columns:1fr; }
        @media(min-width:700px)  { .habit-grid { grid-template-columns:1fr 1fr; gap:0 12px; } }
        @media(min-width:1100px) { .habit-grid { grid-template-columns:1fr 1fr 1fr; gap:0 12px; } }
      `}</style>

      <div style={{ minHeight: "100vh", width: "100%", background: G.greenLight, paddingBottom: 80 }}>

        {/* Sticky header */}
        <div style={{ background: G.greenLight, position: "sticky", top: 0, zIndex: 100, width: "100%" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px clamp(16px,4vw,48px) 0" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "DM Serif Display, serif", fontSize: "clamp(24px,4vw,36px)", color: "#1a2e1a" }}>My Habits</span>
              <div style={{ background: G.white, borderRadius: 10, padding: "6px 14px", fontFamily: "DM Sans, sans-serif", fontSize: "clamp(12px,1.5vw,15px)", color: G.green, fontWeight: 600, border: `1px solid ${G.greenBorder}` }}>
                {doneToday}/{HABITS.length} today
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: G.white, borderRadius: 14, padding: "10px 16px", marginBottom: 12, border: "1px solid #d4e8cf" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11.5, color: G.muted, fontFamily: "DM Sans, sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
                <span>Daily Progress</span>
                <span>{HABITS.length ? Math.round(doneToday / HABITS.length * 100) : 0}%</span>
              </div>
              <div style={{ height: 7, background: "#e8f5e9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: doneToday === HABITS.length ? "#22c55e" : G.green, width: `${HABITS.length ? Math.round(doneToday / HABITS.length * 100) : 0}%`, transition: "width .4s ease" }} />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `2px solid ${G.greenBorder}` }}>
              {["habits","dashboard"].map((t) => (
                <button key={t} onClick={() => setMainTab(t)} style={{
                  padding: "9px 0", minWidth: 100, textAlign: "center", background: "none", border: "none", cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif", fontSize: 14,
                  fontWeight: mainTab === t ? 600 : 400, color: mainTab === t ? G.greenMid : G.muted,
                  borderBottom: mainTab === t ? `2.5px solid ${G.greenMid}` : "2.5px solid transparent", marginBottom: -2, textTransform: "capitalize",
                }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {mainTab === "dashboard" ? (
          <Dashboard habitEntries={habitEntries} />
        ) : (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px clamp(16px,4vw,48px) 0", width: "100%" }}>
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 12.5, color: "#7a9e7a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginLeft: 2 }}>{cat}</div>
                <div className="habit-grid">
                  {HABITS.filter((h) => h.category === cat).map((habit) => (
                    <HabitCard key={habit.id} habit={habit} entries={habitEntries[habit.id] || []} onOpen={setOpenHabitId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}