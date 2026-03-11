// ============================================================
//  MANUAL DIGITAL KHAATA SYSTEM
//  Single-file React App | Neon PostgreSQL + Cloudinary
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { LogOut } from "lucide-react";

// ─── CONFIG ─────────────────────────────────────────────────
const DATABASE_URL  = import.meta.env.VITE_NEON_URL;
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

// ─── NEON DB HELPER ─────────────────────────────────────────
// @neondatabase/serverless v1+ requires .query() for parameterized calls.
// This wrapper handles both plain queries and parameterized ones uniformly,
// and normalises the response so callers always get a plain array back.
async function sql(query, params = []) {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  const { neon } = await import("https://esm.sh/@neondatabase/serverless");
  const db = neon(DATABASE_URL);
  const result = params.length === 0
    ? await db.query(query)
    : await db.query(query, params);
  // db.query() returns { rows: [...] }; normalise to plain array
  return result.rows ?? result;
}

// ─── CLOUDINARY UPLOAD ──────────────────────────────────────
function openCloudinaryWidget(onSuccess) {
  if (!window.cloudinary) {
    alert("Cloudinary widget script not loaded. Add the CDN script tag.");
    return;
  }
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    alert("CLOUD_NAME and UPLOAD_PRESET are not configured.");
    return;
  }
  const widget = window.cloudinary.createUploadWidget(
    { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET, sources: ["local", "camera"], multiple: false, resourceType: "image" },
    (error, result) => {
      if (!error && result?.event === "success") {
        onSuccess(result.info.secure_url);
      }
    }
  );
  widget.open();
}

