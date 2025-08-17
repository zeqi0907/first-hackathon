import React, { useMemo, useRef, useState } from "react";

// Single-file React app — no external libraries.
// Beautiful UI via modern CSS (no Tailwind, no frameworks).
// Features:
// 1) Load resumes (paste JSON or upload .json/.csv)
// 2) Filter by basic requirements
// 3) Choose analysis priorities (weights) + keyword boosts
// 4) Score, sort, compare, and print clean summaries

const EDU_ORDER = { "High School": 0, Diploma: 1, Bachelor: 2, Master: 3, PhD: 4 };

export default function App() {
  // -------------------- Sample Data --------------------
  const sampleResumes = useMemo(
    () => [
      {
        id: "R-001",
        name: "Aisha Rahman",
        email: "aisha@example.com",
        phone: "+60-12-3456789",
        location: "Kuala Lumpur",
        yearsExp: 3,
        education: [
          { level: "Bachelor", field: "Computer Science", institution: "UM" },
        ],
        skills: ["JavaScript", "React", "CSS", "Node.js", "REST"],
        projects: [
          { title: "Inventory App", description: "Built MERN app" },
          { title: "Portfolio", description: "Responsive site" },
        ],
        certifications: ["AWS Cloud Practitioner"],
        summary:
          "Frontend dev with React focus, built dashboards and component libraries.",
      },
      {
        id: "R-002",
        name: "Ben Tan",
        email: "ben.tan@example.com",
        phone: "+60-17-2223344",
        location: "Penang",
        yearsExp: 6,
        education: [
          { level: "Master", field: "Software Engineering", institution: "USM" },
        ],
        skills: ["TypeScript", "React", "Next.js", "GraphQL", "Leadership"],
        projects: [
          { title: "E-commerce", description: "SSR storefront" },
          { title: "Design System", description: "Built TS component lib" },
          { title: "ML Ops", description: "Infra glue" },
        ],
        certifications: ["Scrum Master"],
        summary:
          "Lead FE engineer, managed 4 devs, shipped high-traffic SPAs.",
      },
      {
        id: "R-003",
        name: "Chong Wei Lim",
        email: "cw.lim@example.com",
        phone: "+60-13-9988776",
        location: "Ipoh",
        yearsExp: 1,
        education: [{ level: "Diploma", field: "IT", institution: "UTAR" }],
        skills: ["HTML", "CSS", "JavaScript", "Figma"],
        projects: [{ title: "Landing Pages" }],
        certifications: [],
        summary: "Junior web dev; strong on UI polish and accessibility.",
      },
      {
        id: "R-004",
        name: "Divya Nair",
        email: "divya.nair@example.com",
        phone: "+60-11-5554443",
        location: "Johor Bahru",
        yearsExp: 4,
        education: [
          { level: "Bachelor", field: "Information Systems", institution: "UTM" },
        ],
        skills: ["React", "Redux", "Testing", "Cypress", "REST", "Docker"],
        projects: [
          { title: "Analytics Dashboard" },
          { title: "QA Automation" },
        ],
        certifications: ["ISTQB"],
        summary: "SWE with testing focus; shipped stable dashboards.",
      },
    ],
    []
  );

  // -------------------- State --------------------
  const [resumes, setResumes] = useState(sampleResumes);
  const [rawInput, setRawInput] = useState("");
  const fileInputRef = useRef(null);

  // Filter state
  const [minYears, setMinYears] = useState(0);
  const [minEdu, setMinEdu] = useState("High School");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [locationContains, setLocationContains] = useState("");

  // Analysis weights (0-5)
  const [wExp, setWExp] = useState(3);
  const [wSkills, setWSkills] = useState(4);
  const [wEdu, setWEdu] = useState(2);
  const [wProj, setWProj] = useState(2);
  const [wCert, setWCert] = useState(1);
  const [keywordBoost, setKeywordBoost] = useState("react, leadership, testing");

  const [selected, setSelected] = useState([]); // Resume that user has selected
  const [sortDir, setSortDir] = useState("desc"); // Sort direction
  const [tab, setTab] = useState("ingest"); // Default tab

  // -------------------- Helpers --------------------

  // Ensure that " React " and "react" are read as the same thing
  function normalize(str) {
    return (str || "").trim().toLowerCase();
  }

  // Calculate same elements between 2 arrays (like resume skills & skills required)
  function intersectCount(a, b) {
    const setB = new Set(b.map(normalize));
    let n = 0;
    for (const x of a) if (setB.has(normalize(x))) n++;
    return n;
  }

  // If user paste JSON data, save it to resumes
  function loadJSONInput() {
    try {
      const parsed = JSON.parse(rawInput);  // Parse raw input (JSON) into JSON
      if (Array.isArray(parsed)) {  // Ensure that parsed info is an array
        setResumes(parsed); // Update parsed info to `resume`, UI update
      } else {
        alert("JSON must be an array of resumes");
      }
    } catch (e) { // If JSON format wrong, cannot turn into array, pop out this
      alert("Invalid JSON");
    }
  }

  // Allow user to upload either JSON file or PDF file,
  // Then check on the files, whether 
  function onUploadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (file.name.endsWith(".json")) {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) setResumes(arr);
          else alert("JSON must be an array");
        } catch (e) {
          alert("Invalid JSON file");
        }
      } else if (file.name.endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload-pdf", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setResumes(data);
            } else {
              alert("PDF parsed but result is not an array");
            }
          })
          .catch(() => {
            alert("PDF upload failed");
          });
      } else {
        alert("Only .json or .pdf supported");
      }
    };
    reader.readAsText(file);
  }

  // -------------------- Filtering --------------------
  const filtered = useMemo(() => {
    const reqSkills = requiredSkills
      .split(/[,|]/)
      .map((s) => normalize(s))
      .filter(Boolean);
    const loc = normalize(locationContains);

    return resumes.filter((r) => {
      if ((r.yearsExp || 0) < minYears) return false;
      const topEdu = (r.education || []).reduce((m, e) => Math.max(m, EDU_ORDER[e.level] ?? 0), 0);
      if (topEdu < (EDU_ORDER[minEdu] ?? 0)) return false;

      if (reqSkills.length) {
        const n = intersectCount(r.skills || [], reqSkills);
        if (n < reqSkills.length) return false; // must include all required
      }
      if (loc && !normalize(r.location).includes(loc)) return false;
      return true;
    });
  }, [resumes, minYears, minEdu, requiredSkills, locationContains]);

  // -------------------- Scoring --------------------
  const keywordList = useMemo(
    () => keywordBoost.split(/[,|]/).map((s) => normalize(s)).filter(Boolean),
    [keywordBoost]
  );

  function scoreResume(r) {
    const topEdu = (r.education || []).reduce((m, e) => Math.max(m, EDU_ORDER[e.level] ?? 0), 0);
    const expScore = r.yearsExp || 0; // 1 point per year
    const skillsScore = (r.skills || []).length; // count skills
    const projScore = (r.projects || []).length || 0;
    const certScore = (r.certifications || []).length || 0;
    let eduScore = topEdu * 2; // weight education levels a bit

    // Keyword boost scans summary + projects + skills
    const hay = [r.summary || "", ...(r.projects || []).map((p) => p.description || ""), ...(r.skills || [])]
      .join(" ")
      .toLowerCase();
    let kwScore = 0;
    for (const kw of keywordList) if (kw && hay.includes(kw)) kwScore += 2;

    const weighted =
      wExp * expScore +
      wSkills * skillsScore +
      wEdu * eduScore +
      wProj * projScore +
      wCert * certScore +
      kwScore;

    return Math.round(weighted * 10) / 10;
  }

  const scored = useMemo(() => {
    const arr = filtered.map((r) => ({ ...r, __score: scoreResume(r) }));
    arr.sort((a, b) => (sortDir === "desc" ? b.__score - a.__score : a.__score - b.__score));
    return arr;
  }, [filtered, sortDir, wExp, wSkills, wEdu, wProj, wCert, keywordList]);

  // -------------------- Selection & Print --------------------
  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function printSelection() {
    const toPrint = selected.length ? scored.filter((r) => selected.includes(r.id)) : scored;
    const html = renderPrintHTML(toPrint);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  function renderPrintHTML(list) {
    const style = `
      <style>
        * { box-sizing: border-box; }
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1 { margin: 0 0 16px; }
        .resume { border: 1px solid #e5e7eb; padding: 16px; margin-bottom: 12px; border-radius: 12px; background: #fff; }
        .meta { display: flex; flex-wrap: wrap; gap: 12px; color: #334155; }
        .tag { display: inline-block; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 999px; margin: 2px; font-size: 12px; background:#f8fafc; }
        .score { font-weight: 700; }
        @media print { .resume { break-inside: avoid; } }
      </style>
    `;

    const body = `
      <h1>Resume Extract</h1>
      ${list
        .map(
          (r) => `
          <div class="resume">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <div>
                <div style="font-size:18px;font-weight:800;">${escapeHTML(r.name || "")}</div>
                <div class="meta">
                  <span>${escapeHTML(r.email || "")}</span>
                  <span>${escapeHTML(r.phone || "")}</span>
                  <span>${escapeHTML(r.location || "")}</span>
                  <span>${r.yearsExp || 0} yrs</span>
                </div>
              </div>
              ${r.__score !== undefined ? `<div class="score">Score: ${r.__score}</div>` : ""}
            </div>
            ${r.summary ? `<p>${escapeHTML(r.summary)}</p>` : ""}
            <div><strong>Skills:</strong> ${(r.skills || []).map((s) => `<span class="tag">${escapeHTML(s)}</span>`).join(" ")}</div>
            ${(r.education || []).length ? `<div><strong>Education:</strong> ${(r.education || [])
              .map((e) => `${escapeHTML(e.level || "")} ${e.field ? `in ${escapeHTML(e.field)}` : ""} ${e.institution ? `@ ${escapeHTML(e.institution)}` : ""}`)
              .join("; ")}</div>` : ""}
            ${(r.projects || []).length ? `<div><strong>Projects:</strong> ${(r.projects || [])
              .map((p) => `${escapeHTML(p.title || "")}${p.description ? ` — ${escapeHTML(p.description)}` : ""}`)
              .join("; ")}</div>` : ""}
            ${(r.certifications || []).length ? `<div><strong>Certifications:</strong> ${(r.certifications || []).map(escapeHTML).join(", ")}</div>` : ""}
          </div>
        `
        )
        .join("")}
    `;

    return `<!doctype html><html><head><meta charset="utf-8"/>${style}</head><body>${body}</body></html>`;
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -------------------- UI --------------------
  return (
    <div style={styles.app}>
      <style>{baseCSS}</style>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Resume Screener</h1>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Frontend-only · No external libraries</div>
          </div>
        </div>
        <nav style={styles.tabs}>
          {[
            { k: "ingest", label: "1. Ingest" },
            { k: "filter", label: "2. Filter" },
            { k: "analyze", label: "3. Analyze & Score" },
            { k: "compare", label: "4. Compare & Print" },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} style={tabBtn(tab === t.k)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "ingest" && (
        <section style={styles.panel}>
          <Card title="Load Resumes" subtitle="Paste JSON array or simple CSV, or upload a .json/.csv file.">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setResumes(sampleResumes)} className="btn">Use Sample</button>
              <button onClick={() => setResumes([])} className="btn ghost">Clear</button>
              <label className="file">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) onUploadFile(f);
                  }}
                />
                Upload .json/.csv
              </label>
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={`JSON example (array of resumes).\nCSV header: id,name,email,phone,location,yearsExp,skills,education\nskills: pipe-separated; education: level:field:inst;level:field:inst`}
              style={styles.textarea}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={loadJSONInput} className="btn">Load JSON</button>
            </div>
            <SummaryBar resumes={resumes} />
            <ResumeTable data={resumes} selectable={false} selected={selected} onToggleSelect={() => {}} />
          </Card>
        </section>
      )}

      {tab === "filter" && (
        <section style={styles.panel}>
          <Card title="Basic Requirements" subtitle="Filter down to candidates who match the must-haves.">
            <div style={styles.grid2}>
              <InputL label="Minimum Years of Experience">
                <input type="number" min={0} value={minYears} onChange={(e) => setMinYears(Number(e.target.value))} />
              </InputL>
              <InputL label="Minimum Education Level">
                <select value={minEdu} onChange={(e) => setMinEdu(e.target.value)}>
                  {Object.keys(EDU_ORDER).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </InputL>
              <InputL label="Required Skills (comma or |)">
                <input value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="react, typescript" />
              </InputL>
              <InputL label="Location contains">
                <input value={locationContains} onChange={(e) => setLocationContains(e.target.value)} placeholder="Kuala" />
              </InputL>
            </div>
            <SummaryBar resumes={filtered} label="After Filter" />
            <ResumeTable data={filtered} selectable selected={selected} onToggleSelect={toggleSelect} />
          </Card>
        </section>
      )}

      {tab === "analyze" && (
        <section style={styles.panel}>
          <Card title="Analysis Priorities" subtitle="Adjust weights (0–5). Keywords give small bonuses.">
            <div style={styles.grid2}>
              <Weight label="Experience" value={wExp} onChange={setWExp} />
              <Weight label="Skills" value={wSkills} onChange={setWSkills} />
              <Weight label="Education" value={wEdu} onChange={setWEdu} />
              <Weight label="Projects" value={wProj} onChange={setWProj} />
              <Weight label="Certifications" value={wCert} onChange={setWCert} />
              <InputL label="Keyword Boosts (comma or |)">
                <input value={keywordBoost} onChange={(e) => setKeywordBoost(e.target.value)} />
              </InputL>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span className="muted">Sort</span>
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                <option value="desc">Highest first</option>
                <option value="asc">Lowest first</option>
              </select>
            </div>
            <SummaryBar resumes={scored} label="Scored" scoreKey="__score" />
            <ResumeTable data={scored} selectable selected={selected} onToggleSelect={toggleSelect} showScore />
          </Card>
        </section>
      )}

      {tab === "compare" && (
        <section style={styles.panel}>
          <Card title="Compare & Print" subtitle="Select up to 3 candidates to compare and print a clean summary.">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={printSelection} className="btn">Print Selected / All</button>
              <button onClick={() => setSelected([])} className="btn ghost">Clear Selection</button>
            </div>
            <CompareGrid resumes={scored.filter((r) => selected.includes(r.id)).slice(0, 3)} />
            <ResumeTable data={scored} selectable selected={selected} onToggleSelect={toggleSelect} showScore />
          </Card>
        </section>
      )}

      <footer style={{ padding: 24, fontSize: 12, color: "#64748b", textAlign: "center" }}>
        Frontend-only demo. Your data stays in the browser. No external libraries.
      </footer>
    </div>
  );
}

