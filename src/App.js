import React, { useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   Company Management System (single-file React)
   - Real-time validation + inline icons
   - Force phone to include country code (+60) and auto-format
   - HR (Screener) includes a Home tab / quick overview
   ========================================================= */

export default function App() {
  const baseCSS = `
    :root { --c:#0f172a; --b:#fff; --muted:#64748b; --line:#e2e8f0; --accent:#0f172a; --accent2:#0ea5e9; }
    body { color: var(--c); background: var(--b); }
    h2 { margin: 0 0 8px; font-size: 18px; }
    label { display:block; font-size:12px; color:var(--muted); margin-bottom: 6px; }
    input, select, textarea { padding: 10px; border:1px solid var(--line); border-radius: 12px; outline: none; width: 100%; background: #fff; transition: box-shadow .2s, border-color .2s; box-sizing: border-box; }
    input[type=checkbox] { width: auto; }
    input:focus, select:focus, textarea:focus { border-color: var(--accent2); box-shadow: 0 0 0 4px rgba(14,165,233,0.12); }
    table th, table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--line); }
    table thead th { background: #f8fafc; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color:#334155 }
    .btn { background: var(--c); color: white; border: none; padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 700; transition: transform .05s ease, filter .15s ease; }
    .btn:hover { filter: brightness(0.95); }
    .btn:active { transform: translateY(1px); }
    .btn.ghost { background: #fff; color: var(--c); border: 1px solid var(--line); }
    .muted { color: var(--muted); }
    .file { display:inline-flex; align-items:center; gap:8px; border:1px dashed var(--line); padding:10px 14px; border-radius:12px; cursor:pointer; }
    .file input { display:none; }
    .field-error { color: #b91c1c; font-size: 12px; margin-top: 6px; }
    .field-hint { color: #16a34a; font-size: 12px; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
    .field-row { display:flex; gap:8px; align-items:center; }
    .field-inline { display:flex; align-items:center; gap:8px; }
    .input-with-icon { display:flex; align-items:center; gap:8px; }
    .icon { width:18px; height:18px; display:inline-block; }
    .icon.success svg { filter: drop-shadow(0 1px 0 rgba(0,0,0,0.05)); }
    .icon.error { width:16px; height:16px; }
    .small-muted { font-size:12px; color:var(--muted); }
    .stat { padding:12px; border-radius:12px; border:1px solid #e2e8f0; background: #fff; }
  `;

  // ---------- Auth ----------
  const ACCOUNTS = {
    new: { username: "new", password: "new123" },
    user: { username: "user", password: "user123" },
    hr: { username: "hr", password: "hr123" },
  };

  const [auth, setAuth] = useState({ loggedIn: false, role: "", who: "" });
  const [loginU, setLoginU] = useState("");
  const [loginP, setLoginP] = useState("");

  function tryLogin() {
    const matched =
      (loginU === ACCOUNTS.new.username && loginP === ACCOUNTS.new.password && "new") ||
      (loginU === ACCOUNTS.user.username && loginP === ACCOUNTS.user.password && "user") ||
      (loginU === ACCOUNTS.hr.username && loginP === ACCOUNTS.hr.password && "hr") ||
      "";
    if (!matched) return alert("Invalid username or password.");
    setAuth({ loggedIn: true, role: matched, who: loginU });
  }
  function logout() {
    setAuth({ loggedIn: false, role: "", who: "" });
    setLoginU("");
    setLoginP("");
    setOnbComplete(false);
    setCreatedCredentials(null);
  }

  // ---------- Onboarding ----------
  const EDUCATION_LEVELS = ["High School", "Diploma", "Bachelor", "Master", "PhD"];
  const MENTORS = [
    { name: "Dr. Sarah Tan", email: "sarah.tan@company.com", dept: "AI & SWE" },
    { name: "Jason Lim", email: "jason.lim@company.com", dept: "Frontend" },
    { name: "Divya Nair", email: "divya.nair@company.com", dept: "QA/Automation" },
    { name: "Ben Tan", email: "ben.tan@company.com", dept: "Platform" },
  ];

  const [onb, setOnb] = useState({
    fullName: "",
    personalEmail: "",
    phone: "",
    address: "",
    dob: "",
    positionTitle: "",
    department: "",
    startDate: "",
    employmentType: "Full-time",
    managerName: "",
    educationHighest: "",
    skills: "",
    bankName: "",
    bankAccount: "",
    taxId: "",
    emName: "",
    emRelation: "",
    emPhone: "",
    tshirt: "M",
    dietary: "",
    preferredUsername: "",
    preferredPassword: "",
  });
  const [onbComplete, setOnbComplete] = useState(false);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [createdEmail, setCreatedEmail] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // errors state for inline validation messages
  const [onbErrors, setOnbErrors] = useState({});

  function sanitizeUsername(u) {
    return (u || "").trim().toLowerCase().replace(/\s+/g, ".");
  }

  // Validation helpers
  function validateEmailFormat(email) {
    if (!email) return false;
    const s = String(email).trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s);
  }
  function validatePhoneFormat(phone) {
    if (!phone) return false;
    const s = String(phone).trim();
    // allow + and digits/spaces/dashes/parens; ensure at least 7 digits
    const digits = s.replace(/[^\d]/g, "");
    if (digits.length < 7) return false;
    const re = /^[+\d]?(?:[\d\s\-()]){7,20}$/;
    return re.test(s);
  }
  function validatePasswordFormat(pwd) {
    if (!pwd) return false;
    const s = String(pwd);
    return s.length >= 6 && !/\s/.test(s);
  }
  function validateUsernameFormat(u) {
    if (!u) return false;
    const s = String(u).trim();
    const re = /^[a-zA-Z0-9._]{3,30}$/;
    return re.test(s);
  }

  // ---------- Phone formatting helpers ----------
  // Normalize input and auto-prefix +60 if user didn't include a country code.
  // Also format into spaced groups for readability.
  function normalizeAndFormatPhone(raw) {
    if (!raw && raw !== "") return raw;
    // keep leading plus if present, remove other non-digit characters
    let s = String(raw || "");
    // Remove letters and repeated pluses, keep digits and plus
    s = s.replace(/[A-Za-z]/g, "");
    // compress multiple + into single
    s = s.replace(/\++/g, "+");
    // remove any chars except digits and +
    s = s.replace(/[^\d+]/g, "");

    // If it starts with 0, replace leading 0 with +60 (Malaysia)
    if (/^0\d+/.test(s)) {
      s = "+60" + s.replace(/^0+/, "");
    } else if (!s.startsWith("+")) {
      // If user didn't type a plus at all, assume +60 and prefix (non-destructive)
      // But if user typed country code without + (like 6012...) we also prefix +.
      s = "+60" + s.replace(/^\+/, "");
    }

    // ensure pattern +CCrest where CC is 1-3 digits
    const m = s.match(/^\+?(\d{1,3})(\d*)$/);
    if (!m) return s;

    const cc = m[1]; // country code digits
    const rest = m[2] || "";

    // group rest digits into chunks of 3 for readability (final chunk may be shorter)
    const groups = rest.match(/.{1,3}/g) || [];
    return `+${cc}${groups.length ? " " + groups.join(" ") : ""}`;
  }

  // Real-time validation: update state + validate as user types
  function handleChangeAndValidate(field, rawValue) {
    let value = rawValue;

    // If phone fields, normalize & format immediately
    if (field === "phone" || field === "emPhone") {
      value = normalizeAndFormatPhone(rawValue);
    }

    setOnb((prev) => ({ ...prev, [field]: value }));

    setOnbErrors((prev) => {
      const next = { ...prev };

      // Strict checks for certain fields
      if (field === "personalEmail") {
        if (!value) next.personalEmail = "Personal email is required.";
        else if (!validateEmailFormat(value)) next.personalEmail = "Enter a valid email (e.g. you@example.com).";
        else next.personalEmail = "";
      } else if (field === "phone") {
        if (!value) next.phone = "Phone is required.";
        else if (!validatePhoneFormat(value)) next.phone = "Enter a valid phone (digits, +, spaces, - allowed).";
        else next.phone = "";
      } else if (field === "emPhone") {
        if (!value) next.emPhone = "Emergency phone is required.";
        else if (!validatePhoneFormat(value)) next.emPhone = "Enter a valid emergency phone.";
        else next.emPhone = "";
      } else if (field === "preferredPassword") {
        if (!value) next.preferredPassword = "Password is required.";
        else if (!validatePasswordFormat(value)) next.preferredPassword = "Password must be ≥6 characters and contain no spaces.";
        else next.preferredPassword = "";
      } else if (field === "preferredUsername") {
        if (!value) next.preferredUsername = "Preferred username is required.";
        else if (!validateUsernameFormat(value)) next.preferredUsername = "Use 3–30 chars: letters, numbers, ., _";
        else next.preferredUsername = "";
      } else {
        // For all other fields: non-blocking validation — show green tick when non-empty
        if (String(value).trim()) next[field] = ""; // clear any previous error so green tick appears
        else next[field] = ""; // remain empty
      }
      return next;
    });
  }

  // Validate the whole onboarding form before submit (summarise)
  function validateOnboarding() {
    const req = [
      ["fullName", "Full Name"],
      ["personalEmail", "Personal Email"],
      ["phone", "Phone"],
      ["positionTitle", "Position Title"],
      ["department", "Department"],
      ["startDate", "Start Date"],
      ["preferredUsername", "Preferred Gmail Username"],
      ["preferredPassword", "Preferred Gmail Password"],
      ["emName", "Emergency Contact Name"],
      ["emPhone", "Emergency Contact Phone"],
    ];
    const errors = {};

    for (const [k] of req) {
      if (!String(onb[k]).trim()) {
        errors[k] = `${k} is required.`;
      }
    }

    // format checks (again)
    if (onb.personalEmail && !validateEmailFormat(onb.personalEmail))
      errors.personalEmail = "Enter a valid email (e.g. you@example.com).";
    if (onb.phone && !validatePhoneFormat(onb.phone))
      errors.phone = "Enter a valid phone (digits, +, spaces, - allowed).";
    if (onb.emPhone && !validatePhoneFormat(onb.emPhone))
      errors.emPhone = "Enter a valid emergency phone.";
    if (onb.preferredPassword && !validatePasswordFormat(onb.preferredPassword))
      errors.preferredPassword = "Password must be ≥6 characters and contain no spaces.";
    if (onb.preferredUsername && !validateUsernameFormat(onb.preferredUsername))
      errors.preferredUsername = "Use 3–30 chars: letters, numbers, ., _";

    if (Object.keys(errors).length) {
      setOnbErrors((prev) => ({ ...prev, ...errors }));
      const msgs = Object.entries(errors).map(([k, v]) => `- ${k}: ${v}`);
      alert("Please fix the following:\n" + msgs.join("\n"));
      return false;
    }

    setOnbErrors({});
    return true;
  }

  async function createUserOnBackend(payload) {
    const url = "http://127.0.0.1:5000/create_user";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn("Backend create_user returned error:", data);
        throw new Error(data.error || "Backend error");
      }
      return { success: true, data };
    } catch (err) {
      console.warn("createUserOnBackend failed:", err);
      return { success: false, error: err };
    }
  }

  async function submitOnboarding() {
    if (!validateOnboarding()) return;
    const payload = { ...onb };
    try {
      const result = await createUserOnBackend(payload);
      if (result.success && result.data) {
        const backend = result.data;
        const username = backend.username || sanitizeUsername(onb.preferredUsername);
        const password = backend.password || onb.preferredPassword;
        const email = backend.email || `${username}@gmail.com`;
        setCreatedCredentials({ username, password, email, fromBackend: true });
        setCreatedEmail(email);
        if (backend.assignedMentor) {
          setAssignedMentor(backend.assignedMentor);
        } else {
          const m = MENTORS[Math.floor(Math.random() * MENTORS.length)];
          setAssignedMentor(m);
        }
        setAuth({ loggedIn: true, role: "user", who: username });
        setOnbComplete(true);
        return;
      } else {
        const username = sanitizeUsername(onb.preferredUsername);
        const password = onb.preferredPassword;
        const email = `${username}@gmail.com`;
        setCreatedEmail(email);
        const m = MENTORS[Math.floor(Math.random() * MENTORS.length)];
        setAssignedMentor(m);
        setCreatedCredentials({ username, password, email, fromBackend: false });
        setOnbComplete(true);
        setAuth({ loggedIn: true, role: "user", who: username });
        alert("Backend not reachable — created account locally and logged you in. In production, ensure backend /create_user is available.");
        return;
      }
    } catch (err) {
      console.error("submitOnboarding error:", err);
      const username = sanitizeUsername(onb.preferredUsername);
      const password = onb.preferredPassword;
      const email = `${username}@gmail.com`;
      setCreatedEmail(email);
      const m = MENTORS[Math.floor(Math.random() * MENTORS.length)];
      setAssignedMentor(m);
      setCreatedCredentials({ username, password, email, fromBackend: false });
      setOnbComplete(true);
      setAuth({ loggedIn: true, role: "user", who: username });
      alert("Unexpected error; created account locally and logged you in.");
    }
  }

  // helper for showing icons
  function FieldIcon({ field }) {
    const val = (onb[field] ?? "").toString();
    const err = onbErrors[field];
    if (!val) return null;
    if (err) {
      return (
        <span className="icon error" title={err}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.4" fill="#fff" />
            <path d="M12 8v5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16h.01" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    }
    return (
      <span className="icon success" title="Looks good">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ecfdf5" />
          <path d="M16 9l-4.5 6L8 12.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  // ---------- Render ----------
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <style>{baseCSS}</style>

      {/* Top bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "saturate(180%) blur(8px)",
          borderBottom: "1px solid #e2e8f0",
          borderRadius: 12,
          marginTop: 8,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#111827" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#g)" strokeWidth="1.6" />
            <path d="M7 8h10M7 12h10M7 16h6" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Company Management System</h1>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Roles: new · user · hr</div>
          </div>
        </div>
        <div>
          {auth.loggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted">
                Logged in as <strong>{auth.who}</strong> ({auth.role})
              </span>
              <button className="btn ghost" onClick={logout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Auth gate */}
      {!auth.loggedIn ? (
        <section className="login-container" style={{ display: "flex", height: "60vh", marginTop: "20px" }}>
          {/* Left side: Login box */}
          <div className="login-box" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: "80%", maxWidth: 400 }}>
              <h2 style={{ marginBottom: 8 }}>Login</h2>
              <div className="muted" style={{ marginBottom: 12 }}>
                Use one of: <code>new/new123</code> · <code>user/user123</code> · <code>hr/hr123</code>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label>Username</label>
                  <input value={loginU} onChange={(e) => setLoginU(e.target.value)} placeholder="e.g. hr" style={{ width: "100%" }} />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" value={loginP} onChange={(e) => setLoginP(e.target.value)} placeholder="••••••" style={{ width: "100%" }} />
                </div>
                <button className="btn" onClick={tryLogin} style={{ marginTop: "10px", width: "106%" }}>
                  Login
                </button>
              </div>
            </div>
          </div>

          {/* Right side: Picture */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f5f5f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderTopRightRadius: "20px",
              borderBottomRightRadius: "20px",
              overflow: "hidden",
              boxShadow: "-30px 3px 20px rgba(16,44,67,0.2)",
            }}
          >
            <img src="/backgroundpic.jpg" alt="Onboarding Illustration" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0 20px 20px 0" }} />
          </div>
        </section>
      ) : auth.role === "new" ? (
        <section style={{ padding: 12 }}>
          <div style={{ maxWidth: "100%", margin: "0 auto" }}>
            {!onbComplete ? (
              <div style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 16, background: "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)" }}>
                <h2>Onboarding — New Employee Info</h2>
                <div className="muted" style={{ marginTop: 4, marginBottom: 12 }}>
                  Fill required fields. Gmail account will be created from your preferred username. Validation is real-time; green ticks mean "non-empty & OK".
                </div>

                <div style={{ marginTop: 24 }}>
                  {/* Personal */}
                  <h3 style={{ marginBottom: 12 }}>Personal</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label>Full Name *</label>
                      <div className="input-with-icon">
                        <input value={onb.fullName} onChange={(e) => handleChangeAndValidate("fullName", e.target.value)} placeholder="John Tan" />
                        <FieldIcon field="fullName" />
                      </div>
                      {onbErrors.fullName ? <div className="field-error">{onbErrors.fullName}</div> : null}
                    </div>

                    <div>
                      <label>Personal Email *</label>
                      <div className="input-with-icon">
                        <input value={onb.personalEmail} onChange={(e) => handleChangeAndValidate("personalEmail", e.target.value)} placeholder="abc@gmail.com" style={onbErrors.personalEmail ? { borderColor: "#fb7185" } : {}} />
                        <FieldIcon field="personalEmail" />
                      </div>
                      {onbErrors.personalEmail ? <div className="field-error">{onbErrors.personalEmail}</div> : <div className="field-hint" style={{ display: onb.personalEmail && !onbErrors.personalEmail ? "flex" : "none" }}>✓ Valid email</div>}
                    </div>

                    <div>
                      <label>Phone *</label>
                      <div className="input-with-icon">
                        <input value={onb.phone} onChange={(e) => handleChangeAndValidate("phone", e.target.value)} placeholder="012-345 6789" style={onbErrors.phone ? { borderColor: "#fb7185" } : {}} />
                        <FieldIcon field="phone" />
                      </div>
                      {onbErrors.phone ? <div className="field-error">{onbErrors.phone}</div> : <div className="field-hint" style={{ display: onb.phone && !onbErrors.phone ? "flex" : "none" }}>✓ Valid phone</div>}
                    </div>

                    <div>
                      <label>Address</label>
                      <div className="input-with-icon">
                        <input value={onb.address} onChange={(e) => handleChangeAndValidate("address", e.target.value)} placeholder="123, Lorong Sayang, Taman Suka" />
                        <FieldIcon field="address" />
                      </div>
                    </div>
                    <div>
                      <label>Date of Birth</label>
                      <div className="input-with-icon">
                        <input type="date" value={onb.dob} onChange={(e) => handleChangeAndValidate("dob", e.target.value)} />
                        <FieldIcon field="dob" />
                      </div>
                    </div>
                  </div>

                  {/* Employment */}
                  <h3 style={{ marginBottom: 12 }}>Employment</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label>Position Title *</label>
                      <div className="input-with-icon">
                        <input value={onb.positionTitle} onChange={(e) => handleChangeAndValidate("positionTitle", e.target.value)} placeholder="Software Engineer" />
                        <FieldIcon field="positionTitle" />
                      </div>
                    </div>

                    <div>
                      <label>Department *</label>
                      <div className="input-with-icon">
                        <input value={onb.department} onChange={(e) => handleChangeAndValidate("department", e.target.value)} placeholder="Information Technology" />
                        <FieldIcon field="department" />
                      </div>
                    </div>

                    <div>
                      <label>Start Date *</label>
                      <div className="input-with-icon">
                        <input type="date" value={onb.startDate} onChange={(e) => handleChangeAndValidate("startDate", e.target.value)} />
                        <FieldIcon field="startDate" />
                      </div>
                    </div>

                    <div>
                      <label>Employment Type</label>
                      <div className="input-with-icon">
                        <select value={onb.employmentType} onChange={(e) => handleChangeAndValidate("employmentType", e.target.value)}>
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Intern</option>
                        </select>
                        <FieldIcon field="employmentType" />
                      </div>
                    </div>

                    <div>
                      <label>Manager Name</label>
                      <div className="input-with-icon">
                        <input value={onb.managerName} onChange={(e) => handleChangeAndValidate("managerName", e.target.value)} placeholder="John Lim" />
                        <FieldIcon field="managerName" />
                      </div>
                    </div>

                    <div>
                      <label>Highest Education</label>
                      <div className="input-with-icon">
                        <select value={onb.educationHighest} onChange={(e) => handleChangeAndValidate("educationHighest", e.target.value)}>
                          <option value="">—</option>
                          {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
                        </select>
                        <FieldIcon field="educationHighest" />
                      </div>
                    </div>

                    <div>
                      <label>Skills (comma separated)</label>
                      <div className="input-with-icon">
                        <input value={onb.skills} onChange={(e) => handleChangeAndValidate("skills", e.target.value)} placeholder="React, JS, CSS" />
                        <FieldIcon field="skills" />
                      </div>
                    </div>
                  </div>

                  {/* Payroll / Compliance */}
                  <h3 style={{ marginBottom: "12px" }}>Payroll</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label>Bank Name</label>
                      <div className="input-with-icon">
                        <input value={onb.bankName} onChange={(e) => handleChangeAndValidate("bankName", e.target.value)} style={{ width: "100%" }} placeholder="Hackathon Bank" />
                        <FieldIcon field="bankName" />
                      </div>
                    </div>

                    <div>
                      <label>Bank Account</label>
                      <div className="input-with-icon">
                        <input value={onb.bankAccount} onChange={(e) => handleChangeAndValidate("bankAccount", e.target.value)} style={{ width: "100%" }} placeholder="123456789012" />
                        <FieldIcon field="bankAccount" />
                      </div>
                    </div>

                    <div>
                      <label>Tax ID</label>
                      <div className="input-with-icon">
                        <input value={onb.taxId} onChange={(e) => handleChangeAndValidate("taxId", e.target.value)} style={{ width: "100%" }} placeholder="E1234567890" />
                        <FieldIcon field="taxId" />
                      </div>
                    </div>
                  </div>

                  {/* Emergency */}
                  <h3 style={{ marginBottom: 12 }}>Emergency</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label>Emergency Contact Name *</label>
                      <div className="input-with-icon">
                        <input value={onb.emName} onChange={(e) => handleChangeAndValidate("emName", e.target.value)} placeholder="John Teoh" />
                        <FieldIcon field="emName" />
                      </div>
                      {onbErrors.emName ? <div className="field-error">{onbErrors.emName}</div> : null}
                    </div>

                    <div>
                      <label>Emergency Relation</label>
                      <div className="input-with-icon">
                        <input value={onb.emRelation} onChange={(e) => handleChangeAndValidate("emRelation", e.target.value)} placeholder="Father, Friend, Brother..." />
                        <FieldIcon field="emRelation" />
                      </div>
                    </div>

                    <div>
                      <label>Emergency Phone *</label>
                      <div className="input-with-icon">
                        <input value={onb.emPhone} onChange={(e) => handleChangeAndValidate("emPhone", e.target.value)} placeholder="012-345 6789" style={onbErrors.emPhone ? { borderColor: "#fb7185" } : {}} />
                        <FieldIcon field="emPhone" />
                      </div>
                      {onbErrors.emPhone ? <div className="field-error">{onbErrors.emPhone}</div> : <div className="field-hint" style={{ display: onb.emPhone && !onbErrors.emPhone ? "flex" : "none" }}>✓ Valid phone</div>}
                    </div>
                  </div>

                  {/* Preferences */}
                  <h3 style={{ marginBottom: 12 }}>Preferences</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label>T-Shirt Size</label>
                      <div className="input-with-icon">
                        <select value={onb.tshirt} onChange={(e) => handleChangeAndValidate("tshirt", e.target.value)}>
                          <option>XS</option>
                          <option>S</option>
                          <option>M</option>
                          <option>L</option>
                          <option>XL</option>
                        </select>
                        <FieldIcon field="tshirt" />
                      </div>
                    </div>

                    <div>
                      <label>Dietary Restrictions</label>
                      <div className="input-with-icon">
                        <input value={onb.dietary} onChange={(e) => handleChangeAndValidate("dietary", e.target.value)} placeholder="Vegetarian, Halal, etc." />
                        <FieldIcon field="dietary" />
                      </div>
                    </div>
                  </div>

                  {/* Gmail creation */}
                  <h3 style={{ marginBottom: 12 }}>Gmail creation</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div>
                      <label>Preferred Gmail Username *</label>
                      <div className="input-with-icon">
                        <input value={onb.preferredUsername} onChange={(e) => handleChangeAndValidate("preferredUsername", e.target.value)} placeholder="aisha.rahman" />
                        <FieldIcon field="preferredUsername" />
                      </div>
                      {onbErrors.preferredUsername ? <div className="field-error">{onbErrors.preferredUsername}</div> : <div className="small-muted" style={{ display: onb.preferredUsername && !onbErrors.preferredUsername ? "block" : "none" }}>✓ Username looks good</div>}
                    </div>

                    <div>
                      <label>Preferred Gmail Password *</label>
                      <div className="input-with-icon">
                        <input type="password" value={onb.preferredPassword} onChange={(e) => handleChangeAndValidate("preferredPassword", e.target.value)} placeholder="Min 6 chars" style={onbErrors.preferredPassword ? { borderColor: "#fb7185" } : {}} />
                        <FieldIcon field="preferredPassword" />
                      </div>
                      {onbErrors.preferredPassword ? <div className="field-error">{onbErrors.preferredPassword}</div> : <div className="field-hint" style={{ display: onb.preferredPassword && !onbErrors.preferredPassword ? "flex" : "none" }}>✓ Strong enough</div>}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn" onClick={submitOnboarding}>Submit & Create Gmail</button>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      setOnb({
                        fullName: "",
                        personalEmail: "",
                        phone: "",
                        address: "",
                        dob: "",
                        positionTitle: "",
                        department: "",
                        startDate: "",
                        employmentType: "Full-time",
                        managerName: "",
                        educationHighest: "",
                        skills: "",
                        bankName: "",
                        bankAccount: "",
                        taxId: "",
                        emName: "",
                        emRelation: "",
                        emPhone: "",
                        tshirt: "M",
                        dietary: "",
                        preferredUsername: "",
                        preferredPassword: "",
                      });
                      setOnbErrors({});
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)" }}>
                <h2>🎉 Onboarding Complete</h2>
                <div className="muted" style={{ marginTop: 4, marginBottom: 12 }}>Here’s your summary. You still don’t have access to the HR screener.</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                    <h3 style={{ marginTop: 0 }}>Your Details</h3>
                    <div><strong>Name:</strong> {onb.fullName}</div>
                    <div><strong>Email:</strong> {onb.personalEmail}</div>
                    <div><strong>Phone:</strong> {onb.phone}</div>
                    <div><strong>Role:</strong> {onb.positionTitle}</div>
                    <div><strong>Department:</strong> {onb.department}</div>
                    <div><strong>Start Date:</strong> {onb.startDate}</div>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                    <h3 style={{ marginTop: 0 }}>👩‍🏫 Assigned Mentor</h3>
                    <div><strong>Name:</strong> {assignedMentor?.name}</div>
                    <div><strong>Email:</strong> {assignedMentor?.email}</div>
                    <div><strong>Department:</strong> {assignedMentor?.dept}</div>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                    <h3 style={{ marginTop: 0 }}>📧 New Gmail Account</h3>
                    <div><strong>Email:</strong> {createdEmail}</div>
                    <div><strong>Password:</strong> {onb.preferredPassword}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn ghost" onClick={logout}>Logout</button>
                  <button className="btn" onClick={() => alert("You can now proceed to your user dashboard (if implemented).")}>Proceed</button>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : auth.role === "hr" ? (
        // HR sees the enhanced screener with Home tab
        <ScreenerApp />
      ) : (
        // Basic users: user dashboard with ideas + calendar
        <UserDashboard who={auth.who} logout={logout} initialCredentials={createdCredentials} />
      )}

      <footer style={{ padding: 24, fontSize: 12, color: "#64748b", textAlign: "center" }}>
        Frontend-only demo. Your data stays in the browser. No external libraries.
      </footer>
    </div>
  );
}