// ─── STYLES ─────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#f0fdf4", fontFamily: "'DM Sans', sans-serif", color: "#0f172a" },
  header: { background: "linear-gradient(135deg, #059669 0%, #047857 100%)", padding: "20px 20px 16px", boxShadow: "0 4px 24px rgba(5,150,105,0.25)" },
  headerTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 38, height: 38, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  logoTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  addBtn: { background: "#fff", color: "#059669", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },
  searchWrap: { position: "relative" },
  searchInput: { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 12, padding: "13px 16px 13px 44px", fontSize: 15, color: "#0f172a", outline: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6ee7b7", fontSize: 18, pointerEvents: "none" },
  main: { maxWidth: 540, margin: "0 auto", padding: "16px 14px 80px" },
  summaryRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  summaryCard: (accent) => ({ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${accent}` }),
  summaryLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryAmount: (color) => ({ fontSize: 24, fontWeight: 800, color, margin: "4px 0 0", letterSpacing: "-0.5px" }),
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" },
  customerCard: (sel) => ({ background: sel ? "#ecfdf5" : "#fff", border: sel ? "2px solid #059669" : "2px solid transparent", borderRadius: 16, padding: "14px 16px", marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", transition: "all 0.15s" }),
  customerRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  customerName: { fontWeight: 700, fontSize: 16, color: "#0f172a" },
  customerPhone: { fontSize: 12, color: "#64748b", marginTop: 2 },
  badge: (amt) => ({ background: amt > 0 ? "#fef2f2" : "#f0fdf4", color: amt > 0 ? "#ef4444" : "#059669", fontWeight: 800, fontSize: 14, borderRadius: 8, padding: "4px 10px", border: `1px solid ${amt > 0 ? "#fecaca" : "#a7f3d0"}` }),
  badgeZero: { background: "#f1f5f9", color: "#64748b", fontWeight: 700, fontSize: 13, borderRadius: 8, padding: "4px 10px" },
  detailPanel: { background: "#fff", borderRadius: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 16, overflow: "hidden" },
  detailHeader: { background: "linear-gradient(135deg, #059669, #047857)", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  detailName: { color: "#fff", fontWeight: 800, fontSize: 18, margin: 0 },
  detailPhone: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3 },
  detailBalance: { textAlign: "right" },
  detailBalanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 },
  detailBalanceAmt: (neg) => ({ color: neg ? "#fca5a5" : "#fff", fontSize: 22, fontWeight: 800, marginTop: 2 }),
  actionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 16px", borderBottom: "1px solid #f1f5f9" },
  actionBtn: (variant) => ({ background: variant === "credit" ? "#fef2f2" : "#f0fdf4", color: variant === "credit" ? "#ef4444" : "#059669", border: `1.5px solid ${variant === "credit" ? "#fecaca" : "#a7f3d0"}`, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "center" }),
  txnList: { padding: "6px 16px 14px" },
  txnItem: () => ({ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f8fafc" }),
  txnDot: (type) => ({ width: 36, height: 36, borderRadius: 10, background: type === "credit" ? "#fef2f2" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }),
  txnDesc: { flex: 1 },
  txnDescText: { fontWeight: 600, fontSize: 14, color: "#0f172a" },
  txnDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  txnAmt: (type) => ({ fontWeight: 800, fontSize: 15, color: type === "credit" ? "#ef4444" : "#059669", textAlign: "right" }),
  txnReceipt: { fontSize: 11, color: "#059669", textDecoration: "none", display: "block", marginTop: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" },
  sheet: { background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 540, padding: "24px 20px 36px", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" },
  sheetTitle: { fontWeight: 800, fontSize: 18, color: "#0f172a", margin: "0 0 20px" },
  sheetClose: { position: "absolute", right: 20, top: 20, background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: { width: "100%", boxSizing: "border-box", border: "2px solid #e2e8f0", borderRadius: 12, padding: "13px 14px", fontSize: 15, outline: "none", color: "#0f172a", marginBottom: 14, transition: "border 0.15s" },
  submitBtn: (color) => ({ width: "100%", background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer", marginTop: 6, boxShadow: `0 4px 16px ${color}55` }),
  uploadBtn: { width: "100%", boxSizing: "border-box", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: 12, padding: "13px", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  uploadDone: { width: "100%", boxSizing: "border-box", background: "#ecfdf5", border: "2px solid #a7f3d0", borderRadius: 12, padding: "12px", color: "#059669", fontWeight: 600, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#94a3b8" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 600, color: "#64748b" },
  emptySub: { fontSize: 13, marginTop: 4 },
  // locale popup
  localeOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20, backdropFilter: "blur(4px)" },
  localeCard: { background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, padding: "32px 24px 28px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", textAlign: "center" },
  localeIcon: { fontSize: 48, marginBottom: 12 },
  localeTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: "0 0 6px" },
  localeSub: { fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 },
  localeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  localeField: { textAlign: "left" },
  localeConfirmBtn: { width: "100%", background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 16px rgba(5,150,105,0.35)" },
  localeDetecting: { fontSize: 13, color: "#94a3b8", margin: "12px 0 0" },
  // login screen
  loginWrap: { minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" },
  loginCard: { background: "#fff", borderRadius: 28, width: "100%", maxWidth: 400, padding: "40px 32px 36px", boxShadow: "0 20px 60px rgba(5,150,105,0.12), 0 4px 16px rgba(0,0,0,0.06)" },
  loginLogoWrap: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 },
  loginLogoIcon: { width: 64, height: 64, background: "linear-gradient(135deg,#059669,#047857)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 14, boxShadow: "0 8px 24px rgba(5,150,105,0.3)" },
  loginTitle: { fontWeight: 800, fontSize: 24, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" },
  loginSubtitle: { fontSize: 14, color: "#64748b", margin: 0 },
  loginDivider: { height: 1, background: "#e2e8f0", margin: "0 0 24px" },
  loginError: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 14, textAlign: "center" },
  logoutBtn: { background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "8px 12px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" },
  deleteBtn: { background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "5px 10px", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
};

// ─── FORMATTERS ─────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const makeFmt = (currency) => (n) => `${currency} ${Math.abs(n).toLocaleString()}`;

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [customers, setCustomers]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState(null);
  const [modal, setModal]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState({});
  const [receiptUrl, setReceiptUrl]     = useState("");
  const searchRef = useRef();

  // ── Auth state ──
  const [isLoggedIn, setIsLoggedIn]     = useState(() => localStorage.getItem("khaata_session") === "1");
  const [loginForm, setLoginForm]       = useState({ user: "", pass: "" });
  const [loginError, setLoginError]     = useState("");

  // ── Locale / Currency state ──
  const [settings, setSettings]         = useState(null);
  const [showLocale, setShowLocale]     = useState(false);
  const [localeForm, setLocaleForm]     = useState({ country: "", currency: "" });
  const [detecting, setDetecting]       = useState(false);
  const [savingLocale, setSavingLocale] = useState(false);

  const fmtRs = makeFmt(settings?.currency || "");

  // ── Auth handlers ──
  const handleLogin = () => {
    const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;
    if (loginForm.user === ADMIN_USER && loginForm.pass === ADMIN_PASS) {
      localStorage.setItem("khaata_session", "1");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("❌ Incorrect username or password.");
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out? You will need your credentials to log back in.")) return;
    localStorage.removeItem("khaata_session");
    setIsLoggedIn(false);
    setLoginForm({ user: "", pass: "" });
    setCustomers([]); setTransactions([]); setSettings(null);
    setSelected(null); setSearch(""); setModal(null);
  };

  // ── Load data (only after login) ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRows, tRows] = await Promise.all([
        sql("SELECT * FROM customers ORDER BY created_at DESC"),
        sql("SELECT * FROM transactions ORDER BY created_at DESC"),
      ]);
      setCustomers(cRows);
      setTransactions(tRows);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (isLoggedIn) loadData(); }, [loadData, isLoggedIn]);

  // ── Settings / Locale init (only after login) ──
  useEffect(() => {
    if (!isLoggedIn) return;
    const checkSettings = async () => {
      try {
        const rows = await sql("SELECT country, currency FROM settings LIMIT 1");
        if (rows.length > 0) {
          setSettings({ country: rows[0].country, currency: rows[0].currency });
          return;
        }
      } catch (e) { console.error("Settings check failed:", e); }
      // No saved settings in DB — detect via IP (one-time only)
      setDetecting(true);
      try {
        const res  = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        setLocaleForm({ country: data.country_name || "", currency: data.currency || "" });
      } catch { setLocaleForm({ country: "", currency: "" }); }
      setDetecting(false);
      setShowLocale(true);
    };
    checkSettings();
  }, [isLoggedIn]);

  const saveSettings = async () => {
    if (!localeForm.country.trim() || !localeForm.currency.trim()) return;
    setSavingLocale(true);
    const country  = localeForm.country.trim();
    const currency = localeForm.currency.trim().toUpperCase();
    try {
      await sql(
        "INSERT INTO settings (id, country, currency) VALUES (1, $1, $2) ON CONFLICT (id) DO UPDATE SET country=$1, currency=$2, updated_at=NOW()",
        [country, currency]
      );
      setSettings({ country, currency });
      setShowLocale(false);
    } catch (e) { alert("Error saving settings: " + e.message); }
    setSavingLocale(false);
  };

  // ── Login Screen ──
  if (!isLoggedIn) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div style={S.loginWrap}>
          <div style={S.loginCard}>
            <div style={S.loginLogoWrap}>
              <div style={S.loginLogoIcon}>📒</div>
              <p style={S.loginTitle}>Khaata Book</p>
              <p style={S.loginSubtitle}>Admin Login — Digital Udhaar Ledger</p>
            </div>
            <div style={S.loginDivider} />
            {loginError && <div style={S.loginError}>{loginError}</div>}
            <label style={S.label}>Username</label>
            <input
              style={S.input}
              placeholder="Enter username"
              autoComplete="username"
              value={loginForm.user}
              onChange={e => setLoginForm(p => ({ ...p, user: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <label style={S.label}>Password</label>
            <input
              style={S.input}
              placeholder="Enter password"
              type="password"
              autoComplete="current-password"
              value={loginForm.pass}
              onChange={e => setLoginForm(p => ({ ...p, pass: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button style={S.submitBtn("#059669")} onClick={handleLogin}>
              🔐 Login to Khaata Book
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 20, marginBottom: 0 }}>
              Credentials are set via <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>VITE_ADMIN_USER</code> &amp; <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>VITE_ADMIN_PASS</code> in your <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>.env</code> file.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Main App (authenticated) ──
  const balance = (customerId) => {
    return transactions
      .filter(t => t.customer_id === customerId)
      .reduce((sum, t) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalCredit  = customers.reduce((s, c) => { const b = balance(c.id); return b > 0 ? s + b : s; }, 0);
  const totalCleared = customers.filter(c => balance(c.id) === 0).length;

  const selectedTxns = selected
    ? [...transactions].filter(t => t.customer_id === selected.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  // ── Actions ──
  const openModal = (type) => { setForm({}); setReceiptUrl(""); setModal(type); };
  const closeModal = () => setModal(null);

  const handleAddCustomer = async () => {
    if (!form.name?.trim() || !form.phone?.trim()) return;
    setSaving(true);
    try {
      const rows = await sql(
        "INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING *",
        [form.name.trim(), form.phone.trim()]
      );
      await loadData();
      setSelected(rows[0]);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
    closeModal();
  };

  const handleAddTxn = async (type) => {
    if (!form.amount || !selected) return;
    setSaving(true);
    try {
      await sql(
        "INSERT INTO transactions (customer_id, type, amount, description, receipt_url) VALUES ($1,$2,$3,$4,$5)",
        [selected.id, type, Number(form.amount), form.description || "", receiptUrl || null]
      );
      await loadData();
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
    closeModal();
  };

  const handleDeleteCustomer = async (e, customer) => {
    e.stopPropagation(); // prevent card expand/collapse
    if (!window.confirm(`Delete "${customer.name}"? This will permanently remove the customer and all their transaction history.`)) return;
    try {
      await sql("DELETE FROM customers WHERE id = $1", [customer.id]);
      if (selected?.id === customer.id) setSelected(null);
      await loadData();
    } catch (err) { alert("Error deleting customer: " + err.message); }
  };

  // ── Render ──
  const selectedBalance = selected ? balance(selected.id) : 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <script src="https://widget.cloudinary.com/v2.0/global/all.js" async />

      <div style={S.app}>
        {/* ─── HEADER ─── */}
        <div style={S.header}>
          <div style={S.headerTop}>
            <div style={S.logo}>
              <div style={S.logoIcon}>📒</div>
              <div>
                <p style={S.logoTitle}>Khaata Book</p>
                <p style={{ ...S.logoSub, margin: 0 }}>
                  {settings ? `${settings.country} · ${settings.currency}` : "Digital Udhaar Ledger"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={S.addBtn} onClick={() => openModal("add_customer")}>
                <span>＋</span> New Customer
              </button>
              <button style={S.logoutBtn} onClick={handleLogout} title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          </div>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input
              ref={searchRef}
              style={S.searchInput}
              placeholder="Search by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={S.main}>
          {/* ─── SUMMARY ─── */}
          <div style={S.summaryRow}>
            <div style={S.summaryCard("#ef4444")}>
              <p style={S.summaryLabel}>Total Outstanding</p>
              <p style={S.summaryAmount("#ef4444")}>{fmtRs(totalCredit)}</p>
            </div>
            <div style={S.summaryCard("#059669")}>
              <p style={S.summaryLabel}>Cleared Accounts</p>
              <p style={S.summaryAmount("#059669")}>{totalCleared} / {customers.length}</p>
            </div>
          </div>

          {/* ─── SELECTED CUSTOMER DETAIL ─── */}
          {selected && (
            <div style={S.detailPanel}>
              <div style={S.detailHeader}>
                <div>
                  <p style={S.detailName}>{selected.name}</p>
                  <p style={{ ...S.detailPhone, margin: 0 }}>📞 {selected.phone}</p>
                </div>
                <div style={S.detailBalance}>
                  <p style={{ ...S.detailBalanceLabel, margin: 0 }}>BALANCE DUE</p>
                  <p style={{ ...S.detailBalanceAmt(selectedBalance > 0), margin: 0 }}>
                    {selectedBalance > 0 ? fmtRs(selectedBalance) : selectedBalance < 0 ? `-${fmtRs(selectedBalance)}` : "Cleared ✓"}
                  </p>
                </div>
              </div>

              <div style={S.actionRow}>
                <button style={S.actionBtn("credit")} onClick={() => openModal("add_credit")}>
                  📌 Add Udhaar
                </button>
                <button style={S.actionBtn("payment")} onClick={() => openModal("add_payment")}>
                  💵 Record Payment
                </button>
              </div>

              <div style={S.txnList}>
                {selectedTxns.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "16px 0", fontSize: 14 }}>No transactions yet</p>
                ) : selectedTxns.map(t => (
                  <div key={t.id} style={S.txnItem()}>
                    <div style={S.txnDot(t.type)}>{t.type === "credit" ? "🛒" : "💸"}</div>
                    <div style={S.txnDesc}>
                      <p style={{ ...S.txnDescText, margin: 0 }}>{t.description || (t.type === "credit" ? "Credit entry" : "Payment received")}</p>
                      <p style={{ ...S.txnDate, margin: 0 }}>{fmtDate(t.created_at)}</p>
                      {t.receipt_url && <a href={t.receipt_url} target="_blank" rel="noreferrer" style={S.txnReceipt}>📎 View Receipt</a>}
                    </div>
                    <p style={{ ...S.txnAmt(t.type), margin: 0 }}>
                      {t.type === "credit" ? "+" : "−"}{fmtRs(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── CUSTOMER LIST ─── */}
          <p style={S.sectionTitle}>{search ? `Results for "${search}"` : "All Customers"} ({filtered.length})</p>

          {loading ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>⏳</div>
              <p style={S.emptyText}>Loading ledger…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🔍</div>
              <p style={S.emptyText}>{search ? "No customer found" : "No customers yet"}</p>
              <p style={S.emptySub}>{search ? "Try a different name or phone" : "Tap '+ New Customer' to get started"}</p>
            </div>
          ) : filtered.map(c => {
            const bal = balance(c.id);
            return (
              <div
                key={c.id}
                style={S.customerCard(selected?.id === c.id)}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
              >
                <div style={S.customerRow}>
                  <div>
                    <p style={{ ...S.customerName, margin: 0 }}>{c.name}</p>
                    <p style={{ ...S.customerPhone, margin: 0 }}>📞 {c.phone}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {bal === 0
                      ? <span style={S.badgeZero}>Cleared ✓</span>
                      : <span style={S.badge(bal)}>{bal > 0 ? "Owes " : "Advance "}{fmtRs(bal)}</span>
                    }
                    {bal === 0 && (
                      <button
                        style={S.deleteBtn}
                        onClick={(e) => handleDeleteCustomer(e, c)}
                        title="Delete customer record"
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LOCALE SETUP POPUP (one-time) ─── */}
      {showLocale && (
        <div style={S.localeOverlay}>
          <div style={S.localeCard}>
            <div style={S.localeIcon}>🌍</div>
            <p style={S.localeTitle}>Set Your Local Currency</p>
            <p style={S.localeSub}>
              {detecting
                ? "Detecting your location…"
                : "We've detected your region. Please confirm or update your country and currency before continuing."
              }
            </p>
            {!detecting && (
              <>
                <div style={S.localeRow}>
                  <div style={S.localeField}>
                    <label style={S.label}>Country</label>
                    <input
                      style={{ ...S.input, marginBottom: 0 }}
                      placeholder="e.g. Pakistan"
                      value={localeForm.country}
                      onChange={e => setLocaleForm(p => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                  <div style={S.localeField}>
                    <label style={S.label}>Currency Code</label>
                    <input
                      style={{ ...S.input, marginBottom: 0 }}
                      placeholder="e.g. PKR"
                      value={localeForm.currency}
                      onChange={e => setLocaleForm(p => ({ ...p, currency: e.target.value }))}
                    />
                  </div>
                </div>
                <button style={S.localeConfirmBtn} onClick={saveSettings} disabled={savingLocale}>
                  {savingLocale ? "Saving…" : "✓ Confirm & Continue"}
                </button>
              </>
            )}
            {detecting && <p style={S.localeDetecting}>⏳ Please wait…</p>}
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {modal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ ...S.sheet, position: "relative" }}>
            <button style={S.sheetClose} onClick={closeModal}>✕</button>

            {/* ADD CUSTOMER */}
            {modal === "add_customer" && (
              <>
                <p style={S.sheetTitle}>👤 Add New Customer</p>
                <label style={S.label}>Full Name</label>
                <input style={S.input} placeholder="e.g. Ali Khan" value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <label style={S.label}>Phone Number</label>
                <input style={S.input} placeholder="e.g. 03001234567" type="tel" value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                <button style={S.submitBtn("#059669")} onClick={handleAddCustomer} disabled={saving}>
                  {saving ? "Saving…" : "✓ Add Customer"}
                </button>
              </>
            )}

            {/* ADD CREDIT */}
            {modal === "add_credit" && (
              <>
                <p style={S.sheetTitle}>📌 Add Udhaar for {selected?.name}</p>
                <label style={S.label}>Amount ({settings?.currency || "currency"})</label>
                <input style={S.input} placeholder="e.g. 250" type="number" min="1" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                <label style={S.label}>Description</label>
                <input style={S.input} placeholder="e.g. Rice, Sugar, Oil" value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <label style={S.label}>Receipt Photo (optional)</label>
                {receiptUrl
                  ? <div style={S.uploadDone}>✅ Receipt uploaded <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ color: "#047857" }}>(view)</a></div>
                  : <button style={S.uploadBtn} type="button" onClick={() => openCloudinaryWidget(setReceiptUrl)}>📷 Upload Receipt Photo</button>
                }
                <button style={S.submitBtn("#ef4444")} onClick={() => handleAddTxn("credit")} disabled={saving}>
                  {saving ? "Saving…" : "📌 Add Udhaar Entry"}
                </button>
              </>
            )}

            {/* ADD PAYMENT */}
            {modal === "add_payment" && (
              <>
                <p style={S.sheetTitle}>💵 Record Payment from {selected?.name}</p>
                <p style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#065f46", marginBottom: 16 }}>
                  Current Balance: <strong>{fmtRs(selectedBalance)}</strong>
                </p>
                <label style={S.label}>Amount Received ({settings?.currency || "currency"})</label>
                <input style={S.input} placeholder="e.g. 100" type="number" min="1" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                <label style={S.label}>Note (optional)</label>
                <input style={S.input} placeholder="e.g. Cash paid in full" value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <label style={S.label}>Receipt Photo (optional)</label>
                {receiptUrl
                  ? <div style={S.uploadDone}>✅ Receipt uploaded <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ color: "#047857" }}>(view)</a></div>
                  : <button style={S.uploadBtn} type="button" onClick={() => openCloudinaryWidget(setReceiptUrl)}>📷 Upload Receipt Photo</button>
                }
                <button style={S.submitBtn("#059669")} onClick={() => handleAddTxn("payment")} disabled={saving}>
                  {saving ? "Saving…" : "💵 Record Payment"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}