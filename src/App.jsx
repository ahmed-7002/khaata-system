// ============================================================
//  MANUAL DIGITAL KHAATA SYSTEM — v2 (Fintech Upgrade)
//  Single-file React App | Neon PostgreSQL + Cloudinary
//  New: WhatsApp Reminders · Visual Analytics · UI Polish
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { LogOut } from "lucide-react";

// ─── CONFIG ─────────────────────────────────────────────────
const DATABASE_URL  = import.meta.env.VITE_NEON_URL;
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

// ─── NEON DB HELPER ─────────────────────────────────────────
async function sql(query, params = []) {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  const { neon } = await import("https://esm.sh/@neondatabase/serverless");
  const db = neon(DATABASE_URL);
  const result = params.length === 0
    ? await db.query(query)
    : await db.query(query, params);
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

// ─── WHATSAPP REMINDER / STATEMENT ──────────────────────────
// transactions: full transactions array for the app
// isCleared:    true when the customer's balance is zero
function sendWhatsAppReminder(customer, balance, currency, shopName, transactions = [], isCleared = false) {
  // 1. Strip everything that isn't a number
  let phone = customer.phone?.replace(/\D/g, "");

  // 2. Format for WhatsApp (ensure it starts with 92 and remove leading 0)
  if (phone.startsWith("0")) {
    phone = "92" + phone.substring(1);
  } else if (!phone.startsWith("92") && phone.length === 10) {
    phone = "92" + phone;
  }

  // 3. Find the most recent CREDIT (udhaar) transaction that has a receipt_url.
  //    Payment receipts are excluded — the reminder is about what is owed,
  //    so only the debt-side (credit) receipt is relevant.
  const latestReceipt = transactions
    .filter(t => t.customer_id === customer.id && t.type === "credit" && t.receipt_url)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  let message;

  if (isCleared) {
    // ── "Send Statement" mode: balance is zero ──────────────
    // Count total payments and credits for a brief summary
    const customerTxns = transactions.filter(t => t.customer_id === customer.id);
    const totalPaid    = customerTxns
      .filter(t => t.type === "payment")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    message =
      `Hello ${customer.name}, this is a statement from ${shopName}. ` +
      `Your account is fully cleared — thank you for your payment! ` +
      `Total amount settled: ${currency} ${totalPaid.toLocaleString()}. ` +
      `We appreciate your business and look forward to serving you again.`;
    // No receipt link attached to clearance statements — intentionally omitted.
  } else {
    // ── Standard debt reminder mode ─────────────────────────
    message =
      `Hello ${customer.name}, this is a reminder from ${shopName} that your current balance is ` +
      `${currency} ${Math.abs(balance).toLocaleString()}. Please clear it at your earliest convenience.`;

    if (latestReceipt) {
      message += ` You can view your latest receipt here: ${latestReceipt.receipt_url}`;
    }
  }

  // 4. Encode the full message (including any URL) before passing to WhatsApp
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// ─── STYLES ─────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#f0fdf4", fontFamily: "'DM Sans', sans-serif", color: "#0f172a" },

  stickyTop: { position: "sticky", top: 0, zIndex: 100, background: "linear-gradient(135deg, #059669 0%, #047857 100%)", boxShadow: "0 4px 24px rgba(5,150,105,0.25)" },

  header: { padding: "20px 20px 0px" },
  headerTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 38, height: 38, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  logoTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  addBtn: { background: "#fff", color: "#059669", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },

  searchWrap: { position: "relative", padding: "0 20px" },
  searchInput: { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 12, padding: "13px 42px 13px 44px", fontSize: 15, color: "#0f172a", outline: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  searchClearBtn: { position: "absolute", right: 34, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "color 0.15s" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "color 0.15s" },
  searchIcon: { position: "absolute", left: 34, top: "50%", transform: "translateY(-50%)", color: "#6ee7b7", fontSize: 18, pointerEvents: "none" },

  filterPillRow: { display: "flex", gap: 8, padding: "10px 20px 14px" },
  filterPill: (active) => ({
    background: active ? "#fff" : "rgba(255,255,255,0.18)",
    color: active ? "#059669" : "#fff",
    border: active ? "none" : "1.5px solid rgba(255,255,255,0.35)",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
    letterSpacing: 0.2,
  }),

  main: { maxWidth: 540, margin: "0 auto", padding: "16px 14px 80px" },

  summaryRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  summaryCard: (accent) => ({ background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${accent}` }),
  summaryLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryAmount: (color) => ({ fontSize: 24, fontWeight: 800, color, margin: "4px 0 0", letterSpacing: "-0.5px" }),

  clearedRatioBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, color: "#059669", marginTop: 6 },
  clearedProgressTrack: { height: 4, background: "#e2e8f0", borderRadius: 4, marginTop: 8, overflow: "hidden" },
  clearedProgressBar: (pct) => ({ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#34d399,#059669)", borderRadius: 4, transition: "width 0.6s ease" }),

  debtorSection: { background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", marginBottom: 16 },
  debtorTitle: { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  debtorRow: { marginBottom: 10 },
  debtorMeta: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  debtorName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  debtorAmt: { fontSize: 13, fontWeight: 800, color: "#ef4444" },
  debtorTrack: { height: 8, background: "#fef2f2", borderRadius: 6, overflow: "hidden" },
  debtorBar: (pct, idx) => {
    const colors = ["#ef4444", "#f97316", "#f59e0b"];
    return { height: "100%", width: `${pct}%`, background: colors[idx] || "#ef4444", borderRadius: 6, transition: "width 0.6s ease" };
  },

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

  editBtn: { display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.18)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 8, padding: "5px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", marginTop: 8, backdropFilter: "blur(4px)", letterSpacing: 0.2 },

  // WhatsApp button — debt reminder (red-ish green)
  waBtn: { display: "flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,211,102,0.35)", marginTop: 10, whiteSpace: "nowrap" },
  // WhatsApp button — "Send Statement" mode (distinct teal shade to signal different action)
  waStatementBtn: { display: "flex", alignItems: "center", gap: 6, background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 2px 8px rgba(14,165,233,0.35)", marginTop: 10, whiteSpace: "nowrap" },

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
  localeOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20, backdropFilter: "blur(4px)" },
  localeCard: { background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, padding: "32px 24px 28px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", textAlign: "center" },
  localeIcon: { fontSize: 48, marginBottom: 12 },
  localeTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: "0 0 6px" },
  localeSub: { fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 },
  localeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  localeField: { textAlign: "left" },
  localeConfirmBtn: { width: "100%", background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 16px rgba(5,150,105,0.35)" },
  localeDetecting: { fontSize: 13, color: "#94a3b8", margin: "12px 0 0" },
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
  receiptThumb: { width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10, marginBottom: 14, border: "2px solid #a7f3d0", display: "block" },
  receiptThumbTxn: { width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8, marginTop: 8, border: "1.5px solid #e2e8f0", display: "block", cursor: "pointer" },
  // ── Confirmation Dialog (centred, Windows-style) ──
  confirmOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000, padding: 24, backdropFilter: "blur(3px)",
  },
  confirmSheet: {
    background: "#fff", borderRadius: 20, width: "100%", maxWidth: 360,
    padding: "32px 24px 28px", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", textAlign: "center",
  },
  deleteWarningIcon: {
    width: 72, height: 72, background: "#fef2f2", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 32, margin: "0 auto 18px", border: "3px solid #fecaca",
  },
  deleteSheetTitle: { fontWeight: 800, fontSize: 20, color: "#0f172a", margin: "0 0 8px" },
  deleteSheetDesc: { fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 28px" },
  deleteActionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  deleteCancelBtn: {
    background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 14,
    padding: "15px", fontWeight: 700, fontSize: 15, cursor: "pointer",
  },
  deleteConfirmBtn: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none",
    borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 15, cursor: "pointer",
    boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
  },
  // ── Toast notification ──
  toastWrap: (visible) => ({
    position: "fixed", bottom: 32, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
    opacity: visible ? 1 : 0, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    zIndex: 3000, pointerEvents: "none",
  }),
  toast: (type) => ({
    display: "flex", alignItems: "center", gap: 10,
    background: type === "error" ? "#fef2f2" : "#0f172a",
    color: type === "error" ? "#ef4444" : "#fff",
    border: type === "error" ? "1.5px solid #fecaca" : "none",
    borderRadius: 14, padding: "12px 20px",
    fontSize: 14, fontWeight: 700,
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    whiteSpace: "nowrap",
  }),
};

// ─── FORMATTERS ─────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const makeFmt = (currency) => (n) => `${currency} ${Math.abs(n).toLocaleString()}`;

// ─── WHATSAPP ICON (inline SVG) ──────────────────────────────
function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

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
  const [activeFilter, setActiveFilter] = useState("All");
  const searchRef = useRef();
  const [toast, setToast]               = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  const showToast = (message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const [confirmDelete, setConfirmDelete]           = useState(null); // holds customer object or null
  const [confirmRemoveReceipt, setConfirmRemoveReceipt] = useState(null); // holds txn id or null
  const [confirmLogout, setConfirmLogout]           = useState(false);  // logout confirm flag

  const [isLoggedIn, setIsLoggedIn]     = useState(() => localStorage.getItem("khaata_session") === "1");
  const [loginForm, setLoginForm]       = useState({ user: "", pass: "" });
  const [showPass, setShowPass]         = useState(false);
  const [loginError, setLoginError]     = useState("");

  const [settings, setSettings]         = useState(null);
  const [showLocale, setShowLocale]     = useState(false);
  const [localeForm, setLocaleForm]     = useState({ country: "", currency: "" });
  const [detecting, setDetecting]       = useState(false);
  const [savingLocale, setSavingLocale] = useState(false);

  const fmtRs = makeFmt(settings?.currency || "");

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

  const handleLogout = () => setConfirmLogout(true);

  const handleFinalLogout = () => {
    setConfirmLogout(false);
    localStorage.removeItem("khaata_session");
    setIsLoggedIn(false);
    setLoginForm({ user: "", pass: "" });
    setCustomers([]); setTransactions([]); setSettings(null);
    setSelected(null); setSearch(""); setModal(null);
  };

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
            <div style={{ position: "relative" }}>
              <input
                style={{ ...S.input, paddingRight: 44, marginBottom: 0 }}
                placeholder="Enter password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={loginForm.pass}
                onChange={e => setLoginForm(p => ({ ...p, pass: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button
                style={S.eyeBtn}
                type="button"
                onClick={() => setShowPass(p => !p)}
                title={showPass ? "Hide password" : "Show password"}
                onMouseEnter={e => e.currentTarget.style.color = "#059669"}
                onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={{ marginBottom: 14 }} />
            <button style={S.submitBtn("#059669")} onClick={handleLogin}>
              🔐 Login to Khaata Book
            </button>
            
          </div>
        </div>
      </>
    );
  }

  const balance = (customerId) => {
    return transactions
      .filter(t => t.customer_id === customerId)
      .reduce((sum, t) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);
  };

  const filtered = customers
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
    .filter(c => {
      if (activeFilter === "Pending") return balance(c.id) > 0;
      if (activeFilter === "Cleared") return balance(c.id) === 0;
      return true;
    });

  const totalCredit  = customers.reduce((s, c) => { const b = balance(c.id); return b > 0 ? s + b : s; }, 0);
  const totalCleared = customers.filter(c => balance(c.id) === 0).length;
  const clearedPct   = customers.length > 0 ? Math.round((totalCleared / customers.length) * 100) : 0;

  const topDebtors = customers
    .map(c => ({ ...c, bal: balance(c.id) }))
    .filter(c => c.bal > 0)
    .sort((a, b) => b.bal - a.bal)
    .slice(0, 3);

  const selectedTxns = selected
    ? [...transactions].filter(t => t.customer_id === selected.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

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

  const handleUpdateCustomer = async () => {
    if (!form.name?.trim() || !form.phone?.trim() || !selected) return;
    setSaving(true);
    try {
      await sql(
        "UPDATE customers SET name = $1, phone = $2 WHERE id = $3",
        [form.name.trim(), form.phone.trim(), selected.id]
      );
      await loadData();
      setSelected(prev => ({ ...prev, name: form.name.trim(), phone: form.phone.trim() }));
    } catch (e) { alert("Error updating customer: " + e.message); }
    setSaving(false);
    closeModal();
  };

  const handleDeleteCustomer = (e, customer) => {
    e.stopPropagation();
    setConfirmDelete(customer);  // open the confirmation sheet
  };

  const handleFinalDelete = async () => {
    if (!confirmDelete) return;
    const customer = confirmDelete;
    setConfirmDelete(null);
    try {
      await sql("DELETE FROM customers WHERE id = $1", [customer.id]);
      if (selected?.id === customer.id) setSelected(null);
      await loadData();
      showToast(`🗑 "${customer.name}" deleted successfully`);
    } catch (err) { showToast("Error deleting customer: " + err.message, "error"); }
  };

  const handleRemoveReceipt = (txnId) => {
    setConfirmRemoveReceipt(txnId); // open confirmation sheet
  };

  const handleFinalRemoveReceipt = async () => {
    if (!confirmRemoveReceipt) return;
    const txnId = confirmRemoveReceipt;
    setConfirmRemoveReceipt(null);
    try {
      await sql("UPDATE transactions SET receipt_url = NULL WHERE id = $1", [txnId]);
      await loadData();
      showToast("🗑 Receipt photo removed");
    } catch (err) { showToast("Error removing receipt: " + err.message, "error"); }
  };

  const selectedBalance = selected ? balance(selected.id) : 0;
  const shopName = settings?.country ? `Khaata Book (${settings.country})` : "Khaata Book";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <script src="https://widget.cloudinary.com/v2.0/global/all.js" async />

      <div style={S.app}>
        <div style={S.stickyTop}>
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
              {search && (
                <button
                  style={S.searchClearBtn}
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  title="Clear search"
                  onMouseEnter={e => e.currentTarget.style.color = "#475569"}
                  onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={S.filterPillRow}>
            {["All", "Pending", "Cleared"].map(f => (
              <button
                key={f}
                style={S.filterPill(activeFilter === f)}
                onClick={() => setActiveFilter(f)}
              >
                {f === "All" ? "👥 All" : f === "Pending" ? "🔴 Pending" : "✅ Cleared"}
              </button>
            ))}
          </div>
        </div>

        <div style={S.main}>
          <div style={S.summaryRow}>
            <div style={S.summaryCard("#ef4444")}>
              <p style={S.summaryLabel}>Total Outstanding</p>
              <p style={S.summaryAmount("#ef4444")}>{fmtRs(totalCredit)}</p>
            </div>
            <div style={S.summaryCard("#059669")}>
              <p style={S.summaryLabel}>Cleared Accounts</p>
              <p style={S.summaryAmount("#059669")}>{totalCleared} / {customers.length}</p>
              {customers.length > 0 && (
                <>
                  <div style={S.clearedRatioBadge}>
                    ✓ {clearedPct}% healthy
                  </div>
                  <div style={S.clearedProgressTrack}>
                    <div style={S.clearedProgressBar(clearedPct)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {topDebtors.length > 0 && (
            <div style={S.debtorSection}>
              <p style={{ ...S.debtorTitle, margin: "0 0 12px" }}>🏆 Top Debtors</p>
              {topDebtors.map((c, idx) => {
                const sharePct = totalCredit > 0 ? Math.round((c.bal / totalCredit) * 100) : 0;
                return (
                  <div key={c.id} style={S.debtorRow}>
                    <div style={S.debtorMeta}>
                      <span style={S.debtorName}>{c.name}</span>
                      <span style={S.debtorAmt}>{fmtRs(c.bal)} <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11 }}>({sharePct}%)</span></span>
                    </div>
                    <div style={S.debtorTrack}>
                      <div style={S.debtorBar(sharePct, idx)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── SELECTED CUSTOMER DETAIL ─── */}
          {selected && (
            <div style={S.detailPanel}>
              <div style={S.detailHeader}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <p style={S.detailName}>{selected.name}</p>
                    <button
                      style={S.editBtn}
                      onClick={() => { setForm({ name: selected.name, phone: selected.phone }); setModal("edit_customer"); }}
                      title="Edit customer details"
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                  <p style={{ ...S.detailPhone, margin: 0 }}>📞 {selected.phone}</p>

                  {/* ── WhatsApp Button: Reminder vs Statement ── */}
                  {selectedBalance > 0 ? (
                    // Outstanding balance → red-flavoured reminder
                    <button
                      style={S.waBtn}
                      onClick={() =>
                        sendWhatsAppReminder(
                          selected,
                          selectedBalance,
                          settings?.currency || "",
                          shopName,
                          transactions,
                          false          // isCleared = false
                        )
                      }
                    >
                      <WhatsAppIcon size={15} />
                      Send Reminder
                    </button>
                  ) : (
                    // Balance cleared → teal "Send Statement" button (active, not disabled)
                    <button
                      style={S.waStatementBtn}
                      onClick={() =>
                        sendWhatsAppReminder(
                          selected,
                          selectedBalance,
                          settings?.currency || "",
                          shopName,
                          transactions,
                          true           // isCleared = true
                        )
                      }
                      title="Send a cleared-account statement via WhatsApp"
                    >
                      <WhatsAppIcon size={15} />
                      Send Statement
                    </button>
                  )}
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
                      {t.receipt_url && (
                        <div style={{ position: "relative", marginTop: 8 }}>
                          <a href={t.receipt_url} target="_blank" rel="noreferrer">
                            <img src={t.receipt_url} alt="Receipt" style={S.receiptThumbTxn} />
                          </a>
                          <button
                            onClick={() => handleRemoveReceipt(t.id)}
                            title="Remove receipt photo"
                            style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", cursor: "pointer", lineHeight: 1.4 }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <p style={{ ...S.txnAmt(t.type), margin: 0 }}>
                      {t.type === "credit" ? "+" : "−"}{fmtRs(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={S.sectionTitle}>
            {search ? `Results for "${search}"` : activeFilter === "All" ? "All Customers" : `${activeFilter} Customers`} ({filtered.length})
          </p>

          {loading ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>⏳</div>
              <p style={S.emptyText}>Loading ledger…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🔍</div>
              <p style={S.emptyText}>{search ? "No customer found" : `No ${activeFilter.toLowerCase()} customers`}</p>
              <p style={S.emptySub}>{search ? "Try a different name or phone" : activeFilter === "All" ? "Tap '+ New Customer' to get started" : `No customers with ${activeFilter.toLowerCase()} status`}</p>
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

            {modal === "edit_customer" && (
              <>
                <p style={S.sheetTitle}>✏️ Edit Customer Profile</p>
                <label style={S.label}>Full Name</label>
                <input style={S.input} placeholder="e.g. Ali Khan" value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <label style={S.label}>Phone Number</label>
                <input style={S.input} placeholder="e.g. 03001234567" type="tel" value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                <button style={S.submitBtn("#059669")} onClick={handleUpdateCustomer} disabled={saving}>
                  {saving ? "Saving…" : "✓ Save Changes"}
                </button>
              </>
            )}

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

            {modal === "add_credit" && (
              <>
                <p style={S.sheetTitle}>📌 Add Udhaar for {selected?.name}</p>
                <label style={S.label}>Amount ({settings?.currency || "currency"})</label>
                <input style={S.input} placeholder="e.g. 250" type="number" min="1" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                <label style={S.label}>Description</label>
                <input style={S.input} placeholder="e.g. Rice, Sugar, Oil" value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <label style={S.label}>Receipt Photo (optional)</label>
                {receiptUrl
                  ? <>
                      <img src={receiptUrl} alt="Receipt preview" style={S.receiptThumb} />
                      <div style={{ ...S.uploadDone, marginBottom: 14 }}>
                        ✅ Receipt uploaded <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ color: "#047857" }}>(open full size)</a>
                        <button onClick={() => setReceiptUrl("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Remove</button>
                      </div>
                    </>
                  : <button style={S.uploadBtn} type="button" onClick={() => openCloudinaryWidget(setReceiptUrl)}>📷 Upload Receipt Photo</button>
                }
                <button style={S.submitBtn("#ef4444")} onClick={() => handleAddTxn("credit")} disabled={saving}>
                  {saving ? "Saving…" : "📌 Add Udhaar Entry"}
                </button>
              </>
            )}

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
                  ? <>
                      <img src={receiptUrl} alt="Receipt preview" style={S.receiptThumb} />
                      <div style={{ ...S.uploadDone, marginBottom: 14 }}>
                        ✅ Receipt uploaded <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ color: "#047857" }}>(open full size)</a>
                        <button onClick={() => setReceiptUrl("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Remove</button>
                      </div>
                    </>
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
      {/* ─── REMOVE RECEIPT CONFIRMATION SHEET ─── */}
      {confirmRemoveReceipt && (
        <div style={S.confirmOverlay} onClick={() => setConfirmRemoveReceipt(null)}>
          <div style={S.confirmSheet} onClick={e => e.stopPropagation()}>
            <div style={S.deleteWarningIcon}>🧾</div>
            <p style={S.deleteSheetTitle}>Remove Receipt Photo?</p>
            <p style={S.deleteSheetDesc}>
              This will permanently remove the receipt image attached to this entry.
              <br />The transaction record itself will <strong>not</strong> be affected.
              <br />This action cannot be undone.
            </p>
            <div style={S.deleteActionRow}>
              <button style={S.deleteCancelBtn} onClick={() => setConfirmRemoveReceipt(null)}>
                Cancel
              </button>
              <button style={S.deleteConfirmBtn} onClick={handleFinalRemoveReceipt}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION SHEET ─── */}
      {confirmDelete && (
        <div style={S.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={S.confirmSheet} onClick={e => e.stopPropagation()}>
            <div style={S.deleteWarningIcon}>🗑️</div>
            <p style={S.deleteSheetTitle}>Delete Customer?</p>
            <p style={S.deleteSheetDesc}>
              You are about to permanently delete{" "}
              <strong style={{ color: "#0f172a" }}>{confirmDelete.name}</strong>.
              <br />This will remove their profile and <strong>all transaction history</strong>. This action cannot be undone.
            </p>
            <div style={S.deleteActionRow}>
              <button style={S.deleteCancelBtn} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button style={S.deleteConfirmBtn} onClick={handleFinalDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOGOUT CONFIRMATION ─── */}
      {confirmLogout && (
        <div style={S.confirmOverlay} onClick={() => setConfirmLogout(false)}>
          <div style={S.confirmSheet} onClick={e => e.stopPropagation()}>
            <div style={{ ...S.deleteWarningIcon, background: "#f0fdf4", border: "3px solid #a7f3d0" }}>
              🔐
            </div>
            <p style={S.deleteSheetTitle}>Log Out?</p>
            <p style={S.deleteSheetDesc}>
              You will be signed out of Khaata Book.
              <br />You will need your credentials to log back in.
            </p>
            <div style={S.deleteActionRow}>
              <button style={S.deleteCancelBtn} onClick={() => setConfirmLogout(false)}>
                Cancel
              </button>
              <button
                style={{ ...S.deleteConfirmBtn, background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 4px 16px rgba(5,150,105,0.35)" }}
                onClick={handleFinalLogout}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST ─── */}
      <div style={S.toastWrap(toast.visible)}>
        <div style={S.toast(toast.type)}>{toast.message}</div>
      </div>
    </>
  );
}