/* =========================================================
   Remaining parts of the file (UserDashboard, ScreenerApp, helpers)
   are included below. ScreenerApp updated with Home tab.
   ========================================================= */

/* ---------- USER DASHBOARD (unchanged aside from being present here) ---------- */
function UserDashboard({ who, logout, initialCredentials }) {
  const [tab, setTab] = useState("home");

  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");

  // Tasks now have: id, date (YYYY-MM-DD), task, status, priority
  const [tasks, setTasks] = useState([
    { id: 1, date: "2025-08-27", task: "Prepare weekly report", status: "Not Started", priority: "High" },
    { id: 2, date: "2025-08-27", task: "Team standup at 10 AM", status: "Not Started", priority: "Medium" },
    { id: 3, date: "2025-08-28", task: "Client presentation draft", status: "In Progress", priority: "High" },
    { id: 4, date: "2025-08-29", task: "Refactor onboarding flow", status: "Not Started", priority: "Low" },
  ]);

  const [nextTaskId, setNextTaskId] = useState(5);

  // show the credentials banner only once
  const [showCreds, setShowCreds] = useState(Boolean(initialCredentials));
  const creds = initialCredentials;

  function submitIdea() {
    if (!newIdea.trim()) return alert("Please enter your idea first.");
    const entry = { text: newIdea.trim(), status: "Pending Review", submittedAt: new Date().toISOString().slice(0, 10) };
    setIdeas((s) => [entry, ...s]);
    setNewIdea("");
  }

  // ---------- Task manipulation ----------
  function addTask({ date, taskText, priority }) {
    if (!taskText.trim()) return alert("Enter a task description.");
    if (!date) return alert("Choose a date for the task.");
    const t = { id: nextTaskId, date, task: taskText.trim(), status: "Not Started", priority: priority || "Medium" };
    setTasks((s) => [...s, t]);
    setNextTaskId((n) => n + 1);
  }

  function updateTaskStatus(id, status) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function updateTaskPriority(id, priority) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
  }

  function removeTask(id) {
    if (!("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // Group tasks by date (sorted ascending). Within each date, sort by priority (High -> Medium -> Low) then status then id
  const grouped = useMemo(() => {
    const order = { High: 0, Medium: 1, Low: 2 };
    const map = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    const dates = Object.keys(map).sort();
    const groups = dates.map((d) => ({ date: d, tasks: map[d].sort((a, b) => {
      if ((order[a.priority] || 9) !== (order[b.priority] || 9)) return (order[a.priority] || 9) - (order[b.priority] || 9);
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return a.id - b.id;
    }) }));
    return groups;
  }, [tasks]);

  const tabBtn = (k, label) => (
    <button key={k} onClick={() => setTab(k)} style={{
      background: tab === k ? "#0f172a" : "#fff",
      color: tab === k ? "#fff" : "#0f172a",
      border: "1px solid #0f172a",
      borderRadius: 999,
      padding: "8px 12px",
      cursor: "pointer",
      fontWeight: 700,
    }}>{label}</button>
  );

  // Local form state for adding tasks
  const [taskDate, setTaskDate] = useState("");
  const [taskText, setTaskText] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");

  return (
    <section style={{ padding: 12 }}>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Welcome, {who}</h2>
            <div className="muted" style={{ marginTop: 4 }}>This is your personal dashboard — demo only, no backend.</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {tabBtn("home", "Home")}
            {tabBtn("ideas", "💡 Submit Ideas")}
            {tabBtn("calendar", "📅 Calendar")}
          </div>
        </div>

        {creds && showCreds ? (
          <div style={{ marginTop: 12, border: "1px solid #cfe9ff", background: "#f0f9ff", padding: 12, borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <strong>✅ Account created</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  Your application returned credentials — please copy them now. (Shown once)
                </div>
                <div style={{ marginTop: 8 }}>
                  <div><strong>Username:</strong> <code style={{ padding: "2px 6px", borderRadius: 8 }}>{creds.username}</code></div>
                  <div style={{ marginTop: 6 }}><strong>Password:</strong> <code style={{ padding: "2px 6px", borderRadius: 8 }}>{creds.password}</code></div>
                  <div style={{ marginTop: 6 }}><strong>Email:</strong> {creds.email}</div>
                </div>
              </div>
              <div>
                <button className="btn ghost" onClick={() => setShowCreds(false)}>Got it</button>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          {tab === "home" && (
            <div>
              <h3 style={{ marginTop: 0 }}>Quick Overview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="stat">
                  <div className="muted">Ideas submitted</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{ideas.length}</div>
                </div>
                <div className="stat">
                  <div className="muted">Upcoming tasks</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{tasks.length}</div>
                </div>
                <div className="stat">
                  <div className="muted">Next task</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{tasks[0]?.task ?? "—"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{tasks[0]?.date ?? ""}</div>
                </div>
              </div>
            </div>
          )}

          {tab === "ideas" && (
            <div>
              <h3 style={{ marginTop: 0 }}>💡 Submit Your Idea</h3>
              <div style={{ display: "grid", gap: 8 }}>
                <textarea value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="Describe your idea..." style={{ minHeight: 100, borderRadius: 12, border: "1px solid #e2e8f0", padding: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={submitIdea}>Submit Idea</button>
                  <button className="btn ghost" onClick={() => setNewIdea("")}>Clear</button>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Your Submissions</h4>
                {ideas.length === 0 ? (
                  <div className="muted">No ideas submitted yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {ideas.map((it, idx) => (
                      <div key={idx} style={{ border: "1px solid #e2e8f0", padding: 12, borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{it.text}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{it.submittedAt} · Status: <strong>{it.status}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "calendar" && (
            <div>
              <h3 style={{ marginTop: 0 }}>📅 Calendar — Daily Tasks</h3>

              {/* Add new task form */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, alignItems: "end" }}>
                <div>
                  <label>Task Date</label>
                  <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
                </div>
                <div>
                  <label>Task Description</label>
                  <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="Describe the task" />
                </div>
                <div>
                  <label>Priority</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <button className="btn" onClick={() => { addTask({ date: taskDate, taskText, priority: taskPriority }); setTaskDate(""); setTaskText(""); setTaskPriority("Medium"); }}>Add Task</button>
                </div>
              </div>

              {/* Grouped tasks by date */}
              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                {grouped.length === 0 ? (
                  <div className="muted">No tasks yet. Add one above.</div>
                ) : (
                  grouped.map((g) => (
                    <div key={g.date} style={{ border: "1px solid #e2e8f0", padding: 12, borderRadius: 12, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{g.date}</div>
                          <div className="muted" style={{ fontSize: 13 }}>{g.tasks.length} task(s)</div>
                        </div>
                        <div className="muted" style={{ fontSize: 13 }}>Date section</div>
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {g.tasks.map((t) => (
                          <div key={t.id} style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", padding: 10, borderRadius: 10, border: "1px solid #f1f5f9", background: "#f8fafc" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{t.task}</div>
                              <div className="muted" style={{ fontSize: 12 }}>{t.date} · Priority: <strong>{t.priority}</strong></div>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <div>
                                <label style={{ display: "block", fontSize: 12, marginBottom: 6 }} className="muted">Status</label>
                                <select value={t.status} onChange={(e) => updateTaskStatus(t.id, e.target.value)}>
                                  <option>Not Started</option>
                                  <option>In Progress</option>
                                  <option>Done</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: 12, marginBottom: 6 }} className="muted">Priority</label>
                                <select value={t.priority} onChange={(e) => updateTaskPriority(t.id, e.target.value)}>
                                  <option>High</option>
                                  <option>Medium</option>
                                  <option>Low</option>
                                </select>
                              </div>

                              <div>
                                <button className="btn ghost" onClick={() => removeTask(t.id)}>Delete</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   UPDATED SCREENER (HR) — added Home tab (quick overview)
   Remaining features preserved from your original file.
   ========================================================= */

function ScreenerApp() {
  const sampleResumes = useMemo(
    () => [
      {
        id: "R-001",
        name: "Aisha Rahman",
        email: "aisha@example.com",
        phone: "+60-12-3456789",
        location: "Kuala Lumpur",
        yearsExp: 3,
        education: [{ level: "Bachelor", field: "Computer Science", institution: "UM" }],
        skills: ["JavaScript", "React", "CSS", "Node.js", "REST"],
        projects: [{ title: "Inventory App", description: "Built MERN app" }, { title: "Portfolio", description: "Responsive site" }],
        certifications: ["AWS Cloud Practitioner"],
        summary: "Frontend dev with React focus, built dashboards and component libraries.",
      },
      {
        id: "R-002",
        name: "Ben Tan",
        email: "ben.tan@example.com",
        phone: "+60-17-2223344",
        location: "Penang",
        yearsExp: 6,
        education: [{ level: "Master", field: "Software Engineering", institution: "USM" }],
        skills: ["TypeScript", "React", "Next.js", "GraphQL", "Leadership"],
        projects: [{ title: "E-commerce", description: "SSR storefront" }, { title: "Design System", description: "Built TS component lib" }, { title: "ML Ops", description: "Infra glue" }],
        certifications: ["Scrum Master"],
        summary: "Lead FE engineer, managed 4 devs, shipped high-traffic SPAs.",
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
        education: [{ level: "Bachelor", field: "Information Systems", institution: "UTM" }],
        skills: ["React", "Redux", "Testing", "Cypress", "REST", "Docker"],
        projects: [{ title: "Analytics Dashboard" }, { title: "QA Automation" }],
        certifications: ["ISTQB"],
        summary: "SWE with testing focus; shipped stable dashboards.",
      },
    ],
    []
  );

  const [resumes, setResumes] = useState(sampleResumes);
  const [rawInput, setRawInput] = useState("");
  const fileInputRef = useRef(null);
  const [lastAssigned, setLastAssigned] = useState(null);
  const [minYears, setMinYears] = useState(0);
  const [minEdu, setMinEdu] = useState("High School");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [locationContains, setLocationContains] = useState("");
  const [wExp, setWExp] = useState(3);
  const [wSkills, setWSkills] = useState(4);
  const [wEdu, setWEdu] = useState(2);
  const [wProj, setWProj] = useState(2);
  const [wCert, setWCert] = useState(1);
  const [keywordBoost, setKeywordBoost] = useState("react, leadership, testing");
  const [selected, setSelected] = useState([]);
  const [sortDir, setSortDir] = useState("desc");
  const [tab, setTab] = useState("home"); // default to home for HR

  const EDU_ORDER = { "High School": 0, Diploma: 1, Bachelor: 2, Master: 3, PhD: 4 };

  function normalize(str) { return (str || "").trim().toLowerCase(); }
  function intersectCount(a, b) {
    const setB = new Set(b.map(normalize));
    let n = 0;
    for (const x of a) if (setB.has(normalize(x))) n++;
    return n;
  }

  async function assignMentor(ic_number) {
    if (!ic_number) return alert("Please provide an ic_number.");
    try {
      const res = await fetch("http://127.0.0.1:5000/assign_mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ic_number }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastAssigned(data.candidate || null);
        alert(`✅ Mentor ${data.candidate.mentor} assigned to ${data.candidate.name}`);
        console.log("Mentor assignment response:", data);
      } else {
        alert(`❌ ${data.error || "Assignment failed"}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to connect to backend. Is Flask running on http://127.0.0.1:5000 ?");
    }
  }

  function loadJSONInput() {
    try {
      const parsed = JSON.parse(rawInput);
      if (Array.isArray(parsed)) {
        setResumes(parsed);
      } else {
        alert("JSON must be an array of resumes");
      }
    } catch (e) {
      alert("Invalid JSON");
    }
  }

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

  const filtered = useMemo(() => {
    const reqSkills = requiredSkills.split(/[,|]/).map((s) => normalize(s)).filter(Boolean);
    const loc = normalize(locationContains);

    return resumes.filter((r) => {
      if ((r.yearsExp || 0) < minYears) return false;
      const topEdu = (r.education || []).reduce((m, e) => Math.max(m, EDU_ORDER[e.level] ?? 0), 0);
      if (topEdu < (EDU_ORDER[minEdu] ?? 0)) return false;

      if (reqSkills.length) {
        const n = intersectCount(r.skills || [], reqSkills);
        if (n < reqSkills.length) return false;
      }
      if (loc && !normalize(r.location).includes(loc)) return false;
      return true;
    });
  }, [resumes, minYears, minEdu, requiredSkills, locationContains]);

  const keywordList = useMemo(() => keywordBoost.split(/[,|]/).map((s) => normalize(s)).filter(Boolean), [keywordBoost]);

  function scoreResume(r) {
    const topEdu = (r.education || []).reduce((m, e) => Math.max(m, EDU_ORDER[e.level] ?? 0), 0);
    const expScore = r.yearsExp || 0;
    const skillsScore = (r.skills || []).length;
    const projScore = (r.projects || []).length || 0;
    const certScore = (r.certifications || []).length || 0;
    let eduScore = topEdu * 2;

    const hay = [r.summary || "", ...(r.projects || []).map((p) => p.description || ""), ...(r.skills || [])].join(" ").toLowerCase();
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

  function toggleSelect(id) { setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])); }

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

  function escapeHTML(s) { return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

  // ---------- HR Home stats ----------
  const hrStats = useMemo(() => {
    const total = resumes.length;
    const needingReview = resumes.filter((r) => (r.__score === undefined && !(filtered || []).includes(r))).length; // heuristic: unscored
    const avgYears = (resumes.reduce((s, r) => s + (r.yearsExp || 0), 0) / Math.max(1, resumes.length)).toFixed(1);
    // top skills frequency
    const freq = {};
    for (const r of resumes) {
      (r.skills || []).forEach((s) => {
        const k = (s || "").trim();
        if (!k) return;
        freq[k] = (freq[k] || 0) + 1;
      });
    }
    const topSkills = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => ({ skill: x[0], count: x[1] }));
    return { total, needingReview: Math.max(0, needingReview), avgYears, topSkills };
  }, [resumes, filtered]);

  const styles = { app: { maxWidth: "95%", margin: "0 auto", padding: 16 } };

  const baseCSS = `:root { --c:#0f172a; --b:#fff; --muted:#64748b; --line:#e2e8f0; --accent:#0f172a; --accent2:#0ea5e9; }`;

  function tabBtn(active) { return { background: active ? "#0f172a" : "#fff", color: active ? "#fff" : "#0f172a", border: "1px solid #0f172a", borderRadius: 999, padding: "8px 12px", cursor: "pointer", fontWeight: 700, transition: "all .15s ease", }; }

  return (
    <div style={styles.app}>
      <style>{baseCSS}</style>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, position: "sticky", top: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "saturate(180%) blur(8px)", borderBottom: "1px solid #e2e8f0", zIndex: 5, borderRadius: 12, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Resume Screener (HR)</h1>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Frontend-only · No external libraries</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ k: "home", label: "🏠 Home" }, { k: "ingest", label: "📥 Ingest" }, { k: "filter", label: "⏳ Filter" }, { k: "analyze", label: "📊 Analyze & Score" }, { k: "compare", label: "🖨️ Compare & Print" }].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} style={tabBtn(tab === t.k)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "home" && (
        <section style={{ padding: 12 }}>
          <Card title="HR Overview" subtitle="Quick summary of loaded candidates and important signals.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div className="stat">
                <div className="muted">Total candidates loaded</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{hrStats.total}</div>
              </div>

              <div className="stat">
                <div className="muted">Candidates needing review</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{hrStats.needingReview}</div>
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Not yet scored / not filtered</div>
              </div>

              <div className="stat">
                <div className="muted">Avg years experience</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{hrStats.avgYears} yrs</div>
              </div>

              <div className="stat">
                <div className="muted">Top skills (top 5)</div>
                <div style={{ marginTop: 6 }}>
                  {hrStats.topSkills.length === 0 ? <div className="muted">No skills recorded</div> : hrStats.topSkills.map((s) => (
                    <div key={s.skill} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>{s.skill}</div>
                      <div className="muted">{s.count}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn" onClick={() => setTab("ingest")}>Load / Ingest</button>
              <button className="btn ghost" onClick={() => setTab("filter")}>Filter</button>
              <div style={{ marginLeft: "auto" }} className="muted">Last assigned: {lastAssigned ? `${lastAssigned.name} → ${lastAssigned.mentor}` : "—"}</div>
            </div>
          </Card>
        </section>
      )}

      {tab === "ingest" && (
        <section style={{ padding: 12 }}>
          <Card title="Load Resumes" subtitle="Paste JSON array or simple CSV, or upload a .json/.csv file.">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setResumes(sampleResumes)} className="btn">Use Sample</button>
              <button onClick={() => setResumes([])} className="btn ghost">Clear</button>
              <label className="file">
                <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onUploadFile(f); }} />
                Upload .json/.csv
              </label>
            </div>
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} placeholder={`JSON example (array of resumes).\nCSV header: id,name,email,phone,location,yearsExp,skills,education\nskills: pipe-separated; education: level:field:inst;level:field:inst`} style={{ width: "100%", minHeight: 160, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", padding: 10, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={loadJSONInput} className="btn">Load JSON</button>
            </div>
            <SummaryBar resumes={resumes} />
            <ResumeTable data={resumes} selectable={false} selected={[]} onToggleSelect={() => {}} assignMentor={assignMentor} />

            {lastAssigned ? (
              <div style={{ marginTop: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                <strong>Last mentor assignment</strong>
                <div style={{ marginTop: 6 }}>
                  <div><strong>Candidate:</strong> {lastAssigned.name}</div>
                  <div><strong>Assigned mentor:</strong> {lastAssigned.mentor}</div>
                  <div><strong>Mentor email:</strong> {Array.isArray(lastAssigned.mentor_email) ? lastAssigned.mentor_email.join(', ') : lastAssigned.mentor_email}</div>
                </div>
              </div>
            ) : null}

          </Card>
        </section>
      )}

      {tab === "filter" && (
        <section style={{ padding: 12 }}>
          <Card title="Basic Requirements" subtitle="Filter down to candidates who match the must-haves.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 12 }}>
              <InputL label="Minimum Years of Experience"><input type="number" min={0} value={minYears} onChange={(e) => setMinYears(Number(e.target.value))} /></InputL>
              <InputL label="Minimum Education Level"><select value={minEdu} onChange={(e) => setMinEdu(e.target.value)}>{Object.keys(EDU_ORDER).map((k) => (<option key={k} value={k}>{k}</option>))}</select></InputL>
              <InputL label="Required Skills (comma or |)"><input value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="react, typescript" /></InputL>
              <InputL label="Location contains"><input value={locationContains} onChange={(e) => setLocationContains(e.target.value)} placeholder="Kuala" /></InputL>
            </div>
            <SummaryBar resumes={filtered} label="After Filter" />
            <ResumeTable data={filtered} selectable selected={selected} onToggleSelect={toggleSelect} assignMentor={assignMentor} />
          </Card>
        </section>
      )}

      {tab === "analyze" && (
        <section style={{ padding: 12 }}>
          <Card title="Analysis Priorities" subtitle="Adjust weights (0–5). Keywords give small bonuses.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 12 }}>
              <Weight label="Experience" value={wExp} onChange={setWExp} />
              <Weight label="Skills" value={wSkills} onChange={setWSkills} />
              <Weight label="Education" value={wEdu} onChange={setWEdu} />
              <Weight label="Projects" value={wProj} onChange={setWProj} />
              <Weight label="Certifications" value={wCert} onChange={setWCert} />
              <InputL label="Keyword Boosts (comma or |)"><input value={keywordBoost} onChange={(e) => setKeywordBoost(e.target.value)} /></InputL>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span className="muted">Sort</span>
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                <option value="desc">Highest first</option>
                <option value="asc">Lowest first</option>
              </select>
            </div>
            <SummaryBar resumes={scored} label="Scored" scoreKey="__score" />
            <ResumeTable data={scored} selectable selected={selected} onToggleSelect={toggleSelect} showScore assignMentor={assignMentor} />
          </Card>
        </section>
      )}

      {tab === "compare" && (
        <section style={{ padding: 12 }}>
          <Card title="Compare & Print" subtitle="Select up to 3 candidates to compare and print a clean summary.">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={printSelection} className="btn">Print Selected / All</button>
              <button onClick={() => setSelected([])} className="btn ghost">Clear Selection</button>
            </div>
            <CompareGrid resumes={scored.filter((r) => selected.includes(r.id)).slice(0, 3)} />
            <ResumeTable data={scored} selectable selected={selected} onToggleSelect={toggleSelect} showScore assignMentor={assignMentor} />
          </Card>
        </section>
      )}

      <footer style={{ padding: 24, fontSize: 12, color: "#64748b", textAlign: "center" }}>
        Frontend-only demo. Your data stays in the browser.
      </footer>
    </div>
  );
}

/* Utility components (unchanged) */
function Card({ title, subtitle, children }) { return (
  <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, boxShadow: "0 8px 30px rgba(2,6,23,0.06)", background: "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)" }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        {subtitle ? <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div> : null}
      </div>
    </div>
    {children}
  </div>
);}

function InputL({ label, children }) { return (<div><label>{label}</label>{children}</div>); }
function Weight({ label, value, onChange }) { return (<div><label>{label} Weight: <strong>{value}</strong></label><input type="range" min={0} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>); }
function SummaryBar({ resumes, label = "Loaded", scoreKey }) { const avgYears = resumes.length ? (resumes.reduce((s, r) => s + (r.yearsExp || 0), 0) / resumes.length).toFixed(1) : 0; const avgScore = scoreKey && resumes.length ? (resumes.reduce((s, r) => s + (r[scoreKey] || 0), 0) / resumes.length).toFixed(1) : undefined; return (<div style={{ marginTop: 12, padding: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12 }}><strong>{label}:</strong> {resumes.length} resumes · avg exp {avgYears} yrs {avgScore !== undefined ? `· avg score ${avgScore}` : ""}</div>); }

function ResumeTable({ data, selectable, selected, onToggleSelect, showScore = false, assignMentor }) {
  const EDU_ORDER = { "High School": 0, Diploma: 1, Bachelor: 2, Master: 3, PhD: 4 };
  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
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
            {assignMentor ? <th>Actions</th> : null}
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
              {assignMentor ? (
                <td>
                  <button className="btn" onClick={() => {
                    const ic = prompt(`Enter ic_number for ${r.name} (this is required by the backend)`);
                    if (ic && ic.trim()) assignMentor(ic.trim());
                  }}>Assign Mentor</button>
                </td>
              ) : null}
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
      {resumes.map((r) => (
        <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, boxShadow: "0 8px 24px rgba(15,23,42,0.04)", background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
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
          <stop offset="0%" stopColor="#111827" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#g)" strokeWidth="1.6" />
      <path d="M7 8h10M7 12h10M7 16h6" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