// -------------------- Small Components --------------------
function Card({ title, subtitle, children }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          {subtitle ? <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function InputL({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Weight({ label, value, onChange }) {
  return (
    <div>
      <label>
        {label} Weight: <strong>{value}</strong>
      </label>
      <input type="range" min={0} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function SummaryBar({ resumes, label = "Loaded", scoreKey }) {
  const avgYears = resumes.length ? (resumes.reduce((s, r) => s + (r.yearsExp || 0), 0) / resumes.length).toFixed(1) : 0;
  const avgScore = scoreKey && resumes.length ? (resumes.reduce((s, r) => s + (r[scoreKey] || 0), 0) / resumes.length).toFixed(1) : undefined;
  return (
    <div style={styles.summary}>
      <strong>{label}:</strong> {resumes.length} resumes · avg exp {avgYears} yrs {avgScore !== undefined ? `· avg score ${avgScore}` : ""}
    </div>
  );
}

function ResumeTable({ data, selectable, selected, onToggleSelect, showScore = false }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {selectable ? <th style={{ width: 36 }}></th> : null}
            <th>ID</th>
            <th>Name</th>
            <th>Years</th>
            <th>Top Education</th>
            <th>Skills</th>
            <th>Projects</th>
            <th>Location</th>
            {showScore ? <th>Score</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id}>
              {selectable ? (
                <td>
                  <input type="checkbox" checked={selected.includes(r.id)} onChange={() => onToggleSelect(r.id)} />
                </td>
              ) : null}
              <td>{r.id}</td>
              <td>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{(r.email || "") + (r.phone ? ` · ${r.phone}` : "")}</div>
              </td>
              <td>{r.yearsExp || 0}</td>
              <td>{(r.education || []).length ? (r.education || []).reduce((best, e) => (EDU_ORDER[e.level] > EDU_ORDER[best.level] ? e : best), (r.education || [])[0]).level : "—"}</td>
              <td>{(r.skills || []).slice(0, 6).join(", ")}{(r.skills || []).length > 6 ? "…" : ""}</td>
              <td>{(r.projects || []).length || 0}</td>
              <td>{r.location || ""}</td>
              {showScore ? <td><strong>{r.__score}</strong></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareGrid({ resumes }) {
  if (!resumes.length) return <div style={{ marginTop: 12 }} className="muted">No candidates selected.</div>;
  return (
    <div style={styles.compareGrid}>
      {resumes.map((r) => (
        <div key={r.id} style={styles.compareCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{r.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{(r.email || "") + (r.phone ? ` · ${r.phone}` : "")}</div>
            </div>
            <div style={{ fontWeight: 800 }}>Score {r.__score}</div>
          </div>
          {r.summary ? <p style={{ marginTop: 8 }}>{r.summary}</p> : null}
          <div><strong>Years:</strong> {r.yearsExp || 0}</div>
          <div><strong>Education:</strong> {(r.education || []).map((e) => `${e.level}${e.field ? ` in ${e.field}` : ""}${e.institution ? ` @ ${e.institution}` : ""}`).join("; ")}</div>
          <div><strong>Skills:</strong> {(r.skills || []).join(", ")}</div>
          <div><strong>Projects:</strong> {(r.projects || []).map((p) => p.title).join(", ")}</div>
          {(r.certifications || []).length ? <div><strong>Certifications:</strong> {(r.certifications || []).join(", ")}</div> : null}
        </div>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#111827"/>
          <stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#g)" strokeWidth="1.6"/>
      <path d="M7 8h10M7 12h10M7 16h6" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// -------------------- Styles --------------------
const styles = {
  app: { maxWidth: 1100, margin: "0 auto", padding: 16 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    position: "sticky",
    top: 0,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "saturate(180%) blur(8px)",
    borderBottom: "1px solid #e2e8f0",
    zIndex: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  panel: { padding: 12 },
  textarea: { width: "100%", minHeight: 160, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", padding: 10, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 12 },
  summary: { marginTop: 12, padding: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12 },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
  compareGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 },
  compareCard: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, boxShadow: "0 8px 24px rgba(15,23,42,0.04)", background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" },
  card: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, boxShadow: "0 8px 30px rgba(2,6,23,0.06)", background: "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)" },
};

const baseCSS = `
  :root { --c:#0f172a; --b:#fff; --muted:#64748b; --line:#e2e8f0; --accent:#0f172a; --accent2:#0ea5e9; }
  body { color: var(--c); background: var(--b); }
  h2 { margin: 0 0 8px; font-size: 18px; }
  label { display:block; font-size:12px; color:var(--muted); margin-bottom: 6px; }
  input, select, textarea { padding: 10px; border:1px solid var(--line); border-radius: 12px; outline: none; width: 100%; background: #fff; transition: box-shadow .2s, border-color .2s; }
  input[type=checkbox] { width: auto; }
  input:focus, select:focus, textarea:focus { border-color: var(--accent2); box-shadow: 0 0 0 4px rgba(14,165,233,0.15); }
  table th, table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--line); }
  table thead th { background: #f8fafc; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color:#334155 }
  .btn { background: var(--c); color: white; border: none; padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 700; transition: transform .05s ease, filter .15s ease; }
  .btn:hover { filter: brightness(0.95); }
  .btn:active { transform: translateY(1px); }
  .btn.ghost { background: #fff; color: var(--c); border: 1px solid var(--line); }
  .muted { color: var(--muted); }
  .file { display:inline-flex; align-items:center; gap:8px; border:1px dashed var(--line); padding:10px 14px; border-radius:12px; cursor:pointer; }
  .file input { display:none; }
`;

function tabBtn(active) {
  return {
    background: active ? "#0f172a" : "#fff",
    color: active ? "#fff" : "#0f172a",
    border: "1px solid #0f172a",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    transition: "all .15s ease",
  };
}
