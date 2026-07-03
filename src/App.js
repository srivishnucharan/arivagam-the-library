// ARIVAGAM LIBRARY MANAGEMENT SYSTEM
// Full React JSX Single File Application
// Inspired by OpenLibrary | Branded for Arivagam
// Backend: Supabase (schema + integration hooks provided)

import { useState, useEffect, useRef, useCallback } from "react";
import logo from "./logo.png";
import { BarcodeDetector as BarcodeDetectorPolyfill } from "barcode-detector/pure";

// ─── SUPABASE CLIENT (swap URL + anon key with your project) ─────────────────
import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://tkrqmqouotfsbatntdan.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcnFtcW91b3Rmc2JhdG50ZGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODkxMzgsImV4cCI6MjA5MDI2NTEzOH0.THIs6db9ILLfu1UsnpK8GbdFWA45E9b0xn5dNLpco6k");

// ─── SUPABASE MAPPERS ─────────────────────────────────────────────────────────
const cleanAuthor = (a) => (!a || a === "NULL" || a === "null" || a === "NA" || /^NULL/i.test(a)) ? "" : a;
const dbToBook = (b) => ({
  id: b.id, title: b.title, author: cleanAuthor(b.author), genre: b.genre,
  language: b.language || "Tamil", year: b.year, isbn: b.isbn || "",
  cover: b.cover_url || "", copies: b.total_copies, available: b.available_copies,
  status: b.status || "active", catalogueNo: b.catalogue_no || 0,
  colorCode: b.color_code || "", catalogueId: b.catalogue_id || "",
  accessionNumber: b.accession_number || "", ageGroup: b.age_group || "",
  category: b.category || "", tags: b.tags || "",
  callNumberPrefix: b.call_number_prefix || "", callNumberSuffix: b.call_number_suffix || "",
});
const bookToDB = (b) => ({
  title: b.title, author: b.author, genre: b.genre, language: b.language,
  year: parseInt(b.year) || null, isbn: b.isbn, cover_url: b.cover,
  total_copies: parseInt(b.copies) || 1, available_copies: parseInt(b.copies) || 1,
  status: b.status || "active", catalogue_no: parseInt(b.catalogueNo) || null,
  color_code: b.colorCode,
  age_group: parseInt(b.ageGroup) || null,
  category: b.category || null, tags: b.tags || null,
  call_number_prefix: b.callNumberPrefix || null,
  call_number_suffix: b.callNumberSuffix || null,
});
const dbToUser = (u) => ({
  id: u.id, membershipId: u.membership_id || "",
  name: u.child_member_name, email: u.email_id, phone: u.phone_number || "",
  role: u.role, status: u.status, activationStatus: u.activation_status || "", membershipType: u.membership_type || "annual",
  fees: parseFloat(u.fees_due) || 0,
  joined: u.joined_at ? u.joined_at.split("T")[0] : new Date().toISOString().split("T")[0],
  enrollmentDate: u.enrollment_date ? u.enrollment_date.split("T")[0] : "",
  password: u.password || "", branch: u.branch_id || "",
  plan: u.membership_plan || null,
  planDescription: u.membership_plan_description || "",
  planRenewedAt: u.plan_renewed_at || null,
  upiId: u.upi_id || "",
  renewalRequestedAt: u.renewal_requested_at || null,
  childMemberName: u.child_member_name || "",
  childMemberDOB: u.child_member_dateofbirth || "",
  guardianName: u.parent_guardian_name || u.guardian_name || "",
  relationshipToMember: u.relationship_to_the_member || "",
  altPhone: u.alternate_phone_number || "",
  address: u.address || "",
  paymentMethod: u.payment_method || u.payment_mode || "",
  registrationFees: u.onetime_registration_fees != null ? String(u.onetime_registration_fees) : "",
  offerType: u.offer_type || "",
  refundableDeposit: u.refundable_deposit != null ? String(u.refundable_deposit) : "",
  comments: u.comments || "",
});
const dbToTxn = (t) => ({
  id: t.id, memberId: t.member_id,
  memberName: t.users?.child_member_name || t.member_name || "",
  bookId: t.book_id, bookTitle: t.books?.title || t.book_title || "",
  borrowDate: t.borrowed_at ? t.borrowed_at.split("T")[0] : t.borrow_date,
  dueDate: t.due_date ? t.due_date.split("T")[0] : null,
  returnDate: t.returned_at ? t.returned_at.split("T")[0] : null,
  lateFee: parseFloat(t.late_fee) || 0,
  copyId: t.copy_id || null,
  accessionNumber: t.book_copies?.accession_number || null,
});
const dbToRequest = (r) => ({
  id: r.id, memberId: r.member_id, memberName: r.member_name,
  bookId: r.book_id, bookTitle: r.book_title,
  requestDate: r.request_date || r.created_at?.split("T")[0],
  status: r.status, copyId: r.copy_id || null,
});
const dbToWaitlist = (w) => ({
  id: w.id, bookId: w.book_id, bookTitle: w.book_title || "",
  memberId: w.member_id, memberName: w.member_name || "",
  position: w.position, status: w.status || "waiting",
  joinedAt: w.joined_at ? w.joined_at.split("T")[0] : w.created_at?.split("T")[0],
  reservedAt: w.reserved_at ? w.reserved_at.split("T")[0] : null,
  graceDeadline: w.grace_deadline ? w.grace_deadline.split("T")[0] : null,
});
const dbToCopy = (c) => ({
  id: c.id, bookId: c.book_id,
  accessionNumber: c.accession_number,
  condition: c.condition || "good",
  status: c.status || "available",
});
const dbToMemberStatus = (s) => ({
  id: s.id, memberId: s.member_id || "", memberName: s.member_name || "",
  status: s.status || "", membershipPlan: s.membership_plan || "",
  lastPaidMonth: s.last_paid_month || "",
  booksWithMember: s.number_of_books_with_member || "",
});
const dbToPayment = (p) => ({
  id: p.id, date: p.date || "",
  memberId: p.member_id || "",
  childMemberName: p.child_member_name || "",
  bookPlan: p.book_plan || "",
  amountPaid: parseFloat(p.amount_paid) || 0,
  paymentMethod: p.payment_method || "",
  fromAccount: p.from_account || "",
  nextFeeMonth: p.next_fee_month || "",
  panNo: p.pan_no || "",
  paymentType: p.payment_type || "",
});

// ARIVAGAM LIBRARY MANAGEMENT SYSTEM — v2.0
// Create React App compatible · All-in-one App.js
// Improvements: Registration, Borrow/Return, Member Approval, Shared Book State, Mobile UI

// ─── ARIVAGAM COLOR PALETTE ───────────────────────────────────────────────────
const C = {
  gold: "#F5C518",
  goldDark: "#D4A017",
  goldLight: "#FDE68A",
  green: "#1B4332",
  greenMid: "#2D6A4F",
  greenLight: "#52B788",
  cream: "#FFFBF0",
  white: "#FFFFFF",
  gray50: "#F9F7F0",
  gray100: "#EDE9DC",
  gray300: "#C8C2A8",
  gray600: "#6B6456",
  gray900: "#1A1714",
  red: "#C0392B",
  redLight: "#FADBD8",
  blue: "#1A5276",
  blueLight: "#D6EAF8",
  orange: "#E67E22",
};

// ─── GENRES ───────────────────────────────────────────────────────────────────
const GENRES = [
  "Historical Fiction", "Philosophy", "Classic Fiction", "Short Stories",
  "Epic / Mythology", "Biography", "History", "Poetry",
  "Mythology / Retelling", "Science", "Children", "Tamil Literature",
  "Hindi Literature", "Indian Languages", "Self Help", "Spirituality",
];

const LANGUAGES = ["Tamil", "Hindi", "English", "Telugu", "Kannada", "Malayalam", "Sanskrit", "Bengali", "Marathi", "Other"];

// ─── CATALOGUE COLOR CODES ────────────────────────────────────────────────────
const COLOR_CODES = [
  { code: "R",  label: "Red",    hex: "#E74C3C" },
  { code: "B",  label: "Blue",   hex: "#2980B9" },
  { code: "G",  label: "Green",  hex: "#27AE60" },
  { code: "Y",  label: "Yellow", hex: "#F1C40F" },
  { code: "O",  label: "Orange", hex: "#E67E22" },
  { code: "P",  label: "Purple", hex: "#8E44AD" },
  { code: "Pk", label: "Pink",   hex: "#E91E8C" },
  { code: "Br", label: "Brown",  hex: "#795548" },
  { code: "W",  label: "White",  hex: "#9E9E9E" },
  { code: "Bk", label: "Black",  hex: "#212121" },
];

// abbreviation helpers
const genreAbbr  = (g) => (g || "").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
const langAbbr   = (l) => (l || "").slice(0, 1).toUpperCase();
const colorAbbr  = (c) => { const f = COLOR_CODES.find(x => x.code === c); return f ? f.code : ""; };

const DEFAULT_CATID_FIELDS = { catalogueNo: true, genre: true, language: true, colorCode: true };

// Fallback password for members imported without one set (e.g. bulk CSV/DB loads) — lets them log in until the librarian sets a real password.
const DEFAULT_MEMBER_PASSWORD = "User@123";

// ─── DEFAULT SETTINGS ─────────────────────────────────────────────────────────
const DEFAULT_PLANS = [
  { id: "plan-basic",   name: "Leisure Reader",    borrowLimit: 2, cost: 300,  refundableDeposit: 500  },
  { id: "plan-pro",     name: "Standard Reader",   borrowLimit: 3, cost: 500,  refundableDeposit: 750  },
  { id: "plan-power",   name: "Voracious Reader",  borrowLimit: 4, cost: 800,  refundableDeposit: 1000 },
  { id: "plan-super",   name: "Super Reader",      borrowLimit: 5, cost: 1200, refundableDeposit: 1250 },
  { id: "plan-inhouse", name: "Inhouse Reading",   borrowLimit: 0, cost: 0,    refundableDeposit: 0, inhouseOnly: true },
];

const DEFAULT_SETTINGS = {
  sections: {
    trending:    { label: "Trending Books",      enabled: true  },
    classics:    { label: "Classic Books",        enabled: true  },
    weLove:      { label: "Books We Love",        enabled: true  },
    newArrivals: { label: "New Arrivals",          enabled: true  },
    byGenre:     { label: "Browse by Genre",       enabled: true  },
    searchPromo: { label: "Search Our Collection", enabled: true  },
  },
  browseMenu: {
    genres:      { label: "Genre",       enabled: true  },
    authors:     { label: "Authors",     enabled: true  },
    languages:   { label: "Languages",   enabled: true  },
    collections: { label: "Collections", enabled: true  },
    subjects:    { label: "Subjects",    enabled: false },
  },
  fees: {
    lateFeePerDay:     5,
    bookDamageFee:     200,
    bookLostFee:       500,
    cautionDeposit:    1000,
    borrowDays:        14,
    gracePeriodDays:   3,
  },
  plans: DEFAULT_PLANS,
  catalogueIdFields: { catalogueNo: true, genre: true, language: true, colorCode: true },
  library: {
    name:     "Prakrith Arivagam",
    tagline:  "A screen-free sanctuary where young minds grow through stories, science, and creativity.",
    address:  "1st Floor, GR Complex, Swamy Vivekananda Rd, New Perungalathur, Chennai - 600063",
    phone:    "+91 94454 11121",
    email:    "contact@arivagam.com",
    upiId:    "",
    renewalReminderDays: 5,
  },
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_MEMBERS = [];
const SEED_LIBRARIANS = [];

const SEED_BRANCHES = [
  { id: "BR001", name: "Perungalathur Main", address: "1st Floor, GR Complex, Swamy Vivekananda Rd, New Perungalathur, Chennai - 600063", status: "active", books: 350, members: 89, librarian: "Sathya Moorthy" },
];

const SEED_TRANSACTIONS = [];


// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};
const isOverdue = (dueDate) => !dueDate ? false : new Date(dueDate) < new Date();
const calcLateFee = (dueDate, feePerDay) => {
  if (!isOverdue(dueDate)) return 0;
  const diff = Math.floor((new Date() - new Date(dueDate)) / 86400000);
  return diff * feePerDay;
};
const nextId = (list, prefix) => {
  const nums = list.map(x => parseInt(x.id.replace(prefix, ""))).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(3, "0");
};

// Generate S1YYMMXX membership ID. sameMonthCount = # of active members already joined in same month.
const genMembershipId = (joinDateStr, sameMonthCount) => {
  const d = new Date(joinDateStr || new Date());
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `S1${yy}${mm}${String(sameMonthCount + 1).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    search:      <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    book:        <svg {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    user:        <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    users:       <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    menu:        <svg {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    x:           <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus:        <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit:        <svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:       <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    check:       <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    chevronDown: <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>,
    chevronUp:   <svg {...p}><polyline points="18 15 12 9 6 15"/></svg>,
    settings:    <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    branch:      <svg {...p}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>,
    money:       <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    rupee:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="none"><text x="12" y="18" textAnchor="middle" fontSize="18" fontWeight="700" fill={color} fontFamily="inherit">₹</text></svg>,
    home:        <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    eye:         <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    logout:      <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    alert:       <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    "return":    <svg {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
    calendar:    <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    lock:        <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    mail:        <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    phone:       <svg {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.15 9.11a20 20 0 01-3.07-8.67A2 2 0 012.06 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
    info:        <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    tag:         <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    barcode:     <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="2" y="2" width="2" height="20" rx="1"/><rect x="6" y="2" width="1" height="20" rx=".5"/><rect x="9" y="2" width="3" height="20" rx="1"/><rect x="14" y="2" width="1" height="20" rx=".5"/><rect x="17" y="2" width="2" height="20" rx="1"/><rect x="21" y="2" width="1" height="20" rx=".5"/></svg>,
  };
  return icons[name] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: value ? C.green : C.gray300, position: "relative", transition: "background .2s", flexShrink: 0 }}>
    <span style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: C.white, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
  </button>
);

const Badge = ({ label, color = C.green, size = "sm" }) => (
  <span style={{ background: color + "22", color, fontSize: size === "sm" ? 11 : 13, fontWeight: 600, padding: size === "sm" ? "2px 8px" : "4px 12px", borderRadius: 20, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>{label}</span>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", icon, disabled, style: extraStyle = {} }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontFamily: "inherit", transition: "all .15s", opacity: disabled ? .5 : 1 };
  const sizes = { sm: { fontSize: 12, padding: "6px 12px" }, md: { fontSize: 13, padding: "9px 18px" }, lg: { fontSize: 15, padding: "12px 24px" } };
  const variants = {
    primary:  { background: C.green, color: C.white },
    secondary:{ background: C.gold,  color: C.green },
    outline:  { background: "transparent", color: C.green, border: `1.5px solid ${C.green}` },
    ghost:    { background: "transparent", color: C.gray600 },
    danger:   { background: C.red,   color: C.white },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}>{icon && <Icon name={icon} size={size === "sm" ? 13 : 15} color={variants[variant].color} />}{children}</button>;
};

const Input = ({ label, type = "text", value, onChange, placeholder, required, error, icon, hint, ...rest }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon name={icon} size={15} color={C.gray300} /></span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest}
        style={{ width: "100%", padding: icon ? "9px 12px 9px 34px" : "9px 12px", borderRadius: 8, border: `1.5px solid ${error ? C.red : C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: C.white, color: C.gray900, transition: "border .15s" }}
        onFocus={e => e.target.style.borderColor = C.green}
        onBlur={e => e.target.style.borderColor = error ? C.red : C.gray300}
      />
    </div>
    {hint && !error && <p style={{ fontSize: 11, color: C.gray600, margin: "4px 0 0" }}>{hint}</p>}
    {error && <p style={{ fontSize: 11, color: C.red, margin: "4px 0 0" }}>{error}</p>}
  </div>
);

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>}
    <select value={value} onChange={onChange} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", background: C.white, color: C.gray900, outline: "none", boxSizing: "border-box" }}>
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Modal = ({ open, onClose, title, children, width = 520 }) => {
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} className="modal-inner" style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.gray100}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.green }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}><Icon name="x" size={20} color={C.gray600} /></button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, type === "error" ? 5500 : 3500); return () => clearTimeout(t); }, [onClose, type]);
  const colors = { success: { bg: "#D5F5E3", border: "#27AE60", text: "#1E8449" }, error: { bg: C.redLight, border: C.red, text: C.red }, info: { bg: C.blueLight, border: C.blue, text: C.blue } };
  const col = colors[type] || colors.success;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: col.bg, border: `1.5px solid ${col.border}`, color: col.text, padding: "12px 20px", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.15)", zIndex: 2000, fontSize: 14, fontWeight: 600, maxWidth: 380, textAlign: "center" }}>
      {message}
    </div>
  );
};

const StatCard = ({ label, value, icon, color = C.green, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", cursor: onClick ? "pointer" : "default", transition: "box-shadow .15s, transform .15s" }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; } }}>
    <div style={{ width: 42, height: 42, background: color + "18", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: onClick ? color : C.gray600, marginTop: 3, fontWeight: onClick ? 600 : 400 }}>{label}{onClick && " →"}</div>
    </div>
  </div>
);

const BookCard = ({ book, onClick, bookCopies: _bookCopies, user, waitlist, requests, onBorrow, onWaitlist }) => {
  // available_copies is decremented on request placement and incremented on rejection/return.
  // This is the single source of truth — no need to count pending requests separately.
  const effectiveAvailable = book.available ?? 0;
  const myWaitlistEntry = waitlist?.find(w => w.bookId === book.id && w.memberId === user?.id && (w.status === "waiting" || w.status === "reserved"));
  const bookWaitlist    = waitlist?.filter(w => w.bookId === book.id && w.status === "waiting") || [];
  const isReservedForMe = myWaitlistEntry?.status === "reserved";
  const isMember        = user?.role === "member" && user?.status === "active";

  // Action button config
  let btnLabel = null, btnBg = null, btnColor = null, btnBorder = null, btnHandler = null, btnTitle = null;
  if (isMember) {
    if (myWaitlistEntry) {
      btnLabel   = isReservedForMe ? "Reserved for you!" : `Waitlist #${myWaitlistEntry.position}`;
      btnBg      = isReservedForMe ? C.gold : "#E8F5E9";
      btnColor   = isReservedForMe ? C.green : C.greenMid;
      btnBorder  = isReservedForMe ? C.goldDark : C.greenLight;
      btnHandler = null;
      btnTitle   = isReservedForMe ? `Collect by ${myWaitlistEntry.graceDeadline || "soon"}` : `You are #${myWaitlistEntry.position} in the waitlist`;
    } else if (effectiveAvailable > 0) {
      btnLabel   = "Borrow";
      btnBg      = C.green;
      btnColor   = C.white;
      btnBorder  = C.green;
      btnHandler = e => { e.stopPropagation(); onBorrow && onBorrow(book); };
      btnTitle   = "Place a borrow request and collect from the Librarian";
    } else {
      const wlCount = bookWaitlist.length;
      btnLabel   = wlCount > 0 ? `Join Waitlist (#${wlCount + 1})` : "Join Waitlist";
      btnBg      = "#6B6456";
      btnColor   = C.white;
      btnBorder  = "#6B6456";
      btnHandler = e => { e.stopPropagation(); onWaitlist && onWaitlist(book); };
      btnTitle   = wlCount > 0 ? `${wlCount} person${wlCount > 1 ? "s" : ""} ahead — click to join the waitlist` : "All copies checked out — click to join the waitlist";
    }
  }

  return (
    <div style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden", background: C.white, boxShadow: "0 2px 8px rgba(0,0,0,.08)", transition: "transform .18s, box-shadow .18s", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.16)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)"; }}>

      {/* Cover */}
      <div onClick={() => onClick && onClick(book)} style={{ height: 240, background: C.gray100, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        <img src={book.cover} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; }} />
        {effectiveAvailable === 0 && !myWaitlistEntry && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.65)", borderRadius: 6, padding: "3px 8px" }}>
            <span style={{ color: C.white, fontSize: 10, fontWeight: 700, letterSpacing: .5 }}>CHECKED OUT</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div onClick={() => onClick && onClick(book)} style={{ padding: "10px 12px 8px", flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gray900, lineHeight: 1.35, marginBottom: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.title}</div>
        <div style={{ fontSize: 11, color: C.gray600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author === 'NULL' || book.author === 'NA' ? '' : book.author}</div>
      </div>

      {/* Action button — always full width at bottom */}
      {btnLabel ? (
        <button
          onClick={btnHandler || undefined}
          title={btnTitle}
          style={{ margin: "0 10px 10px", padding: "9px 0", borderRadius: 8, border: `1.5px solid ${btnBorder}`, background: btnBg, color: btnColor, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: btnHandler ? "pointer" : "default", letterSpacing: .3, transition: "opacity .15s" }}
          onMouseEnter={e => { if (btnHandler) e.currentTarget.style.opacity = ".85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
          {btnLabel}
        </button>
      ) : (
        <div style={{ height: 10 }} />
      )}
    </div>
  );
};

const ArrowBtn = ({ dir, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ position: "absolute", [dir === "left" ? "left" : "right"]: -22, top: 120, transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none", background: disabled ? C.gray300 : C.green, boxShadow: disabled ? "none" : "0 4px 14px rgba(0,0,0,.25)", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = C.greenMid; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = C.green; }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left" ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
    </svg>
  </button>
);

const BookRow = ({ books, onBook, bookCopies, user, waitlist, requests, onBorrow, onWaitlist }) => {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(() => window.innerWidth <= 560 ? 2 : 6);
  useEffect(() => {
    const handler = () => {
      const next = window.innerWidth <= 560 ? 2 : 6;
      setPerPage(prev => { if (prev !== next) { setPage(0); } return next; });
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const totalPages = Math.max(1, Math.ceil(books.length / perPage));
  const visible = books.slice(page * perPage, (page + 1) * perPage);
  return (
    <div className="book-row-wrap">
      <ArrowBtn dir="left" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} />
      <div className="book-grid">
        {visible.map(b => <BookCard key={b.id} book={b} onClick={onBook} bookCopies={bookCopies} user={user} waitlist={waitlist} requests={requests} onBorrow={onBorrow} onWaitlist={onWaitlist} />)}
      </div>
      <ArrowBtn dir="right" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV
// ─────────────────────────────────────────────────────────────────────────────
const TopNav = ({ user, onLogout, onNavigate, currentPage, settings }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const bm = settings.browseMenu;
  const enabledBrowse = Object.entries(bm).filter(([, v]) => v.enabled);

  return (
    <nav style={{ background: "#0A1F0A", boxShadow: "0 2px 12px rgba(0,0,0,.2)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 60, gap: 8 }}>
        {/* Home link — no logo/brand, just a home icon */}
        <button onClick={() => { onNavigate("home"); setMenuOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px 8px 4px 0", marginRight: 8 }} title="Home">
          <Icon name="home" size={22} color={C.gold} />
        </button>

        {/* Desktop nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, flexWrap: "nowrap" }} className="desktop-nav">
          <NavLink label="Home" active={currentPage === "home"} onClick={() => onNavigate("home")} />
          <NavLink label="Catalog" active={currentPage === "catalog"} onClick={() => onNavigate("catalog")} />

          {/* Browse dropdown */}
          {enabledBrowse.length > 0 && (
            <div style={{ position: "relative" }} onMouseEnter={() => setBrowseOpen(true)} onMouseLeave={() => setBrowseOpen(false)}>
              <NavLink label="Browse" active={false} chevron />
              {browseOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, background: C.white, borderRadius: 10, boxShadow: "0 12px 36px rgba(0,0,0,.15)", minWidth: 180, overflow: "hidden", zIndex: 200 }}>
                  {enabledBrowse.map(([k, v]) => (
                    <button key={k} onClick={() => { onNavigate("catalog", { filter: k }); setBrowseOpen(false); }}
                      style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", fontSize: 14, color: C.gray900, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                      onMouseEnter={e => e.target.style.background = C.gray50}
                      onMouseLeave={e => e.target.style.background = "none"}>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Inline search bar */}
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,.15)", borderRadius: 8, marginLeft: 8, overflow: "hidden" }}>
            <input
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && navSearch.trim()) { onNavigate("catalog", { q: navSearch.trim() }); setNavSearch(""); } }}
              placeholder="Search books…"
              style={{ background: "transparent", border: "none", outline: "none", color: C.white, padding: "6px 10px", fontSize: 13, fontFamily: "inherit", width: 160 }}
            />
            <button
              onClick={() => { if (navSearch.trim()) { onNavigate("catalog", { q: navSearch.trim() }); setNavSearch(""); } }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center" }}>
              <Icon name="search" size={14} color={C.white} />
            </button>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,.1)", borderRadius: 8 }}>
                <Icon name="user" size={15} color={C.gold} />
                <span style={{ color: C.white, fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name.split(" ")[0]}</span>
                <Badge label={user.role} color={C.gold} />
              </div>
              {user.role !== "member" && (
                <Btn size="sm" variant="secondary" onClick={() => onNavigate(user.role === "admin" ? "admin" : "librarian")}>Dashboard</Btn>
              )}
              {user.role === "member" && (
                <Btn size="sm" variant="secondary" onClick={() => onNavigate("member")}>My Books</Btn>
              )}
              <button onClick={onLogout} style={{ background: "rgba(255,255,255,.1)", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8 }} title="Logout">
                <Icon name="logout" size={16} color={C.white} />
              </button>
            </>
          ) : (
            <>
              <Btn size="sm" variant="secondary" onClick={() => onNavigate("login", { tab: "member" })}>Sign In</Btn>
              <Btn size="sm" variant="outline" style={{ color: C.white, borderColor: "rgba(255,255,255,.4)" }} onClick={() => onNavigate("register")}>Register Free</Btn>
            </>
          )}
          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "none" }} className="mobile-hamburger">
            <Icon name={menuOpen ? "x" : "menu"} size={22} color={C.white} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: C.greenMid, borderTop: `1px solid rgba(255,255,255,.1)`, padding: "12px 16px" }}>
          {/* User info bar */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.1)", borderRadius: 10, marginBottom: 8 }}>
              <Icon name="user" size={16} color={C.gold} />
              <div style={{ flex: 1 }}>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                <div style={{ color: C.gold, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{user.role}</div>
              </div>
            </div>
          )}
          {[{ label: "Home", page: "home" }, { label: "Catalog", page: "catalog" }].map(l => (
            <button key={l.page} onClick={() => { onNavigate(l.page); setMenuOpen(false); }}
              style={{ display: "block", width: "100%", padding: "10px 12px", background: "none", border: "none", textAlign: "left", color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
              {l.label}
            </button>
          ))}
          {enabledBrowse.map(([k, v]) => (
            <button key={k} onClick={() => { onNavigate("catalog", { filter: k }); setMenuOpen(false); }}
              style={{ display: "block", width: "100%", padding: "10px 12px 10px 24px", background: "none", border: "none", textAlign: "left", color: "rgba(255,255,255,.75)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
              {v.label}
            </button>
          ))}
          {/* Auth actions */}
          <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,.15)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {user ? (
              <>
                {user.role === "member" && (
                  <button onClick={() => { onNavigate("member"); setMenuOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "10px 12px", background: "rgba(255,255,255,.1)", border: "none", textAlign: "left", color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
                    My Books
                  </button>
                )}
                {user.role !== "member" && (
                  <button onClick={() => { onNavigate(user.role === "admin" ? "admin" : "librarian"); setMenuOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "10px 12px", background: "rgba(255,255,255,.1)", border: "none", textAlign: "left", color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
                    Dashboard
                  </button>
                )}
                <button onClick={() => { onLogout(); setMenuOpen(false); }}
                  style={{ display: "block", width: "100%", padding: "10px 12px", background: "rgba(255,0,0,.15)", border: "none", textAlign: "left", color: "#ff8080", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="secondary" onClick={() => { onNavigate("login"); setMenuOpen(false); }}>Sign In</Btn>
                <Btn size="sm" variant="outline" style={{ color: C.white, borderColor: "rgba(255,255,255,.4)" }} onClick={() => { onNavigate("register"); setMenuOpen(false); }}>Register</Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }

        /* Book grid: 6 cols → 3 on tablet → 2 on phone */
        .book-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; padding-bottom: 10px; }
        @media (max-width: 900px)  { .book-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 560px)  { .book-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

        /* BookRow outer — narrower padding on mobile so arrow buttons fit */
        .book-row-wrap { position: relative; padding: 0 48px; }
        @media (max-width: 560px)  { .book-row-wrap { padding: 0 32px; } }

        /* Hero stats row */
        .hero-stats { display: flex; gap: 16px; flex-wrap: wrap; }
        @media (max-width: 640px)  { .hero-stats { gap: 8px; } .hero-stats > div { padding: 10px 14px !important; min-width: 68px !important; } }

        /* Catalog filter bar */
        .catalog-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 18px; }
        @media (max-width: 640px)  { .catalog-filters > * { width: 100%; } .catalog-filters input { width: 100% !important; } }

        /* Add Book / Edit form — collapse to 1 col on mobile */
        .book-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        @media (max-width: 560px)  { .book-form-grid { grid-template-columns: 1fr; } .book-form-grid > * { grid-column: 1 / -1 !important; } }

        /* Dashboard tabs — horizontal scroll on mobile */
        .dash-tabs { display: flex; gap: 2px; flex-wrap: nowrap; overflow-x: auto; border-bottom: 2px solid #F0F0F0; margin-bottom: 24px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .dash-tabs::-webkit-scrollbar { display: none; }

        /* Section padding reduction on mobile */
        @media (max-width: 640px)  {
          .home-sections { padding: 0 12px !important; }
          .home-hero { padding: 24px 16px !important; }
          .dash-wrap { padding: 16px 12px !important; }
        }

        /* Modal full-screen on mobile */
        @media (max-width: 560px) {
          .modal-inner { max-width: 100% !important; max-height: 100vh !important; border-radius: 0 !important; height: 100dvh; }
        }

        /* ── ADMIN DASHBOARD MOBILE ── */

        /* Books table: hide header, show rows as cards */
        @media (max-width: 640px) {
          .books-tbl-head { display: none !important; }
          .books-tbl-row {
            display: flex !important;
            flex-wrap: wrap;
            gap: 4px 10px;
            align-items: center;
          }
          .books-tbl-row > div:first-child  { flex: 0 0 100%; }
          .books-tbl-row > div:nth-child(2),
          .books-tbl-row > div:nth-child(3),
          .books-tbl-row > div:nth-child(4) { flex: 0 0 auto; font-size: 11px !important; color: #6B6456; }
          .books-tbl-row > div:nth-child(5),
          .books-tbl-row > div:nth-child(6) { flex: 0 0 auto; }
          .books-tbl-row > div:nth-child(7) { flex: 0 0 100%; margin-top: 6px; }
        }

        /* Members table: hide header, show rows as cards */
        @media (max-width: 640px) {
          .members-tbl-head { display: none !important; }
          .members-tbl-row {
            display: flex !important;
            flex-wrap: wrap;
            gap: 4px 10px;
            align-items: center;
          }
          .members-tbl-row > div:first-child { flex: 0 0 100%; }
          .members-tbl-row > div:nth-child(2),
          .members-tbl-row > div:nth-child(3),
          .members-tbl-row > div:nth-child(4) { flex: 0 0 auto; font-size: 11px !important; color: #6B6456; }
          .members-tbl-row > div:nth-child(5) { flex: 0 0 100%; margin-top: 6px; }
        }

        /* A-Z rail (Books tab): vertical column on desktop → sticky horizontal strip on mobile */
        @media (max-width: 640px) {
          .books-tbl-scroll-wrap { flex-direction: column !important; }
          .az-scroll-rail {
            position: sticky !important; top: 60px !important; left: auto !important; transform: none !important;
            flex-direction: row !important; overflow-x: auto; overflow-y: visible !important; max-height: none !important;
            width: 100%; -webkit-overflow-scrolling: touch;
          }
          .az-scroll-rail button { flex: 0 0 auto; }
          .books-tbl-container,
          .members-tbl-container { max-height: none !important; overflow: visible !important; }
        }

        /* Member detail: 280px sidebar + content → stacked */
        @media (max-width: 768px) {
          .member-detail-grid { grid-template-columns: 1fr !important; }
          .member-profile-sticky { position: static !important; }
        }

        /* Revenue table: horizontal scroll on small screens */
        .revenue-tbl-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .revenue-tbl-inner { min-width: 480px; }

        /* Renewals 3-col stats → 1-col on mobile */
        @media (max-width: 500px) {
          .renewals-stat-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
        }

        /* 2-col settings / customize grids → 1-col on mobile */
        @media (max-width: 560px) {
          .grid-2col { grid-template-columns: 1fr !important; }
        }

        /* Dashboard headings */
        @media (max-width: 480px) {
          .dash-wrap h1 { font-size: 18px !important; }
          .dash-wrap h2 { font-size: 14px !important; }
        }

        /* Member portal: renewal card flex direction */
        @media (max-width: 560px) {
          .renewal-card { flex-direction: column !important; }
        }

        /* Librarians table rows → card on mobile */
        @media (max-width: 640px) {
          .lib-row { flex-wrap: wrap !important; }
          .lib-row-actions { flex: 0 0 100% !important; margin-top: 6px; }
        }
      `}</style>
    </nav>
  );
};

const NavLink = ({ label, active, onClick, chevron }) => (
  <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 12px", color: active ? C.gold : "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 700, fontFamily: "inherit", borderRadius: 6, display: "flex", alignItems: "center", gap: 4, transition: "color .15s" }}
    onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
    onMouseLeave={e => { e.currentTarget.style.color = active ? C.gold : "rgba(255,255,255,.8)"; e.currentTarget.style.background = "none"; }}>
    {label}{chevron && <Icon name="chevronDown" size={13} color="rgba(255,255,255,.6)" />}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE  (3-tab: Member / Librarian / Admin)
// ─────────────────────────────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose, role = "member" }) => {
  const [fpEmail, setFpEmail]   = useState("");
  const [fpState, setFpState]   = useState("idle"); // idle | sending | sent | notfound

  const handleSend = async () => {
    setFpState("sending");
    try {
      const { data } = await supabase.from("users").select("id").eq("email_id", fpEmail.trim().toLowerCase());
      setFpState(data?.length > 0 ? "sent" : "notfound");
    } catch {
      setFpState("notfound");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: C.green, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.gold, fontSize: 16, fontWeight: 900 }}>Forgot Password?</div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginTop: 2 }}>We'll send your password to your registered email</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 8px" }}>
            <Icon name="x" size={16} color={C.white} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {fpState === "sent" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: C.greenLight + "33", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="check" size={28} color={C.greenMid} />
              </div>
              <h3 style={{ color: C.green, margin: "0 0 8px", fontSize: 16 }}>Email Sent!</h3>
              <p style={{ color: C.gray600, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                Your password has been sent to <strong>{fpEmail}</strong>. Please check your inbox.
              </p>
              <p style={{ color: C.gray300, fontSize: 11, margin: "0 0 20px", fontStyle: "italic" }}>
                Didn't receive it? Check your spam folder or contact the librarian.
              </p>
              <Btn variant="primary" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Back to Sign In</Btn>
            </div>
          ) : fpState === "notfound" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: C.redLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="alert" size={28} color={C.red} />
              </div>
              <h3 style={{ color: C.red, margin: "0 0 8px", fontSize: 16 }}>Email Not Found</h3>
              <p style={{ color: C.gray600, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                No account found for <strong>{fpEmail}</strong>. Please check the email address or register as a new member.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setFpState("idle")} style={{ flex: 1, justifyContent: "center" }}>Try Again</Btn>
                <Btn variant="primary" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Back to Sign In</Btn>
              </div>
            </div>
          ) : role === "member" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: C.blueLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="phone" size={28} color={C.blue} />
              </div>
              <h3 style={{ color: C.green, margin: "0 0 8px", fontSize: 16 }}>Contact Your Librarian</h3>
              <p style={{ color: C.gray600, fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>
                Passwords are set by the librarian. Please visit the library or call us to reset your password.
              </p>
              <p style={{ color: C.gray900, fontWeight: 700, fontSize: 15, margin: "0 0 20px" }}>
                +91 94454 11121
              </p>
              <Btn variant="primary" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Back to Sign In</Btn>
            </div>
          ) : (
            <>
              <p style={{ color: C.gray600, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                Enter the email address linked to your account and we'll send your password to it.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Email Address <span style={{ color: C.red }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="mail" size={15} color={C.gray300} /></span>
                  <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fpEmail.includes("@") && handleSend()}
                    placeholder="your@email.com"
                    style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e => e.target.style.borderColor = C.gray300} />
                </div>
              </div>
              <Btn onClick={handleSend} variant="primary" disabled={!fpEmail.includes("@") || fpState === "sending"}
                style={{ width: "100%", justifyContent: "center" }}>
                {fpState === "sending" ? "Sending…" : "Send Password"}
              </Btn>
              <button onClick={onClose} style={{ width: "100%", marginTop: 10, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.gray600, fontFamily: "inherit", padding: "6px" }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin, onRegister, initialTab = "member" }) => {
  const [tab, setTab] = useState(initialTab);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const role = tab === "librarian" ? "librarian" : tab === "admin" ? "admin" : "member";
      const isMember = role === "member";
      const queryField = isMember ? "membership_id" : "email_id";
      const queryValue = isMember ? identifier.trim().toUpperCase() : identifier.trim().toLowerCase();
      const { data: users, error: dbErr } = await supabase.from("users").select("*").eq(queryField, queryValue).eq("role", role);
      if (dbErr) throw dbErr;
      const found = users?.[0];
      if (!found) { setError(isMember ? "No account found with this Membership ID." : "No account found with this email address."); return; }
      if (!found.password) {
        if (!isMember || password !== DEFAULT_MEMBER_PASSWORD) {
          setError(isMember ? `Incorrect password. New members can sign in with the default password "${DEFAULT_MEMBER_PASSWORD}".` : "No password set. Contact the librarian.");
          return;
        }
      } else if (found.password !== password) {
        setError("Incorrect password.");
        return;
      }
      if (found.status !== "active") { setError("Your account is inactive. Contact admin."); return; }
      onLogin(dbToUser(found));
    } catch (err) {
      setError("Unable to connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "member",    label: "Member"    },
    { id: "librarian", label: "Librarian" },
    { id: "admin",     label: "Admin"     },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenMid} 60%, ${C.greenLight}44 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: C.green, padding: "28px 32px", textAlign: "center" }}>
          <img src={logo} alt="Arivagam Logo" style={{ width: 80, height: 80, objectFit: "contain", margin: "0 auto 12px", display: "block", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }} />
          <div style={{ color: C.gold, fontSize: 20, fontWeight: 900 }}>Prakrith Arivagam</div>
          <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13, marginTop: 2 }}>Library Management System</div>
        </div>

        {/* Role tabs */}
        <div style={{ display: "flex", borderBottom: `2px solid ${C.gray100}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); setIdentifier(""); setPassword(""); }}
              style={{ flex: 1, padding: "14px 8px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", color: tab === t.id ? C.green : C.gray600, borderBottom: tab === t.id ? `2px solid ${C.green}` : "2px solid transparent", marginBottom: -2, transition: "color .15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: "24px 32px 28px" }}>
          {tab === "member"
            ? <Input label="Membership ID" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="e.g. S1230101" icon="tag" required hint="Your membership card ID (e.g. S1230101)" />
            : <Input label="Email" type="email" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={`${tab}@example.com`} icon="mail" required />
          }

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5 }}>Password <span style={{ color: C.red }}>*</span></label>
              <button onClick={() => setShowForgot(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.green, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>
                Forgot password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon name="lock" size={15} color={C.gray300} /></span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e => e.target.style.borderColor = C.gray300} />
            </div>
            {tab === "member" && (
              <p style={{ fontSize: 11, color: C.gray600, margin: "4px 0 0" }}>
                First time signing in? Use the default password <strong>{DEFAULT_MEMBER_PASSWORD}</strong>.
              </p>
            )}
          </div>

          {error && <div style={{ background: C.redLight, color: C.red, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}

          <Btn onClick={handleLogin} variant="primary" size="lg" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Signing in…" : `Sign In as ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
          </Btn>

          {tab === "member" && (
            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.gray600 }}>
              No account?{" "}
              <button onClick={onRegister} style={{ background: "none", border: "none", color: C.green, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                Register Free →
              </button>
            </p>
          )}
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} role={tab} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION PAGE
// ─────────────────────────────────────────────────────────────────────────────
const RegisterPage = ({ onRegisterSuccess, onBack, settings }) => {
  const plans = settings.plans || DEFAULT_PLANS;
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", password: "", confirm: "" });
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.includes("@")) e.email = "Enter a valid email.";
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit phone number.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    try {
      const { data, error } = await supabase.from("users").insert({
        child_member_name: form.name.trim(),
        email_id: form.email.trim().toLowerCase(),
        phone_number: form.phone.trim(),
        address: form.address.trim(),
        password: form.password,
        role: "member",
        status: "pending",
        membership_plan: selectedPlanId,
        membership_type: selectedPlan?.inhouseOnly ? "inhouse" : "monthly",
        fees_due: 0,
      }).select().single();
      if (error) throw error;
      onRegisterSuccess(dbToUser(data));
    } catch {
      // Fallback to in-memory
      onRegisterSuccess({
        id: "PENDING_" + Date.now(), membershipId: "",
        name: form.name.trim(), email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(), password: form.password,
        plan: selectedPlanId,
        membershipType: selectedPlan?.inhouseOnly ? "inhouse" : "monthly",
        status: "pending", joined: today(), fees: 0,
      });
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: C.white, borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,.25)" }}>
          <div style={{ width: 64, height: 64, background: "#D5F5E3", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon name="check" size={32} color="#27AE60" />
          </div>
          <h2 style={{ color: C.green, margin: "0 0 10px" }}>Registration Submitted!</h2>
          <p style={{ color: C.gray600, margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }}>
            Your request has been sent to the librarian for approval. Once activated, you'll receive your Membership ID and can start borrowing books.
          </p>
          <Btn onClick={onBack} variant="primary" style={{ margin: "0 auto", display: "block" }}>Go to Sign In</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ background: C.green, padding: "22px 28px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8, color: C.white, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
            ← Back
          </button>
          <div>
            <div style={{ color: C.gold, fontWeight: 900, fontSize: 16 }}>Register for Free</div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>Membership requires librarian approval</div>
          </div>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Your full name" icon="user" required error={errors.name} />
          <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" icon="mail" required error={errors.email} />
          <Input label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="10-digit mobile number" icon="phone" error={errors.phone} hint="Optional but helps librarian reach you" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>Address</label>
            <textarea value={form.address} onChange={set("address")} placeholder="Door No, Street, City, State — Pincode" rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e => e.target.style.borderColor = C.gray300} />
            <div style={{ fontSize: 11, color: C.gray600, marginTop: 3 }}>Optional — helps the librarian locate you</div>
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>
              Membership Plan <span style={{ color: C.red }}>*</span>
            </label>
            <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: C.white, color: C.gray900 }}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e => e.target.style.borderColor = C.gray300}>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.inhouseOnly
                    ? `${p.name} — Walk-in reading · No monthly fee`
                    : `${p.name} — Borrow up to ${p.borrowLimit} book${p.borrowLimit !== 1 ? "s" : ""} · ₹${p.cost}/month`}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <div style={{ background: selectedPlan.inhouseOnly ? C.green + "10" : C.blueLight, border: `1px solid ${selectedPlan.inhouseOnly ? C.green + "40" : C.blue + "40"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.gray900, marginBottom: 14, lineHeight: 1.6 }}>
              {selectedPlan.inhouseOnly ? (
                <>
                  <span style={{ fontWeight: 700, color: C.green }}>Inhouse Reading</span>
                  {" · "} One-time registration fee only · Walk in anytime to read in the library · Books cannot be borrowed or taken home
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 700, color: C.blue }}>{selectedPlan.name}</span>
                  {" · "} Borrow up to <strong>{selectedPlan.borrowLimit}</strong> book{selectedPlan.borrowLimit !== 1 ? "s" : ""} at a time
                  {" · "} ₹<strong>{selectedPlan.cost}</strong>/month
                  {selectedPlan.refundableDeposit > 0 && <> · Refundable deposit ₹<strong>{selectedPlan.refundableDeposit}</strong></>}
                </>
              )}
            </div>
          )}

          <div style={{ height: 1, background: C.gray100, margin: "4px 0 16px" }} />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" icon="lock" required error={errors.password} />
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" icon="lock" required error={errors.confirm} />

          <div style={{ background: C.goldLight, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 18 }}>
            <Icon name="info" size={13} color={C.goldDark} /> Membership is activated by a librarian. You can browse books after registration, but borrowing requires an active membership.
          </div>

          <Btn onClick={handleSubmit} variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
            Submit Registration →
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
const HomeSection = ({ label, enabled, children }) => {
  if (!enabled) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 10px 6px", fontSize: 18, fontWeight: 800, color: C.green }}>{label}</h2>
      <section style={{ background: "#A5D6A7", borderRadius: 16, padding: "20px 24px" }}>
        {children}
      </section>
    </div>
  );
};

const HomePage = ({ settings, books, bookCopies, onBook, onNavigate, user, waitlist, requests, onBorrow, onWaitlist }) => {
  const s = settings.sections;

  // Filter books for a section: genre match first, then smart fallbacks
  const bySection = (key, label) => {
    const genreMatch = books.filter(b => b.genre?.toLowerCase() === label?.toLowerCase());
    if (genreMatch.length > 0) return genreMatch;
    // Fallback when label doesn't match any genre
    const withCovers = books.filter(b => b.cover);
    const pool = withCovers.length > 0 ? withCovers : books;
    switch (key) {
      case "newArrivals": return [...pool].sort((a, b) => (b.year || 0) - (a.year || 0));
      case "classics":    { const old = pool.filter(b => (b.year || 9999) < 2000); return old.length > 0 ? old : pool; }
      case "trending":    return pool.filter((_, i) => i % 2 === 0); // every other book
      case "weLove":      return pool.filter((_, i) => i % 3 !== 0); // skip every 3rd
      default:            return pool;
    }
  };

  return (
    <div style={{ background: C.gray50, minHeight: "100vh" }}>

      {/* ── Hero: Option B (locked) ── */}
      <div className="home-hero" style={{ background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenMid} 70%)`, color: C.white, padding: "36px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          {/* Left: logo + name + tagline */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flex: 1, minWidth: 260 }}>
            <img src={logo} alt="Arivagam Logo" style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))", marginTop: 2 }} />
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, lineHeight: 1.15 }}>{settings.library.name}</h1>
              <p style={{ margin: "0 0 12px", fontSize: 13, opacity: .8, lineHeight: 1.6, maxWidth: 380 }}>{settings.library.tagline}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.gold + "22", border: `1px solid ${C.gold}55`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: .5 }}>
                <Icon name="home" size={11} color={C.gold} />Chennai — Perungalathur Branch
              </div>
            </div>
          </div>
          {/* Right: stats */}
          <div className="hero-stats">
            {[
              { value: books.length,                               label: "Books"         },
              { value: books.filter(b => b.available > 0).length, label: "Available Now" },
              { value: GENRES.length,                              label: "Genres"        },
              { value: "Free",                                     label: "To Join"       },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center", background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 22px", minWidth: 80 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, opacity: .8, marginTop: 4, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Sections */}
      <div className="home-sections" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        <HomeSection label={s.trending?.label} enabled={s.trending?.enabled}><BookRow books={bySection("trending", s.trending?.label)} onBook={onBook} bookCopies={bookCopies} user={user} waitlist={waitlist} requests={requests} onBorrow={onBorrow} onWaitlist={onWaitlist} /></HomeSection>
        <HomeSection label={s.classics?.label} enabled={s.classics?.enabled}><BookRow books={bySection("classics", s.classics?.label)} onBook={onBook} bookCopies={bookCopies} user={user} waitlist={waitlist} requests={requests} onBorrow={onBorrow} onWaitlist={onWaitlist} /></HomeSection>
        <HomeSection label={s.weLove?.label} enabled={s.weLove?.enabled}><BookRow books={bySection("weLove", s.weLove?.label)} onBook={onBook} bookCopies={bookCopies} user={user} waitlist={waitlist} requests={requests} onBorrow={onBorrow} onWaitlist={onWaitlist} /></HomeSection>
        <HomeSection label={s.newArrivals?.label} enabled={s.newArrivals?.enabled}><BookRow books={bySection("newArrivals", s.newArrivals?.label)} onBook={onBook} bookCopies={bookCopies} user={user} waitlist={waitlist} requests={requests} onBorrow={onBorrow} onWaitlist={onWaitlist} /></HomeSection>
        <HomeSection label={s.byGenre?.label} enabled={s.byGenre?.enabled}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {GENRES.slice(0, 14).map(g => (
              <button key={g} onClick={() => onNavigate("catalog", { genre: g })}
                style={{ padding: "8px 18px", borderRadius: 20, border: `1.5px solid ${C.greenLight}`, background: "transparent", color: C.greenMid, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => { e.target.style.background = C.green; e.target.style.color = C.white; e.target.style.borderColor = C.green; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.greenMid; e.target.style.borderColor = C.greenLight; }}>
                {g}
              </button>
            ))}
          </div>
        </HomeSection>
      </div>

      {/* Footer */}
      <footer style={{ background: C.green, color: C.white, marginTop: 48, padding: "36px 24px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32 }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <h3 style={{ color: C.gold, margin: "0 0 12px", fontSize: 16 }}>{settings.library.name}</h3>
            <p style={{ margin: "0 0 6px", fontSize: 13, opacity: .75 }}>{settings.library.address}</p>
            <p style={{ margin: "0 0 4px", fontSize: 13, opacity: .75 }}>{settings.library.phone}</p>
            <p style={{ margin: 0, fontSize: 13, opacity: .75 }}>{settings.library.email}</p>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <h4 style={{ color: C.goldLight, margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: .5 }}>Explore</h4>
            {["Catalog", "Genres", "Authors", "New Arrivals"].map(l => <div key={l} style={{ fontSize: 13, opacity: .7, marginBottom: 6, cursor: "pointer" }}>{l}</div>)}
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <h4 style={{ color: C.goldLight, margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: .5 }}>Library</h4>
            {["About Us", "Membership", "Contact"].map(l => <div key={l} style={{ fontSize: 13, opacity: .7, marginBottom: 6, cursor: "pointer" }}>{l}</div>)}
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "20px auto 0", borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 16, fontSize: 12, opacity: .5, textAlign: "center" }}>
          © 2025 Prakrith Arivagam · Chennai, India · All rights reserved
        </div>
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG PAGE
// ─────────────────────────────────────────────────────────────────────────────
const CatalogPage = ({ books, onBook, initialQuery = "", initialGenre = "" }) => {
  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState(initialGenre || "All");
  const [lang, setLang] = useState("All");
  const [avail, setAvail] = useState(false);
  const [sort, setSort] = useState("title");

  const langs = ["All", ...new Set(books.map(b => b.language))];
  let filtered = books.filter(b => {
    const q = query.toLowerCase();
    return (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q))
      && (genre === "All" || b.genre === genre)
      && (lang === "All" || b.language === lang)
      && (!avail || b.available > 0);
  });
  filtered = [...filtered].sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "author" ? a.author.localeCompare(b.author) : b.year - a.year);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ color: C.green, fontSize: 24, fontWeight: 800, margin: "0 0 20px" }}>Book Catalog</h1>
      {/* Filters */}
      <div className="catalog-filters" style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ flex: 2, minWidth: 200, position: "relative" }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, author, genre…"
            style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.gray300} />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={15} color={C.gray300} /></span>
        </div>
        <select value={genre} onChange={e => setGenre(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", minWidth: 140 }}>
          {["All", ...GENRES].map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", minWidth: 120 }}>
          {langs.map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit" }}>
          <option value="title">Sort: Title A–Z</option>
          <option value="author">Sort: Author</option>
          <option value="year">Sort: Newest</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: C.green, fontWeight: 600, whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={avail} onChange={e => setAvail(e.target.checked)} /> Available only
        </label>
        <span style={{ fontSize: 12, color: C.gray600, whiteSpace: "nowrap" }}>{filtered.length} book{filtered.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 18 }}>
        {filtered.map(b => <BookCard key={b.id} book={b} onClick={onBook} />)}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: C.gray600 }}>
          <Icon name="book" size={40} color={C.gray300} />
          <p style={{ marginTop: 16 }}>No books match your search.</p>
          <Btn variant="outline" onClick={() => { setQuery(""); setGenre("All"); setLang("All"); setAvail(false); }}>Clear filters</Btn>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOK DETAIL MODAL  (with full borrow flow)
// ─────────────────────────────────────────────────────────────────────────────
const BookDetailModal = ({ book, onClose, user, onRequest, onWaitlist, transactions, requests, waitlist }) => {
  if (!book) return null;
  const alreadyBorrowed = transactions.some(t => t.memberId === user?.id && t.bookId === book.id && !t.returnDate);
  const pendingRequest  = requests?.some(r => r.memberId === user?.id && r.bookId === book.id && r.status === "pending");
  const myWaitlist      = waitlist?.find(w => w.bookId === book.id && w.memberId === user?.id && (w.status === "waiting" || w.status === "reserved"));
  const wlCount         = waitlist?.filter(w => w.bookId === book.id && w.status === "waiting").length || 0;
  const memberActive    = user?.status === "active";
  const canRequest      = user?.role === "member" && memberActive && book.available > 0 && !alreadyBorrowed && !pendingRequest;
  const canWaitlist     = user?.role === "member" && memberActive && book.available === 0 && !alreadyBorrowed && !myWaitlist;

  return (
    <Modal open={!!book} onClose={onClose} title="Book Details" width={560}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <img src={book.cover} alt={book.title} style={{ width: 110, height: 162, objectFit: "cover", borderRadius: 10, flexShrink: 0, background: C.gray100, border: `1px solid ${C.gray100}` }} onError={e => e.target.style.display = "none"} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: "0 0 6px", color: C.green, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{book.title}</h2>
          <p style={{ margin: "0 0 10px", color: C.gray600, fontSize: 14 }}>by <strong style={{ color: C.gray900 }}>{book.author}</strong></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <Badge label={book.genre} color={C.green} />
            <Badge label={book.language} color={C.greenMid} />
            <Badge label={book.year > 0 ? book.year : "Ancient"} color={C.gray600} />
          </div>
          <div style={{ fontSize: 13, color: C.gray600, marginBottom: 3 }}>ISBN: <span style={{ fontFamily: "monospace" }}>{book.isbn}</span></div>
          <div style={{ fontSize: 13, color: C.gray600, marginBottom: 3 }}>Total Copies: {book.copies}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: book.available > 0 ? C.greenMid : C.red, marginBottom: wlCount > 0 ? 6 : 14 }}>
            {book.available > 0 ? `✓ ${book.available} cop${book.available > 1 ? "ies" : "y"} available` : "✗ All copies currently borrowed"}
          </div>
          {wlCount > 0 && <div style={{ fontSize: 12, color: C.orange, marginBottom: 12 }}>{wlCount} person{wlCount > 1 ? "s" : ""} in waitlist</div>}
          {alreadyBorrowed && <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.blue, fontWeight: 600, marginBottom: 10 }}>You currently have this book issued to you.</div>}
          {pendingRequest && <div style={{ background: C.goldLight, border: `1px solid ${C.goldDark}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 10 }}>Your request is pending — the librarian will issue it to you shortly.</div>}
          {myWaitlist?.status === "reserved" && <div style={{ background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 10 }}>📚 Your copy is reserved! Collect by <strong>{myWaitlist.graceDeadline}</strong>.</div>}
          {myWaitlist?.status === "waiting" && <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.blue, fontWeight: 600, marginBottom: 10 }}>You are #{myWaitlist.position} in the waitlist. We'll notify you when your copy is ready.</div>}
          {user?.role === "member" && !memberActive && <div style={{ background: C.goldLight, border: `1px solid ${C.goldDark}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 10 }}>Membership pending approval — you can request books once activated.</div>}
        </div>
      </div>
      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {canRequest && (
          <Btn onClick={() => { onRequest(book); onClose(); }} variant="primary" icon="book">Request to Borrow</Btn>
        )}
        {canWaitlist && (
          <Btn onClick={() => { onWaitlist(book); onClose(); }} variant="secondary" icon="book">
            Join Waitlist {wlCount > 0 ? `(#${wlCount + 1})` : ""}
          </Btn>
        )}
        {!user && <Btn onClick={onClose} variant="secondary">Sign In to Request</Btn>}
        <Btn onClick={onClose} variant="ghost">Close</Btn>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const MemberDashboard = ({ user, books, transactions, requests, waitlist, settings, onNavigate, onRequestRenewal }) => {
  const myActive    = transactions.filter(t => t.memberId === user.id && !t.returnDate);
  const myHistory   = transactions.filter(t => t.memberId === user.id && t.returnDate);
  const myRequests  = (requests || []).filter(r => r.memberId === user.id);
  const myWaitlist  = (waitlist || []).filter(w => w.memberId === user.id && (w.status === "waiting" || w.status === "reserved" || w.status === "expired"));
  const lateFees    = myActive.reduce((sum, t) => sum + calcLateFee(t.dueDate, settings.fees.lateFeePerDay), 0);
  const [tab, setTab] = useState("current");
  const [renewalRequesting, setRenewalRequesting] = useState(false);
  // Fresh fetch of library UPI directly from DB — bypasses any settings propagation/merge issues
  const [libraryUpi, setLibraryUpi] = useState(settings.library?.upiId || "");
  useEffect(() => {
    supabase.from("fee_settings").select("settings_json").limit(1).maybeSingle().then(({ data }) => {
      if (data?.settings_json) {
        try {
          const s = JSON.parse(data.settings_json);
          if (s.library?.upiId) setLibraryUpi(s.library.upiId);
        } catch {}
      }
    });
  }, []);

  // ── Renewal banner logic ──
  const memberPlan = user.plan ? (settings.plans || DEFAULT_PLANS).find(p => p.id === user.plan) : null;
  const getMemberRenewalDue = () => {
    const base = user.planRenewedAt || user.joined;
    if (!base || !user.plan) return null;
    const d = new Date(base);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  };
  const renewalDue = getMemberRenewalDue();
  const renewalDiff = renewalDue ? Math.ceil((new Date(renewalDue) - new Date(today())) / 86400000) : null;
  const showRenewalBanner = renewalDiff !== null && renewalDiff <= (settings.library?.renewalReminderDays || 5);
  // Include overdue membership fee in outstanding amount
  const membershipOverdueFee = (renewalDiff !== null && renewalDiff < 0 && memberPlan) ? memberPlan.cost : 0;
  const totalFees = lateFees + (user.fees || 0) + membershipOverdueFee;
  const makeUpiLink = () => {
    if (!libraryUpi || !memberPlan || !renewalDue) return null;
    const d = new Date(renewalDue);
    const monthLabel = d.toLocaleString("en-IN", { month: "short" }) + "-" + String(d.getFullYear()).slice(2);
    const note = encodeURIComponent(`${user.membershipId || user.id}-${monthLabel}`);
    return `upi://pay?pa=${encodeURIComponent(libraryUpi)}&am=${memberPlan.cost}&tn=${note}&cu=INR`;
  };
  const upiLink = makeUpiLink();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
      {/* Profile header */}
      <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, borderRadius: 16, padding: "24px 28px", color: C.white, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 56, height: 56, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="user" size={28} color={C.green} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{user.name}</h2>
            <p style={{ margin: "4px 0 0", opacity: .8, fontSize: 13 }}>
              {user.status === "active" ? `Member ID: ${user.membershipId || user.id}` : "Membership Pending"}
            </p>
            {memberPlan && (
              <p style={{ margin: "4px 0 0", fontSize: 13, opacity: .9, fontWeight: 600 }}>
                {memberPlan.name}
                {user.membershipType && ` · ${user.membershipType.charAt(0).toUpperCase() + user.membershipType.slice(1)}`}
                {` · Up to ${memberPlan.borrowLimit} book${memberPlan.borrowLimit !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <Badge label={user.status === "active" ? "Active Member" : "Pending Approval"} color={user.status === "active" ? C.gold : C.orange} size="lg" />
        </div>
      </div>

      {/* ── Renewal Banner ── */}
      {user.status === "active" && showRenewalBanner && (() => {
        const accentColor = renewalDiff < 0 ? C.red : "#E67E22";
        // QR encodes the UPI deep-link so any UPI app can open it by scanning
        const qrContent = upiLink || null;
        const qrSrc = qrContent
          ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrContent)}&margin=6&color=1B4332`
          : null;
        return (
          <div className="renewal-card" style={{ background: renewalDiff < 0 ? "#FFF5F5" : "#FFFBEA", border: `2px solid ${accentColor}`, borderRadius: 14, padding: "18px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", boxShadow: `0 2px 16px ${accentColor}22` }}>
            {/* Left: info + actions */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{renewalDiff < 0 ? "⚠️" : "🔔"}</span>
                <div style={{ fontWeight: 800, fontSize: 15, color: accentColor }}>
                  {renewalDiff < 0
                    ? `Membership Overdue by ${Math.abs(renewalDiff)} day${Math.abs(renewalDiff) !== 1 ? "s" : ""}!`
                    : renewalDiff === 0 ? "Membership Due Today!" : `Membership Due in ${renewalDiff} Day${renewalDiff !== 1 ? "s" : ""}`}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.gray600, marginBottom: 4 }}>
                <strong>{memberPlan?.name}</strong> · ₹{memberPlan?.cost}/month · Due: <strong>{renewalDue}</strong>
              </div>
              {!qrSrc && (
                <div style={{ fontSize: 12, color: C.gray600, marginTop: 4, fontStyle: "italic" }}>
                  Contact librarian to pay · {settings.library?.phone || ""}
                </div>
              )}
              {user.renewalRequestedAt && (
                <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, marginTop: 6 }}>✓ Payment notification sent to librarian</div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {upiLink && (
                  <a href={upiLink} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.green, color: C.white, borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    Pay ₹{memberPlan?.cost} via UPI
                  </a>
                )}
                {!user.renewalRequestedAt && (
                  <button
                    disabled={renewalRequesting}
                    onClick={async () => { setRenewalRequesting(true); await onRequestRenewal(user.id); setRenewalRequesting(false); }}
                    style={{ padding: "9px 16px", background: C.white, border: `2px solid ${C.green}`, color: C.green, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    {renewalRequesting ? "Sending…" : "If Paid, Notify Librarian"}
                  </button>
                )}
              </div>
            </div>

            {/* Right: QR — only shows when Library UPI is configured in Fee Settings */}
            {qrSrc ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ background: C.white, border: `2px solid ${accentColor}`, borderRadius: 12, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
                  <img src={qrSrc} alt="UPI QR Code" width={140} height={140} style={{ display: "block", borderRadius: 6 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textAlign: "center" }}>Scan &amp; Pay</div>
                <div style={{ fontSize: 11, color: C.gray600, textAlign: "center" }}>Opens UPI app · ₹{memberPlan?.cost} pre-filled</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, width: 140, background: C.gray50, border: `1.5px dashed ${C.gray300}`, borderRadius: 12, padding: "20px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>📵</div>
                <div style={{ fontSize: 11, color: C.gray600, lineHeight: 1.4 }}>QR not available.<br />Ask librarian to set Library UPI in Fee Settings.</div>
              </div>
            )}
          </div>
        );
      })()}

      {user.status === "pending" ? (
        <div style={{ background: C.goldLight, border: `1px solid ${C.goldDark}`, borderRadius: 12, padding: "28px", textAlign: "center" }}>
          <Icon name="alert" size={36} color={C.goldDark} />
          <h3 style={{ color: C.green, margin: "12px 0 8px" }}>Membership Pending Approval</h3>
          <p style={{ color: C.gray600, margin: "0 0 16px", lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
            A librarian will review and activate your membership. Once approved, you'll receive a Membership ID and can start borrowing books.
          </p>
          <Btn onClick={() => onNavigate("catalog")} variant="primary">Browse Books While You Wait</Btn>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard label="Total Borrowed" value={myActive.length + myHistory.length} icon="book" color={C.green} onClick={() => setTab("history")} />
            <StatCard label="Currently Reading" value={myActive.length} icon="eye" color={C.greenMid} onClick={() => setTab("current")} />
            <StatCard label="Returned" value={myHistory.length} icon="check" color={C.blue} onClick={() => setTab("history")} />
            <StatCard label="Outstanding Fees" value={`₹${totalFees}`} icon="money" color={totalFees > 0 ? C.red : C.greenMid} onClick={() => setTab("current")} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `2px solid ${C.gray100}`, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { id: "current",   label: `Currently Borrowed${myActive.length > 0 ? ` (${myActive.length})` : ""}` },
              { id: "waitlist",  label: `Waitlist${myWaitlist.length > 0 ? ` (${myWaitlist.length})` : ""}` },
              { id: "requests",  label: `My Requests${myRequests.length > 0 ? ` (${myRequests.length})` : ""}` },
              { id: "history",   label: `History${myHistory.length > 0 ? ` (${myHistory.length})` : ""}` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", color: tab === t.id ? C.green : C.gray600, borderBottom: tab === t.id ? `2px solid ${C.green}` : "2px solid transparent", marginBottom: -2, whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "current" && (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              {myActive.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: C.gray600 }}>
                  <Icon name="book" size={36} color={C.gray300} />
                  <p style={{ marginTop: 12 }}>No books currently borrowed.</p>
                  <Btn variant="outline" onClick={() => onNavigate("catalog")}>Browse Catalog</Btn>
                </div>
              ) : myActive.map((txn, i) => {
                const b = books.find(bk => bk.id === txn.bookId);
                const late = calcLateFee(txn.dueDate, settings.fees.lateFeePerDay);
                const overdue = isOverdue(txn.dueDate);
                return (
                  <div key={txn.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 20px", borderBottom: i < myActive.length - 1 ? `1px solid ${C.gray100}` : "none", flexWrap: "wrap", background: overdue ? C.redLight + "66" : "transparent" }}>
                    {b && <img src={b.cover} alt={b.title} style={{ width: 44, height: 62, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: C.gray100 }} onError={e => e.target.style.display = "none"} />}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{txn.bookTitle}</div>
                      <div style={{ color: C.gray600, fontSize: 12, marginTop: 2 }}>Borrowed: {txn.borrowDate}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <Icon name="calendar" size={12} color={overdue ? C.red : C.gray600} />
                        <span style={{ fontSize: 12, color: overdue ? C.red : C.gray600, fontWeight: overdue ? 700 : 400 }}>
                          Due: {txn.dueDate} {overdue && "— OVERDUE"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      {late > 0 && <Badge label={`Late Fee: ₹${late}`} color={C.red} />}
                      <div style={{ fontSize: 11, color: C.gray600, fontStyle: "italic" }}>Return in person at the library</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "waitlist" && (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              {myWaitlist.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: C.gray600 }}>
                  <Icon name="book" size={36} color={C.gray300} />
                  <p style={{ marginTop: 12 }}>You are not on any waitlist. When all copies of a book are borrowed, you can join its waitlist.</p>
                  <Btn variant="outline" onClick={() => onNavigate("catalog")}>Browse Catalog</Btn>
                </div>
              ) : myWaitlist.map((w, i, arr) => {
                const statusColor = w.status === "reserved" ? C.gold : w.status === "expired" ? C.red : C.orange;
                const statusLabel = w.status === "reserved" ? `Reserved — collect by ${w.graceDeadline}` : w.status === "expired" ? "Reservation expired" : `Waiting — Position #${w.position}`;
                return (
                  <div key={w.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.gray100}` : "none", flexWrap: "wrap", background: w.status === "reserved" ? C.goldLight + "44" : "transparent" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{w.bookTitle}</div>
                      <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Joined: {w.joinedAt}</div>
                    </div>
                    <Badge label={statusLabel} color={statusColor} />
                    {w.status === "reserved" && (
                      <div style={{ width: "100%", background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.green, fontWeight: 600 }}>
                        📚 Your copy is ready! Visit the library and collect it by <strong>{w.graceDeadline}</strong>. If not collected, reservation will be cancelled.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "requests" && (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              {(requests?.filter(r => r.memberId === user.id) || []).length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: C.gray600 }}>
                  <Icon name="book" size={36} color={C.gray300} />
                  <p style={{ marginTop: 12 }}>No book requests yet. Browse the catalog to request a book.</p>
                  <Btn variant="outline" onClick={() => onNavigate("catalog")}>Browse Catalog</Btn>
                </div>
              ) : (requests?.filter(r => r.memberId === user.id) || []).map((req, i, arr) => (
                <div key={req.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.gray100}` : "none", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{req.bookTitle}</div>
                    <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Requested on: {req.requestDate}</div>
                  </div>
                  <Badge
                    label={req.status === "pending" ? "Pending Approval" : req.status === "approved" ? "Approved — Collect at Library" : "Rejected"}
                    color={req.status === "pending" ? C.orange : req.status === "approved" ? C.greenMid : C.red}
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "history" && (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              {myHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: C.gray600 }}>No borrowing history yet.</div>
              ) : myHistory.map((txn, i) => (
                <div key={txn.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 20px", borderBottom: i < myHistory.length - 1 ? `1px solid ${C.gray100}` : "none", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{txn.bookTitle}</div>
                    <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>{txn.borrowDate} → Returned: {txn.returnDate}</div>
                  </div>
                  {txn.lateFee > 0 && <Badge label={`Late Fee: ₹${txn.lateFee}`} color={C.orange} />}
                  <Badge label="Returned" color={C.greenMid} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV IMPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const CSV_DB_FIELDS = [
  { value: "", label: "— Skip —" },
  { value: "membership_id", label: "Member ID" },
  { value: "child_member_name", label: "Child/Member Name" },
  { value: "parent_guardian_name", label: "Parent/Guardian Name" },
  { value: "phone_number", label: "Phone Number" },
  { value: "email_id", label: "Email ID" },
  { value: "address", label: "Address" },
  { value: "joined_at", label: "Date of Enrollment" },
  { value: "membership_type", label: "Membership Plan/Type" },
  { value: "branch_id", label: "Branch" },
  { value: "payment_method", label: "Payment Method" },
  { value: "upi_id", label: "UPI ID" },
  { value: "comments", label: "Comments/Notes" },
];

const AUTO_CSV_MAP = {
  "member id": "membership_id", "membership id": "membership_id",
  "membership no": "membership_id", "member no": "membership_id",
  "child (member) name": "child_member_name", "child name": "child_member_name",
  "member name": "child_member_name", "name": "child_member_name", "full name": "child_member_name",
  "parent's/guardian's name": "parent_guardian_name", "parent's / guardian's name": "parent_guardian_name",
  "parent/guardian name": "parent_guardian_name", "guardian name": "parent_guardian_name",
  "parent name": "parent_guardian_name", "guardian": "parent_guardian_name",
  "phone number": "phone_number", "phone": "phone_number", "mobile": "phone_number", "mobile number": "phone_number",
  "email id": "email_id", "email": "email_id", "email address": "email_id", "e-mail": "email_id",
  "address": "address",
  "date of enrollment": "joined_at", "date of enrolment": "joined_at",
  "enrollment date": "joined_at", "join date": "joined_at", "joined": "joined_at",
  "membership plan": "membership_type", "plan": "membership_type",
  "membership type": "membership_type", "membership plan type": "membership_type",
  "membership": "membership_type", "member type": "membership_type",
  "member plan": "membership_type",
  "branch": "branch_id", "branch id": "branch_id", "branch name": "branch_id",
  "branch code": "branch_id", "location": "branch_id",
  "payment method": "payment_method", "mode of payment": "payment_method",
  "payment mode": "payment_method", "payment": "payment_method",
  "upi id": "upi_id", "upi": "upi_id",
  "comments": "comments", "notes": "comments", "remarks": "comments",
};

export const normalizeMembershipType = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  const normalized = raw.replace(/[^a-z]+/g, " ").trim();
  if (["annual", "monthly", "inhouse"].includes(normalized)) return normalized;
  const inhousePattern = /^(inhouse|in house|in house reading|inhouse reading|inlibrary|in library|in library reading|walk in|walk in reading|reading only|reading)$/;
  const monthlyPattern = /^(monthly|month|monthly plan|monthly fee|membership)$/;
  const annualPattern = /^(annual|yearly|annual plan|annual fee|yearly fee|year)$/;
  if (inhousePattern.test(normalized)) return "inhouse";
  if (monthlyPattern.test(normalized)) return "monthly";
  if (annualPattern.test(normalized)) return "annual";
  return "annual";
};

const normalizeBranchValue = (value, branches = []) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const exactMatch = branches.find(b => String(b.id || "").trim().toLowerCase() === raw.toLowerCase());
  if (exactMatch) return String(exactMatch.id);
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const nameMatch = branches.find(b => {
    const name = String(b.name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
    return name === normalized || name.includes(normalized) || normalized.includes(name);
  });
  return nameMatch ? String(nameMatch.id) : null;
};

export const normalizeImportValue = (dbCol, value, branches = []) => {
  if (dbCol === "membership_type") return normalizeMembershipType(value);
  if (dbCol === "branch_id" || dbCol === "branch") return normalizeBranchValue(value, branches);
  if (dbCol === "joined_at") {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d) ? raw : d.toISOString().split("T")[0];
  }
  const cleaned = String(value || "").trim();
  return cleaned || null;
};

const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  const parseRow = (line) => {
    const cells = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    cells.push(cur.trim());
    return cells;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const cells = parseRow(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] !== undefined ? cells[i].trim() : ""; });
    return obj;
  });
  return { headers, rows };
};

const autoMapCSVHeaders = (headers) => {
  const m = {};
  headers.forEach(h => {
    const key = h.toLowerCase().trim().replace(/\s+/g, " ");
    if (AUTO_CSV_MAP[key]) m[h] = AUTO_CSV_MAP[key];
  });
  return m;
};

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARIAN / ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const LibrarianDashboard = ({ books, setBooks, members, setMembers, librarians, setLibrarians, settings, onSettings, transactions, setTransactions, requests, setRequests, bookCopies, setBookCopies, waitlist, setWaitlist, payments, memberStatuses, setMemberStatuses, isAdmin, branches, setBranches }) => {
  const [tab, setTab] = useState("books");
  const [bookSearch, setBookSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentsSubTab, setPaymentsSubTab] = useState("received"); // "received" | "history"
  const [paymentMonthFilter, setPaymentMonthFilter] = useState("");
  const [renewalFilter, setRenewalFilter] = useState(null); // null | "overdue" | "pending"
  const [memberFilter, setMemberFilter] = useState(null); // null | "pending"
  const [memberStatusTab, setMemberStatusTab] = useState("active"); // "active" | "paused" | "closed" | "inlibrary"
  const [showBookForm, setShowBookForm] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [expandedBookId, setExpandedBookId] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showLibForm, setShowLibForm] = useState(false);
  const [editLib, setEditLib] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  // `settings` loads asynchronously from Supabase after this component mounts, so the initial
  // useState snapshot above is often stale — keep localSettings in sync or saving settings later
  // (e.g. Fee Settings) would revert plans/fees back to whatever was present at mount time.
  useEffect(() => { setLocalSettings(settings); }, [settings]);
  const [toast, setToast] = useState(null);
  const [returnConfirm, setReturnConfirm] = useState(null);
  const [activateModal, setActivateModal] = useState(null); // { member }
  const [activatePlanId, setActivatePlanId] = useState("");
  const [renewModal, setRenewModal] = useState(null); // { member, plan }
  const [renewExtras, setRenewExtras] = useState({ lateFee: false, lostBook: false, lostBookQty: 1, damagedBook: false, damagedBookQty: 1, cautionDeposit: false });
  const [collectMode, setCollectMode] = useState("total"); // "total" | "partial" — how last_paid_month gets set on renew
  const [manualPaidMonth, setManualPaidMonth] = useState(""); // "YYYY-MM", used when collectMode === "partial"
  const [penaltyModal, setPenaltyModal] = useState(null); // { txn, member, lateAmt }
  const [penaltyExtras, setPenaltyExtras] = useState({ lateFee: false, lostBook: false, lostBookQty: 1, damagedBook: false, damagedBookQty: 1, cautionDeposit: false });
  const [penaltyShowQR, setPenaltyShowQR] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importRows, setImportRows] = useState([]);
  const [importMapping, setImportMapping] = useState({});
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null); // member detail view
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannerVideoRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const showToast = (message, type = "success") => { setToast({ message, type }); };

  const emptyBook    = { title: "", author: "", genre: GENRES[0], year: "", isbn: "", copies: 1, language: "Tamil", cover: "", status: "active", catalogueNo: 0, colorCode: "", catalogueId: "", accessionNumber: "", ageGroup: "", category: "", tags: "", callNumberPrefix: "", callNumberSuffix: "" };
  const defaultBranchId = (branches.find(b => /main/i.test(b.name || "")) || branches[0] || {}).id || "";
  const emptyMember  = { name: "", email: "", phone: "", altPhone: "", enrollmentDate: today(), childMemberName: "", childMemberDOB: "", guardianName: "", relationshipToMember: "", address: "", upiId: "", paymentMethod: "upi", registrationFees: "250", offerType: "", refundableDeposit: "", branch: defaultBranchId, membershipType: "monthly", plan: "", planDescription: "", status: "pending", password: "", comments: "" };
  const emptyLib     = { name: "", email: "", phone: "", branch: "Main", status: "active", password: "" };
  const emptyBranch  = { name: "", address: "", librarian: "" };

  const [bookForm,   setBookForm]   = useState(emptyBook);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [libForm,    setLibForm]    = useState(emptyLib);
  const [branchForm, setBranchForm] = useState(emptyBranch);

  const [catIdFields, setCatIdFields] = useState(settings.catalogueIdFields || DEFAULT_CATID_FIELDS);

  // Build catalogue ID from current bookForm values
  const buildCatalogueId = (form, fields) => {
    let parts = [];
    if (fields.catalogueNo && form.catalogueNo) parts.push(form.catalogueNo.toString().padStart(3, "0"));
    if (fields.genre      && form.genre)        parts.push(genreAbbr(form.genre));
    if (fields.language   && form.language)     parts.push(langAbbr(form.language));
    if (fields.colorCode  && form.colorCode)    parts.push(colorAbbr(form.colorCode));
    return parts.join("");
  };

  // Rebuild all computed fields (call numbers) at once
  const rebuildComputed = (upd, fields) => {
    const catId  = buildCatalogueId(upd, fields); // kept for DB backwards-compat
    const lang   = (upd.language || "").slice(0, 2).toUpperCase();
    const age    = String(parseInt(upd.ageGroup) || 0).padStart(2, "0");
    const cat    = (upd.category || "").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
    const col    = (COLOR_CODES.find(x => x.code === upd.colorCode)?.label || "").slice(0, 2).toUpperCase();
    const prefix = `S101${lang}${age}${cat}${col}`;
    // Sequence = count of existing books with same prefix (excluding current edit) + 1
    const samePrefix = books.filter(b => b.callNumberPrefix === prefix && b.id !== (editBook?.id));
    const seq    = String(samePrefix.length + 1).padStart(3, "0");
    const suffix = `${prefix}${seq}`;
    return { ...upd, catalogueId: catId, callNumberPrefix: prefix, callNumberSuffix: suffix };
  };

  // Reorder waiting positions for a book after someone is promoted/issued
  const reorderWaitlist = (bookId) => {
    setWaitlist(prev => {
      const waiting = prev.filter(w => w.bookId === bookId && w.status === "waiting")
        .sort((a, b) => a.position - b.position)
        .map((w, idx) => ({ ...w, position: idx + 1 }));
      const others = prev.filter(w => !(w.bookId === bookId && w.status === "waiting"));
      waiting.forEach(w => supabase.from("book_waitlist").update({ position: w.position }).eq("id", w.id).then(() => {}));
      return [...others, ...waiting];
    });
  };

  const pendingRequestsCount = (requests || []).filter(r => r.status === "pending").length;

  // ── Plan resolution ──
  // membership_plan on Users is either a plan id (members added/edited via the form) or a
  // plan name string (legacy/imported members) — resolve both ways so lookups never miss.
  const planList = settings.plans || DEFAULT_PLANS;
  const planMap = Object.fromEntries(planList.map(p => [p.id, p]));
  const planByName = Object.fromEntries(planList.map(p => [p.name.toLowerCase(), p]));
  const resolvePlan = (planKey) => planMap[planKey] || planByName[(planKey || "").toLowerCase()] || null;

  // ── Renewal helpers ──
  // Base = status table: last_paid_month before the current month (or never paid),
  // excluding closed accounts and In Library Reading members.
  const daysDiff = (dateStr) => {
    const diff = new Date(dateStr) - new Date(today());
    return Math.ceil(diff / 86400000);
  };
  const monthDiff = (from, to) => (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  // Matches the "MMM YYYY" text format already used in the status table's last_paid_month column (e.g. "Oct 2023")
  const monthYearLabel = (year, monthIndex) => new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
  // Only track members whose status-table status is some flavor of Active (Active, Active - Last
  // Month, Active - Late) — Paused, Closed*, Default*, In Library Reading, Volunteer, EWS are suppressed.
  const INCLUDED_RENEWAL_STATUS = /^active/i;
  const renewalCurrentMonthStart = new Date();
  renewalCurrentMonthStart.setDate(1);
  renewalCurrentMonthStart.setHours(0, 0, 0, 0);
  const renewalDueMembers = (memberStatuses || [])
    .filter(s => s.status && INCLUDED_RENEWAL_STATUS.test(s.status.trim()))
    .map(s => {
      const member = members.find(m => m.membershipId === s.memberId);
      if (!member || member.status !== "active") return null;
      const paidDate = s.lastPaidMonth ? new Date(s.lastPaidMonth) : null;
      const validPaidDate = paidDate && !isNaN(paidDate) ? paidDate : null;
      if (validPaidDate && validPaidDate >= renewalCurrentMonthStart) return null; // already paid for this month
      const dueBase = validPaidDate ? new Date(validPaidDate) : new Date(member.joined || today());
      dueBase.setMonth(dueBase.getMonth() + 1);
      // Months strictly before this one that are still unpaid = arrears; this month's charge is separate.
      const monthlyCost = resolvePlan(member.plan)?.cost || 0;
      const overdueMonths = Math.max(0, monthDiff(dueBase, renewalCurrentMonthStart));
      const overdueAmount = overdueMonths * monthlyCost;
      const dueThisMonthAmount = monthlyCost;
      const totalOutstanding = overdueAmount + dueThisMonthAmount;
      return { ...member, renewalDue: dueBase.toISOString().split("T")[0], statusLastPaidMonth: s.lastPaidMonth, overdueMonths, overdueAmount, dueThisMonthAmount, totalOutstanding };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.renewalDue) - new Date(b.renewalDue));
  const renewalOverdue  = renewalDueMembers.filter(m => daysDiff(m.renewalDue) < 0);
  const renewalDueSoon  = renewalDueMembers.filter(m => daysDiff(m.renewalDue) >= 0);
  const renewalCount = renewalDueMembers.length;

  const waitlistActiveCount = (waitlist || []).filter(w => w.status === "waiting" || w.status === "reserved").length;
  const tabItems = [
    { id: "books",       label: "Books",        icon: "book"     },
    { id: "members",     label: "Members",      icon: "users"    },
    { id: "requests",    label: `Requests${pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ""}`, icon: "book" },
    { id: "loans",       label: "Active Loans", icon: "eye"      },
    { id: "waitlist",    label: `Waitlist${waitlistActiveCount > 0 ? ` (${waitlistActiveCount})` : ""}`, icon: "eye" },
    { id: "renewals",    label: `Renewals${renewalCount > 0 ? ` (${renewalCount})` : ""}`, icon: "rupee" },
    { id: "payments",    label: "Payments",     icon: "rupee"    },
    { id: "customize",   label: "Customize",    icon: "settings" },
    { id: "fees",        label: "Fee Settings", icon: "money"    },
    ...(isAdmin ? [
      { id: "librarians", label: "Librarians",  icon: "user"     },
      { id: "revenue",    label: "Revenue",     icon: "money"    },
      { id: "branches",   label: "Branches",    icon: "branch"   },
    ] : []),
  ];

  // ── BOOK CRUD ──
  const generateCopyRows = async (bookId, callNoSuffix, totalCopies, existingCount = 0) => {
    const newCopies = [];
    for (let i = existingCount + 1; i <= totalCopies; i++) {
      newCopies.push({
        book_id: bookId,
        accession_number: `${callNoSuffix || bookId.slice(0, 8)}-${String(i).padStart(2, "0")}`,
        condition: "good", status: "available",
      });
    }
    if (newCopies.length === 0) return [];
    try {
      const { data, error } = await supabase.from("book_copies").insert(newCopies).select();
      if (error) throw error;
      return data.map(dbToCopy);
    } catch {
      return newCopies.map((c, idx) => ({ ...dbToCopy({ ...c, id: `LOCAL-${Date.now()}-${idx}` }) }));
    }
  };

  const saveBook = async () => {
    if (!bookForm.title.trim() || !bookForm.author.trim()) { showToast("Title and Author are required.", "error"); return; }
    const copies = parseInt(bookForm.copies) || 1;
    const dbData = bookToDB({ ...bookForm, copies });
    let savedBook = null;
    try {
      if (editBook) {
        const updateData = { ...dbData, available_copies: undefined };
        delete updateData.available_copies;
        const { data, error } = await supabase.from("books").update(updateData).eq("id", editBook.id).select().single();
        if (error) throw error;
        savedBook = { ...dbToBook(data), available: editBook.available };
        setBooks(books.map(b => b.id === editBook.id ? savedBook : b));
        // Add new copies if total increased
        const existingCount = bookCopies.filter(c => c.bookId === editBook.id).length;
        if (copies > existingCount) {
          const newOnes = await generateCopyRows(editBook.id, bookForm.callNumberSuffix, copies, existingCount);
          setBookCopies(prev => [...prev, ...newOnes]);
        }
        showToast(`"${bookForm.title}" updated.`);
      } else {
        const { data, error } = await supabase.from("books").insert(dbData).select().single();
        if (error) throw error;
        savedBook = dbToBook(data);
        setBooks(prev => [...prev, savedBook]);
        const newOnes = await generateCopyRows(data.id, bookForm.callNumberSuffix, copies, 0);
        setBookCopies(prev => [...prev, ...newOnes]);
        showToast(`"${bookForm.title}" added with ${copies} cop${copies > 1 ? "ies" : "y"}.`);
      }
    } catch (err) {
      console.error("Supabase save error:", err);
      showToast(`Save failed: ${err?.message || JSON.stringify(err)}`, "error");
      return;
    }
    setShowBookForm(false); setEditBook(null); setBookForm(emptyBook);
  };

  const deleteBook = async (id) => {
    if (!window.confirm("Delete this book from the catalog?")) return;
    try { await supabase.from("books").update({ status: "inactive" }).eq("id", id); } catch {}
    setBooks(books.filter(b => b.id !== id));
    showToast("Book removed.");
  };

  const openEditBook = (b) => { setEditBook(b); setBookForm({ ...b }); setShowBookForm(true); };

  // ── ISBN LOOKUP ──
  const lookupISBN = async (isbn) => {
    const clean = isbn.replace(/[^0-9Xx]/g, "");
    if (clean.length < 10) { showToast("Enter a valid ISBN (10 or 13 digits).", "error"); return; }
    setIsbnLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`);
      const data = await res.json();
      const key = `ISBN:${clean}`;
      if (!data[key]) { showToast("No book found for this ISBN.", "error"); return; }
      const info = data[key];
      const author = info.authors?.map(a => a.name).join(", ") || "";
      const cover = info.cover?.medium || info.cover?.large || info.cover?.small || "";
      const yearMatch = info.publish_date?.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : "";
      setBookForm(prev => ({
        ...prev,
        title:  info.title  || prev.title,
        author: author      || prev.author,
        year:   year        || prev.year,
        cover:  cover       || prev.cover,
      }));
      showToast("Book details fetched from Open Library!", "success");
    } catch {
      showToast("Failed to fetch book details. Check your connection.", "error");
    } finally {
      setIsbnLoading(false);
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (scannerVideoRef.current?.srcObject) {
      scannerVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      scannerVideoRef.current.srcObject = null;
    }
    setShowScanner(false);
  };

  const isbnFileInputRef = useRef(null);
  const handleISBNFileCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(res => { img.onload = res; });
      // Use native BarcodeDetector if available (Chrome Android), else ZXing polyfill (iOS, older Android)
      const Detector = ("BarcodeDetector" in window) ? window.BarcodeDetector : BarcodeDetectorPolyfill;
      const detector = new Detector({ formats: ["ean_13", "ean_8"] });
      const barcodes = await detector.detect(img);
      URL.revokeObjectURL(img.src);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        setBookForm(prev => ({ ...prev, isbn: code }));
        lookupISBN(code);
      } else {
        showToast("No barcode found in image. Try again with a clearer photo.", "error");
      }
    } catch { showToast("Could not read barcode from image.", "error"); }
  };

  const startScanner = async () => {
    // Check if getUserMedia (live stream) is available; iOS Safari and some Android browsers lack it
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasCamera) {
      // Fallback: open camera via file input (works on iOS Safari and older Android browsers)
      isbnFileInputRef.current?.click();
      return;
    }
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (scannerVideoRef.current) { scannerVideoRef.current.srcObject = stream; scannerVideoRef.current.play(); }
      // Use native BarcodeDetector if available (Chrome Android), else ZXing polyfill
      const Detector = ("BarcodeDetector" in window) ? window.BarcodeDetector : BarcodeDetectorPolyfill;
      const detector = new Detector({ formats: ["ean_13", "ean_8"] });
      scanIntervalRef.current = setInterval(async () => {
        if (!scannerVideoRef.current) return;
        try {
          const barcodes = await detector.detect(scannerVideoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stopScanner();
            setBookForm(prev => ({ ...prev, isbn: code }));
            lookupISBN(code);
          }
        } catch {}
      }, 500);
    } catch {
      showToast("Camera access denied or unavailable.", "error");
      setShowScanner(false);
    }
  };

  // ── MEMBER CRUD ──
  const saveMember = async () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) { showToast("Name and Email are required.", "error"); return; }
    if (!memberForm.phone.trim()) { showToast("Phone is required.", "error"); return; }
    if (!memberForm.address.trim()) { showToast("Address is required.", "error"); return; }
    if (!memberForm.plan) { showToast("Membership Plan is required.", "error"); return; }
    const autoPassword = memberForm.password.trim() || memberForm.name.split(" ")[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000);
    try {
      if (editMember) {
        const updateData = {
          child_member_name: memberForm.name || memberForm.childMemberName || null,
          email_id: memberForm.email, phone_number: memberForm.phone,
          alternate_phone_number: memberForm.altPhone || null,
          enrollment_date: memberForm.enrollmentDate || null,
          child_member_dateofbirth: memberForm.childMemberDOB || null,
          parent_guardian_name: memberForm.guardianName || null,
          relationship_to_the_member: memberForm.relationshipToMember || null,
          address: memberForm.address || null,
          upi_id: memberForm.upiId || null,
          payment_method: memberForm.paymentMethod || null,
          onetime_registration_fees: memberForm.registrationFees !== "" ? parseFloat(memberForm.registrationFees) : null,
          offer_type: memberForm.offerType || null,
          refundable_deposit: memberForm.refundableDeposit !== "" ? parseFloat(memberForm.refundableDeposit) : null,
          branch_id: memberForm.branch || null,
          membership_type: memberForm.membershipType, status: memberForm.status,
          membership_plan_description: memberForm.planDescription || null,
          comments: memberForm.comments || null,
        };
        if (memberForm.password.trim()) updateData.password = memberForm.password.trim();
        if (memberForm.plan) updateData.membership_plan = memberForm.plan;
        const { data, error } = await supabase.from("users").update(updateData).eq("id", editMember.id).select().single();
        if (error) throw error;
        setMembers(members.map(m => m.id === editMember.id ? dbToUser(data) : m));
        showToast(`Member "${memberForm.name}" updated.`);
      } else {
        const insertData = {
          child_member_name: memberForm.name || memberForm.childMemberName || null,
          email_id: memberForm.email, phone_number: memberForm.phone,
          alternate_phone_number: memberForm.altPhone || null,
          enrollment_date: memberForm.enrollmentDate || null,
          child_member_dateofbirth: memberForm.childMemberDOB || null,
          parent_guardian_name: memberForm.guardianName || null,
          relationship_to_the_member: memberForm.relationshipToMember || null,
          address: memberForm.address || null,
          upi_id: memberForm.upiId || null,
          payment_method: memberForm.paymentMethod || null,
          onetime_registration_fees: memberForm.registrationFees !== "" ? parseFloat(memberForm.registrationFees) : null,
          offer_type: memberForm.offerType || null,
          refundable_deposit: memberForm.refundableDeposit !== "" ? parseFloat(memberForm.refundableDeposit) : null,
          branch_id: memberForm.branch || null,
          password: autoPassword, role: "member", status: memberForm.status,
          membership_type: memberForm.membershipType, fees_due: 0,
          membership_plan_description: memberForm.planDescription || null,
          comments: memberForm.comments || null,
        };
        if (memberForm.plan) insertData.membership_plan = memberForm.plan;
        const { data, error } = await supabase.from("users").insert(insertData).select().single();
        if (error) throw error;
        setMembers([...members, dbToUser(data)]);
        showToast(`Member "${memberForm.name}" created. Password: ${autoPassword}`);
      }
    } catch (err) {
      // Fallback to in-memory
      if (editMember) {
        setMembers(members.map(m => m.id === editMember.id ? { ...editMember, ...memberForm } : m));
        showToast(`Member "${memberForm.name}" updated (offline).`);
      } else {
        const id = "MEM" + String(Date.now()).slice(-6);
        setMembers([...members, { ...memberForm, password: autoPassword, id, membershipId: id, joined: today(), fees: 0 }]);
        showToast(`Member "${memberForm.name}" created (offline). Password: ${autoPassword}`);
      }
    }
    setShowMemberForm(false); setEditMember(null); setMemberForm(emptyMember);
  };

  const handleImportCSV = async () => {
    setImportLoading(true);
    setImportResult(null);
    try {
      const records = importRows.map(row => {
        const nameCol = Object.keys(importMapping).find(k => importMapping[k] === "child_member_name");
        const baseName = nameCol ? (row[nameCol] || "").trim() : "";
        const rec = {
          role: "member",
          status: "active",
          fees_due: 0,
          password: baseName ? baseName.split(" ")[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000) : "member" + Math.floor(1000 + Math.random() * 9000),
        };
        Object.entries(importMapping).forEach(([csvCol, dbCol]) => {
          if (!dbCol) return;
          const val = (row[csvCol] || "").trim();
          rec[dbCol] = normalizeImportValue(dbCol, val, branches);
        });
        return rec;
      }).filter(r => r.child_member_name);

      if (!records.length) {
        showToast("No valid rows found. Make sure 'Child/Member Name' column is mapped.", "error");
        setImportLoading(false);
        return;
      }

      let inserted = 0, failed = 0, failedRows = [];
      for (let i = 0; i < records.length; i += 50) {
        const chunk = records.slice(i, i + 50);
        const { data, error } = await supabase.from("users").insert(chunk).select();
        if (error) {
          failed += chunk.length;
          failedRows.push(error.message);
        } else {
          inserted += data.length;
          setMembers(prev => [...prev, ...data.map(dbToUser)]);
        }
      }
      setImportResult({ inserted, failed, total: records.length, errors: failedRows });
    } catch (err) {
      showToast("Import failed: " + err.message, "error");
    }
    setImportLoading(false);
  };

  const deleteMember = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    try { await supabase.from("users").update({ status: "suspended" }).eq("id", id); } catch {}
    setMembers(members.filter(m => m.id !== id));
    showToast("Member removed.");
  };

  const approveMember = async (memberId, planId) => {
    let activatedMember = null;
    const pendingMember = members.find(m => m.id === memberId);
    const joinDate = pendingMember?.joined || today();
    const sameMonthCount = members.filter(m =>
      m.status === "active" && m.joined &&
      new Date(m.joined).getFullYear() === new Date(joinDate).getFullYear() &&
      new Date(m.joined).getMonth() === new Date(joinDate).getMonth()
    ).length;
    const newMembershipId = genMembershipId(joinDate, sameMonthCount);
    try {
      const updateData = { status: "active", membership_id: newMembershipId };
      if (planId) updateData.membership_plan = planId;
      const { data, error } = await supabase.from("users").update(updateData).eq("id", memberId).select().single();
      if (error) throw error;
      const mapped = dbToUser(data);
      setMembers(members.map(m => m.id === memberId ? mapped : m));
      activatedMember = mapped;
      showToast(`Membership activated! ID: ${mapped.membershipId || newMembershipId}`);
    } catch {
      const offlineMember = { ...pendingMember, membershipId: newMembershipId, status: "active", joined: joinDate, plan: planId || null };
      setMembers(members.map(m => m.id === memberId ? offlineMember : m));
      activatedMember = offlineMember;
      showToast(`Membership activated (offline)! ID: ${newMembershipId}`);
    }
    setActivateModal(null);
    setActivatePlanId("");
    // Fire welcome email — non-blocking, silent on failure
    if (activatedMember?.email) {
      supabase.functions.invoke("welcome-email", {
        body: { memberId: activatedMember.id },
      }).catch(() => {});
    }
  };

  const renewMember = async (memberId, extras = {}) => {
    const renewedDate = today();
    // Outstanding fees are cleared only for items the librarian is collecting now
    const newFees = extras.lateFeeCollected ? 0 : (extras.currentFees || 0);
    try {
      const { error } = await supabase.from("users").update({ plan_renewed_at: renewedDate, renewal_requested_at: null, fees: newFees }).eq("id", memberId);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, planRenewedAt: renewedDate, renewalRequestedAt: null, fees: newFees } : m));
      // Advance last_paid_month on the status table so Renewals reflects this payment
      if (extras.membershipId && extras.lastPaidMonthText) {
        const { data: updated, error: statusErr } = await supabase.from("status")
          .update({ last_paid_month: extras.lastPaidMonthText })
          .eq("member_id", extras.membershipId)
          .select();
        if (statusErr) throw statusErr;
        if (updated && updated.length > 0) {
          setMemberStatuses?.(prev => prev.map(s => s.memberId === extras.membershipId ? { ...s, lastPaidMonth: extras.lastPaidMonthText } : s));
        } else {
          // No status row yet (e.g. member added directly in-app) — create one so future renewals track it
          const { data: inserted, error: insertErr } = await supabase.from("status")
            .insert({ member_id: extras.membershipId, member_name: extras.memberName || "", status: "Active", last_paid_month: extras.lastPaidMonthText })
            .select();
          if (!insertErr && inserted?.[0]) setMemberStatuses?.(prev => [...prev, dbToMemberStatus(inserted[0])]);
        }
      }
      showToast("Membership renewed successfully!");
    } catch {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, planRenewedAt: renewedDate, renewalRequestedAt: null, fees: newFees } : m));
      showToast("Renewed (offline — sync when online).");
    }
    setRenewModal(null);
    setRenewExtras({ lateFee: false, lostBook: false, lostBookQty: 1, damagedBook: false, damagedBookQty: 1, cautionDeposit: false });
    setCollectMode("total");
    setManualPaidMonth("");
  };

  const resetPenaltyExtras = () => setPenaltyExtras({ lateFee: false, lostBook: false, lostBookQty: 1, damagedBook: false, damagedBookQty: 1, cautionDeposit: false });

  const savePenaltyFees = async ({ memberId, extras, lateAmt, asPayLater }) => {
    const lostAmt      = settings.fees.bookLostFee      || 500;
    const damagedAmt   = settings.fees.bookDamageFee    || 200;
    const cautionAmt   = settings.fees.cautionDeposit   || 1000;
    const total =
      (extras.lateFee         ? (lateAmt || 0)                                          : 0) +
      (extras.lostBook        ? lostAmt      * (extras.lostBookQty        || 1)         : 0) +
      (extras.damagedBook     ? damagedAmt   * (extras.damagedBookQty     || 1)         : 0) +
      (extras.cautionDeposit  ? cautionAmt                                               : 0);
    if (total === 0) { setPenaltyModal(null); resetPenaltyExtras(); setPenaltyShowQR(false); return; }
    try {
      const { data: memberRow } = await supabase.from("users").select("fees").eq("id", memberId).single();
      const prevFees = memberRow?.fees || 0;
      await supabase.from("users").update({ fees: prevFees + total }).eq("id", memberId);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, fees: (m.fees || 0) + total } : m));
      if (asPayLater) {
        // Pre-check the matching boxes in Collect & Renew so librarian collects at next renewal
        setRenewExtras({
          lateFee:            extras.lateFee || extras.lostBook || extras.damagedBook || extras.cautionDeposit,
          lostBook:           false, lostBookQty:        1,
          damagedBook:        false, damagedBookQty:     1,
          cautionDeposit:     false,
        });
      }
      showToast(`Penalty of ₹${total.toLocaleString()} ${asPayLater ? "added to member's outstanding balance." : "recorded."}`);
    } catch (err) {
      showToast(`Failed to save penalty: ${err?.message || "Unknown error"}`, "error");
      return;
    }
    setPenaltyModal(null);
    resetPenaltyExtras();
    setPenaltyShowQR(false);
  };

  const openEditMember = (m) => { setEditMember(m); setMemberForm({ name: m.name, email: m.email, phone: m.phone || "", altPhone: m.altPhone || "", enrollmentDate: m.enrollmentDate || "", childMemberName: m.childMemberName || "", childMemberDOB: m.childMemberDOB || "", guardianName: m.guardianName || "", relationshipToMember: m.relationshipToMember || "", address: m.address || "", upiId: m.upiId || "", paymentMethod: m.paymentMethod || "", registrationFees: m.registrationFees || "", offerType: m.offerType || "", refundableDeposit: m.refundableDeposit || "", branch: m.branch || "", membershipType: m.membershipType || "annual", plan: m.plan || "", planDescription: m.planDescription || "", status: m.status, password: m.password || "", comments: m.comments || "" }); setShowMemberForm(true); };

  // ── LIBRARIAN CRUD ──
  const saveLib = () => {
    if (!libForm.name.trim() || !libForm.email.trim()) { showToast("Name and Email are required.", "error"); return; }
    if (editLib) {
      setLibrarians(librarians.map(l => l.id === editLib.id ? { ...editLib, ...libForm } : l));
      showToast("Librarian updated.");
    } else {
      const id = nextId(librarians, "LIB");
      setLibrarians([...librarians, { ...libForm, id, joined: today() }]);
      showToast(`Librarian "${libForm.name}" added with ID ${id}.`);
    }
    setShowLibForm(false); setEditLib(null); setLibForm(emptyLib);
  };

  const deleteLib = (id) => {
    if (!window.confirm("Remove this librarian?")) return;
    setLibrarians(librarians.filter(l => l.id !== id));
    showToast("Librarian removed.");
  };

  // ── RETURN BOOK (from loans tab) ──
  const processReturn = async (txnId) => {
    const t = transactions.find(tx => tx.id === txnId);
    if (!t) return;
    const late = calcLateFee(t.dueDate, settings.fees.lateFeePerDay);
    try {
      await supabase.from("transactions").update({ returned_at: new Date().toISOString(), late_fee: late }).eq("id", txnId);
      const { data: bookRow } = await supabase.from("books").select("available_copies").eq("id", t.bookId).single();
      if (bookRow) await supabase.from("books").update({ available_copies: (bookRow.available_copies || 0) + 1 }).eq("id", t.bookId);
      // Mark the borrowed copy as available again
      if (t.copyId) {
        await supabase.from("book_copies").update({ status: "available" }).eq("id", t.copyId);
        setBookCopies(prev => prev.map(c => c.id === t.copyId ? { ...c, status: "available" } : c));
      } else {
        // fallback: mark first borrowed copy of this book as available
        const borrowedCopy = bookCopies.find(c => c.bookId === t.bookId && c.status === "borrowed");
        if (borrowedCopy) {
          await supabase.from("book_copies").update({ status: "available" }).eq("id", borrowedCopy.id);
          setBookCopies(prev => prev.map(c => c.id === borrowedCopy.id ? { ...c, status: "available" } : c));
        }
      }
      if (late > 0) {
        const { data: memRow } = await supabase.from("users").select("fees_due").eq("id", t.memberId).single();
        if (memRow) await supabase.from("users").update({ fees_due: (parseFloat(memRow.fees_due) || 0) + late }).eq("id", t.memberId);
      }
    } catch {}
    setTransactions(prev => prev.map(tx => tx.id !== txnId ? tx : { ...tx, returnDate: today(), lateFee: late }));
    setBooks(prev => prev.map(b => b.id === t.bookId ? { ...b, available: b.available + 1 } : b));
    if (late > 0) setMembers(prev => prev.map(m => m.id === t.memberId ? { ...m, fees: (m.fees || 0) + late } : m));
    // Auto-promote next person in waitlist → create a pending borrow request for them
    // Re-fetch from DB to get freshest waitlist state
    const { data: freshWaitlist } = await supabase.from("book_waitlist").select("*").eq("book_id", t.bookId).in("status", ["waiting", "reserved"]).order("position").limit(1);
    console.log("processReturn: bookId=", t.bookId, "freshWaitlist=", freshWaitlist);
    const nextRaw = freshWaitlist?.[0];
    const nextInLine = nextRaw ? { id: nextRaw.id, bookId: nextRaw.book_id, bookTitle: nextRaw.book_title, memberId: nextRaw.member_id, memberName: nextRaw.member_name, status: nextRaw.status } : null;
    if (nextInLine) {
      try {
        const { data: reqData, error: reqErr } = await supabase.from("borrow_requests").insert({
          member_id: nextInLine.memberId, book_id: nextInLine.bookId,
          member_name: nextInLine.memberName, book_title: nextInLine.bookTitle,
          status: "pending",
        }).select().single();
        console.log("borrow_requests insert:", reqData, reqErr);
        if (reqData) setRequests(prev => [...prev, dbToRequest(reqData)]);
        await supabase.from("book_waitlist").update({ status: "issued" }).eq("id", nextInLine.id);
      } catch (err) {
        console.error("Failed to promote waitlist member:", err);
      }
      setWaitlist(prev => prev.map(w => w.id === nextInLine.id ? { ...w, status: "issued" } : w));
      reorderWaitlist(t.bookId);
      showToast(`Book returned. Borrow request created for ${nextInLine.memberName} — check the Requests tab.`);
    } else {
      console.log("processReturn: no waitlist entry found for book", t.bookId);
      showToast("Book returned successfully.");
    }
    setReturnConfirm(null);
  };

  // ── SETTINGS ──
  const updateSection = (key, field, val) => {
    const u = { ...localSettings, sections: { ...localSettings.sections, [key]: { ...localSettings.sections[key], [field]: val } } };
    setLocalSettings(u);
  };
  const updateBrowse = (key, field, val) => {
    const u = { ...localSettings, browseMenu: { ...localSettings.browseMenu, [key]: { ...localSettings.browseMenu[key], [field]: val } } };
    setLocalSettings(u);
  };
  const updateFee = (key, val) => {
    setLocalSettings(prev => ({ ...prev, fees: { ...prev.fees, [key]: Number(val) } }));
  };
  const saveFees = async () => {
    onSettings(localSettings);
    try { localStorage.setItem("arivagam_settings", JSON.stringify(localSettings)); } catch {}
    try {
      const { data: existing } = await supabase.from("fee_settings").select("id").limit(1).maybeSingle();
      const feeData = {
        late_fee_per_day:   localSettings.fees.lateFeePerDay,
        book_damage_fee:    localSettings.fees.bookDamageFee,
        book_lost_fee:      localSettings.fees.bookLostFee,
        grace_period_days:  localSettings.fees.gracePeriodDays,
        settings_json:      JSON.stringify(localSettings),
        updated_at:         new Date().toISOString(),
      };
      if (existing?.id) await supabase.from("fee_settings").update(feeData).eq("id", existing.id);
      else await supabase.from("fee_settings").insert(feeData);
    } catch {}
    showToast("Fee settings saved.");
  };
  const updateLibrary = (key, val) => {
    const u = { ...localSettings, library: { ...localSettings.library, [key]: val } };
    setLocalSettings(u);
  };
  const saveSettings = async () => {
    onSettings(localSettings);
    try { localStorage.setItem("arivagam_settings", JSON.stringify(localSettings)); } catch {}
    // Also persist to Supabase so all browsers/sessions see the same settings
    try {
      const { data: existing } = await supabase.from("fee_settings").select("id").limit(1).maybeSingle();
      const patch = { settings_json: JSON.stringify(localSettings), updated_at: new Date().toISOString() };
      if (existing?.id) await supabase.from("fee_settings").update(patch).eq("id", existing.id);
      else await supabase.from("fee_settings").insert(patch);
    } catch { /* settings_json column may not exist yet — falls back to localStorage only */ }
    showToast("Settings saved.");
  };

  // Check for expired grace periods on dashboard render
  useEffect(() => {
    const todayStr = today();
    const expired = (waitlist || []).filter(w => w.status === "reserved" && w.graceDeadline && w.graceDeadline < todayStr);
    if (expired.length === 0) return;
    expired.forEach(async (w) => {
      try { await supabase.from("book_waitlist").update({ status: "expired" }).eq("id", w.id); } catch {}
      setWaitlist(prev => prev.map(x => x.id === w.id ? { ...x, status: "expired" } : x));
      // Promote next waiting person for the same book
      const nextWaiting = (waitlist || []).find(x => x.bookId === w.bookId && x.status === "waiting");
      if (nextWaiting) {
        const graceDeadline = addDays(todayStr, settings.fees.gracePeriodDays || 3);
        try { await supabase.from("book_waitlist").update({ status: "reserved", reserved_at: new Date().toISOString(), grace_deadline: graceDeadline }).eq("id", nextWaiting.id); } catch {}
        setWaitlist(prev => prev.map(x => x.id === nextWaiting.id ? { ...x, status: "reserved", reservedAt: todayStr, graceDeadline } : x));
      }
    });
  }, []); // eslint-disable-line

  const activeLoans = transactions.filter(t => !t.returnDate);
  const pendingMembers = members.filter(m => m.status === "pending");
  // Membership Status bucket comes from the status table lookup (e.g. "Active", "Paused",
  // "Closed", "In Library Reading") — anything else falls back to Active Members.
  const membershipStatusBucket = (m) => {
    const statusRow = (memberStatuses || []).find(s => s.memberId === (m.membershipId || m.id));
    const status = (statusRow?.status || "").trim();
    if (/library/i.test(status)) return "inlibrary";
    if (/^paused/i.test(status)) return "paused";
    if (/^closed/i.test(status)) return "closed";
    return "active";
  };
  const activeMembersCount = members.filter(m => membershipStatusBucket(m) === "active").length;

  return (
    <div className="dash-wrap" style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 20px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: C.green, fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{isAdmin ? "Admin Dashboard" : "Librarian Dashboard"}</h1>
        <p style={{ color: C.gray600, margin: 0, fontSize: 13 }}>{isAdmin ? "Full access — books, members, librarians, revenue, and settings." : "Manage books, members, loans, and site settings."}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Books" value={books.length} icon="book" color={C.green} onClick={() => setTab("books")} />
        <StatCard label="Active Members" value={activeMembersCount} icon="users" color={C.greenMid} onClick={() => { setTab("members"); setMemberFilter(null); setSelectedMember(null); }} />
        <StatCard label="Pending Membership Approval" value={pendingMembers.length} icon="alert" color={pendingMembers.length > 0 ? C.orange : C.gray300} onClick={() => { setTab("members"); setMemberFilter("pending"); setSelectedMember(null); }} />
        <StatCard label="Active Loans" value={activeLoans.length} icon="eye" color={C.blue} onClick={() => setTab("loans")} />
        <StatCard label="Pending Renewals" value={renewalDueSoon.length} icon="calendar" color={renewalDueSoon.length > 0 ? "#E67E22" : C.gray300} onClick={() => { setTab("renewals"); setRenewalFilter("pending"); }} />
        <StatCard label="Renewal Overdue" value={renewalOverdue.length} icon="alert" color={renewalOverdue.length > 0 ? C.red : C.gray300} onClick={() => { setTab("renewals"); setRenewalFilter("overdue"); }} />
        {isAdmin && <StatCard label="Librarians" value={librarians.length} icon="user" color={C.goldDark} onClick={() => setTab("librarians")} />}
      </div>

      {/* Pending member alert */}
      {pendingMembers.length > 0 && (
        <div style={{ background: C.goldLight, border: `1.5px solid ${C.goldDark}`, borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="alert" size={18} color={C.goldDark} />
          <span style={{ flex: 1, fontSize: 13, color: C.green, fontWeight: 600 }}>{pendingMembers.length} member{pendingMembers.length > 1 ? "s" : ""} waiting for approval</span>
          <Btn size="sm" variant="secondary" onClick={() => { setTab("members"); setMemberFilter("pending"); setSelectedMember(null); }}>Review Now</Btn>
        </div>
      )}

      {/* Tabs */}
      <div className="dash-tabs">
        {tabItems.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedMember(null); setMemberFilter(null); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", color: tab === t.id ? C.green : C.gray600, borderBottom: tab === t.id ? `2px solid ${C.green}` : "2px solid transparent", marginBottom: -2, whiteSpace: "nowrap" }}>
            <Icon name={t.icon} size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* ══ BOOKS TAB ══ */}
      {tab === "books" && (() => {
        const q = bookSearch.trim().toLowerCase();
        const filteredBooks = books.filter(b => !q || [b.title, b.author, b.genre, b.language, b.catalogueId, b.callNumberSuffix, b.isbn]
          .filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
        // books arrives pre-sorted by title, so the first row for each letter is a stable jump target
        const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const letterFirstIndex = {};
        filteredBooks.forEach((b, i) => {
          const letter = (b.title || "").trim().charAt(0).toUpperCase();
          if (AZ.includes(letter) && letterFirstIndex[letter] === undefined) letterFirstIndex[letter] = i;
        });
        const scrollToLetter = (letter) => {
          document.getElementById(`book-row-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, color: C.green, fontSize: 16, fontWeight: 700 }}>Book Catalog ({q ? `${filteredBooks.length} of ${books.length}` : books.length})</h2>
            <Btn variant="primary" icon="plus" onClick={() => { setBookForm(emptyBook); setEditBook(null); setShowBookForm(true); }}>Add Book</Btn>
          </div>
          <div style={{ marginBottom: 14, position: "relative", maxWidth: 360 }}>
            <input value={bookSearch} onChange={e => setBookSearch(e.target.value)} placeholder="Search title, author, genre, call no…"
              style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.gray300} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={14} color={C.gray300} /></span>
          </div>
          <div className="books-tbl-scroll-wrap" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {/* A-Z quick scroll — sticky just under the top nav, so it stays reachable while scrolling a long book list */}
          <div className="az-scroll-rail" style={{ position: "sticky", top: 68, maxHeight: "calc(100vh - 84px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1, background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "6px 3px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.08)", zIndex: 40 }}>
            {AZ.map(letter => {
              const has = letterFirstIndex[letter] !== undefined;
              return (
                <button key={letter} onClick={() => has && scrollToLetter(letter)} disabled={!has}
                  style={{ width: 22, height: 18, border: "none", background: "none", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "inherit", color: has ? C.green : C.gray200, cursor: has ? "pointer" : "default" }}
                  onMouseEnter={e => { if (has) e.currentTarget.style.background = C.green + "18"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                  {letter}
                </button>
              );
            })}
          </div>
          <div className="books-tbl-container" style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflowX: "hidden", overflowY: "auto", maxHeight: "70vh", flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div className="books-tbl-head" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 130px 70px 70px 110px", gap: 10, padding: "10px 16px", background: C.gray50, fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, position: "sticky", top: 0, zIndex: 1 }}>
              <span>Title / Author</span><span>Genre</span><span>Language</span><span>Call No. Suffix</span><span>Copies</span><span>Avail.</span><span>Actions</span>
            </div>
            {filteredBooks.length === 0 && (
              <div style={{ padding: "32px 18px", textAlign: "center", color: C.gray600, fontSize: 13 }}>No books match your search.</div>
            )}
            {filteredBooks.map((b, i) => {
              const colorEntry = COLOR_CODES.find(c => c.code === b.colorCode);
              const copies = bookCopies.filter(c => c.bookId === b.id);
              const isExpanded = expandedBookId === b.id;
              const letter = (b.title || "").trim().charAt(0).toUpperCase();
              const rowId = letterFirstIndex[letter] === i ? `book-row-${letter}` : undefined;
              return (
                <div key={b.id} id={rowId} style={{ borderTop: `1px solid ${C.gray100}`, scrollMarginTop: 12 }}>
                  {/* Book row */}
                  <div className="books-tbl-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 130px 70px 70px 110px", gap: 10, padding: "12px 16px", alignItems: "center", background: i % 2 === 0 ? C.white : C.gray50 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 13 }}>{b.title}</div>
                      <div style={{ color: C.gray600, fontSize: 11 }}>{b.author}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.gray600 }}>{b.genre}</div>
                    <div style={{ fontSize: 12, color: C.gray600 }}>{b.language}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {colorEntry && <div style={{ width: 10, height: 10, borderRadius: 2, background: colorEntry.hex, flexShrink: 0, border: "1px solid rgba(0,0,0,.15)" }} />}
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: C.green }}>{b.callNumberSuffix || b.catalogueId || "—"}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.gray900 }}>{b.copies}</div>
                    <div><span style={{ fontSize: 13, fontWeight: 700, color: b.available > 0 ? C.greenMid : C.red }}>{b.available}</span></div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setExpandedBookId(isExpanded ? null : b.id)}
                        style={{ background: isExpanded ? C.green : C.gray100, border: "none", cursor: "pointer", padding: "5px 7px", borderRadius: 6 }} title="View Copies">
                        <Icon name="book" size={13} color={isExpanded ? C.white : C.gray600} />
                      </button>
                      <button onClick={() => openEditBook(b)} style={{ background: C.blueLight, border: "none", cursor: "pointer", padding: "5px 7px", borderRadius: 6 }} title="Edit"><Icon name="edit" size={13} color={C.blue} /></button>
                      <button onClick={() => deleteBook(b.id)} style={{ background: C.redLight, border: "none", cursor: "pointer", padding: "5px 7px", borderRadius: 6 }} title="Delete"><Icon name="trash" size={13} color={C.red} /></button>
                    </div>
                  </div>
                  {/* Copies panel */}
                  {isExpanded && (
                    <div style={{ background: "#F0F7F2", borderTop: `1px dashed ${C.greenLight}`, padding: "12px 20px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>
                        Physical Copies — {copies.length} registered
                      </div>
                      {copies.length === 0 ? (
                        <p style={{ fontSize: 12, color: C.gray600, margin: 0 }}>No copies registered yet. Save the book again to generate copies.</p>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {copies.map(copy => {
                            const statusColor = copy.status === "available" ? C.greenMid : copy.status === "borrowed" ? C.orange : copy.status === "lost" ? C.red : C.gray600;
                            return (
                              <div key={copy.id} style={{ display: "flex", alignItems: "center", gap: 8, background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 8, padding: "8px 12px", minWidth: 220 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: C.gray900 }}>{copy.accessionNumber}</div>
                                  <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, textTransform: "uppercase" }}>{copy.status}</span>
                                    <span style={{ fontSize: 10, color: C.gray300 }}>·</span>
                                    <span style={{ fontSize: 10, color: C.gray600, textTransform: "capitalize" }}>{copy.condition}</span>
                                  </div>
                                </div>
                                <select value={copy.condition}
                                  onChange={async e => {
                                    const cond = e.target.value;
                                    try { await supabase.from("book_copies").update({ condition: cond }).eq("id", copy.id); } catch {}
                                    setBookCopies(prev => prev.map(c => c.id === copy.id ? { ...c, condition: cond } : c));
                                  }}
                                  style={{ fontSize: 11, padding: "3px 6px", borderRadius: 5, border: `1px solid ${C.gray300}`, background: C.white, color: C.gray900 }}>
                                  <option value="good">Good</option>
                                  <option value="fair">Fair</option>
                                  <option value="damaged">Damaged</option>
                                  <option value="lost">Lost</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
        );
      })()}

      {/* ══ MEMBERS TAB ══ */}
      {tab === "members" && !selectedMember && (() => {
        const q = memberSearch.trim().toLowerCase();
        const sortedMembers = [...members].sort((a, b) => String(a.membershipId || a.id).localeCompare(String(b.membershipId || b.id)));
        const statusTabCounts = { active: 0, paused: 0, closed: 0, inlibrary: 0 };
        members.forEach(m => { statusTabCounts[membershipStatusBucket(m)]++; });
        const statusTabs = [
          { id: "active",    label: "Active Members", count: statusTabCounts.active },
          { id: "paused",    label: "Paused",         count: statusTabCounts.paused },
          { id: "closed",    label: "Closed",         count: statusTabCounts.closed },
          { id: "inlibrary", label: "InLibrary",       count: statusTabCounts.inlibrary },
        ];
        const tabFilteredMembers = sortedMembers.filter(m => membershipStatusBucket(m) === memberStatusTab);
        const filteredMembers = tabFilteredMembers.filter(m => (!memberFilter || m.status === memberFilter)
          && (!q || [m.name, m.email, m.phone, m.membershipId, m.id].filter(Boolean).some(v => String(v).toLowerCase().includes(q))));
        const pillStyle = (active) => ({
          background: active ? C.green : C.white, color: active ? C.white : C.gray600,
          border: `1px solid ${active ? C.green : C.gray200}`, borderRadius: 20, padding: "7px 16px",
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
        });
        return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, color: C.green, fontSize: 16, fontWeight: 700 }}>
              Members ({q ? `${filteredMembers.length} of ${members.length}` : memberFilter === "pending" ? `${filteredMembers.length} pending` : members.length})
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="outline" onClick={() => { setImportHeaders([]); setImportRows([]); setImportMapping({}); setImportResult(null); setShowImportModal(true); }}>Import CSV</Btn>
              <Btn variant="primary" icon="plus" onClick={() => { setMemberForm(emptyMember); setEditMember(null); setShowMemberForm(true); }}>Add Member</Btn>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {statusTabs.map(t => (
              <button key={t.id} style={pillStyle(memberStatusTab === t.id)} onClick={() => setMemberStatusTab(t.id)}>{t.label} ({t.count})</button>
            ))}
          </div>
          {memberFilter && (
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setMemberFilter(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.orange + "18", border: `1px solid ${C.orange}`, color: C.orange, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Showing pending approvals only — click to clear
              </button>
            </div>
          )}
          <div style={{ marginBottom: 14, position: "relative", maxWidth: 360 }}>
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search name, ID, email, phone…"
              style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.gray300} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={14} color={C.gray300} /></span>
          </div>
          <div className="members-tbl-container" style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflowX: "hidden", overflowY: "auto", maxHeight: "70vh" }}>
            {/* Header */}
            <div className="members-tbl-head" style={{ display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1fr 130px 230px", gap: 10, padding: "10px 16px", background: C.gray50, fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, position: "sticky", top: 0, zIndex: 1 }}>
              <span>Member</span><span>Contact</span><span>Plan / Joined</span><span>Membership Status</span><span>Actions</span>
            </div>
            {filteredMembers.length === 0 && (
              <div style={{ padding: "32px 18px", textAlign: "center", color: C.gray600, fontSize: 13 }}>No members match your search.</div>
            )}
            {filteredMembers.map((m, i) => {
              const plan = resolvePlan(m.plan);
              return (
                <div key={m.id} style={{ borderTop: i > 0 ? `1px solid ${C.gray100}` : "none" }}>
                  <div className="members-tbl-row" onClick={() => setSelectedMember(m)}
                    style={{ display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1fr 130px 230px", gap: 10, padding: "12px 16px", alignItems: "center", background: m.status === "pending" ? C.goldLight + "55" : i % 2 === 0 ? C.white : C.gray50, cursor: "pointer", transition: "background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.green + "0a"}
                    onMouseLeave={e => e.currentTarget.style.background = m.status === "pending" ? C.goldLight + "55" : i % 2 === 0 ? C.white : C.gray50}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, background: m.status === "active" ? C.green + "20" : C.orange + "20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="user" size={16} color={m.status === "active" ? C.green : C.orange} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: C.green, fontSize: 13, fontFamily: "monospace" }}>{m.membershipId || m.id}</div>
                        <div style={{ fontSize: 12, color: C.gray600 }}>{m.name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.gray600, minWidth: 0, wordBreak: "break-word" }}>{m.email}{m.phone && <><br />{m.phone}</>}</div>
                    <div style={{ fontSize: 12, color: C.gray600 }}>
                      {plan && <div style={{ color: C.blue, fontWeight: 600 }}>{plan.name}</div>}
                      {m.joined}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(() => {
                        const statusRow = (memberStatuses || []).find(s => s.memberId === (m.membershipId || m.id));
                        const membershipStatus = statusRow?.status || "";
                        return <Badge label={membershipStatus || "—"} color={/^active/i.test(membershipStatus) ? C.greenMid : membershipStatus ? C.red : C.gray300} />;
                      })()}
                      {m.fees > 0 && <Badge label={`₹${m.fees} due`} color={C.red} />}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                      {m.status === "pending" && <Badge label="Pending Activation" color={C.orange} />}
                      {m.status === "pending" && (
                        <Btn size="sm" variant="secondary" icon="check" onClick={() => { setActivateModal({ member: m }); setActivatePlanId((settings.plans || DEFAULT_PLANS)[0]?.id || ""); }}>Activate</Btn>
                      )}
                      <button onClick={() => openEditMember(m)} style={{ background: C.blueLight, border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 6 }} title="Edit"><Icon name="edit" size={13} color={C.blue} /></button>
                      {isAdmin && (
                        <button onClick={() => deleteMember(m.id)} style={{ background: C.redLight, border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 6 }} title="Delete"><Icon name="trash" size={13} color={C.red} /></button>
                      )}
                    </div>
                  </div>
                  {/* ── Renewal Request Banner ── */}
                  {m.renewalRequestedAt && (
                    <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#fff7e6,#ffe4b3)", borderTop: "2px solid #E67E22", padding: "10px 16px", boxShadow: "0 2px 12px rgba(230,126,34,.15)", animation: "pulse 2s infinite" }}>
                      <div style={{ fontSize: 22, flexShrink: 0 }}>💰</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#B7611A", lineHeight: 1.2 }}>Membership Fee Paid</div>
                        <div style={{ fontSize: 11, color: "#7D4E1A", marginTop: 2 }}>Review &amp; Renew</div>
                      </div>
                      <button
                        onClick={() => setRenewModal({ member: m, plan: resolvePlan(m.plan) })}
                        style={{ background: "#E67E22", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        Renew Now
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* ══ MEMBER DETAIL VIEW ══ */}
      {tab === "members" && selectedMember && (() => {
        const m = members.find(x => x.id === selectedMember.id) || selectedMember;
        const plan = resolvePlan(m.plan);
        const mTxns = transactions.filter(t => t.memberId === m.id);
        const activeLoans = mTxns.filter(t => !t.returnDate);
        const history = mTxns.filter(t => t.returnDate);
const mRequests = (requests || []).filter(r => r.memberId === m.id);
        // Activation status comes from the `status` table (kept separate from the member's own record)
        const statusRow = (memberStatuses || []).find(s => s.memberId === (m.membershipId || m.id));
        const activationStatus = (statusRow?.status || m.status || "").trim();
        // Payments sorted by Next Fee Month, descending. Handles both parseable dates and "MMM-YY" labels.
        const parseMonthKey = (str) => {
          if (!str) return -Infinity;
          const direct = new Date(str);
          if (!isNaN(direct)) return direct.getTime();
          const match = String(str).trim().match(/^([A-Za-z]{3,})[\s-]?(\d{2,4})$/);
          if (match) {
            const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
            const mi = months.indexOf(match[1].slice(0, 3).toLowerCase());
            if (mi >= 0) {
              let yr = parseInt(match[2], 10);
              if (yr < 100) yr += 2000;
              return new Date(yr, mi, 1).getTime();
            }
          }
          return -Infinity;
        };
        const mPayments = (payments || []).filter(p => p.memberId === (m.membershipId || m.id))
          .slice().sort((a, b) => parseMonthKey(b.nextFeeMonth) - parseMonthKey(a.nextFeeMonth));
        return (
          <div>
            {/* Back button */}
            <button onClick={() => setSelectedMember(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.green, fontWeight: 600, fontSize: 14, marginBottom: 20, padding: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Members
            </button>

            <div className="member-detail-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
              {/* ── LEFT: Profile Card ── */}
              <div className="member-profile-sticky" style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 14, overflow: "hidden", position: "sticky", top: 20 }}>
                {/* Avatar */}
                <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, padding: "28px 24px 20px", textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Icon name="user" size={34} color={C.white} />
                  </div>
                  <div style={{ fontWeight: 800, color: C.white, fontSize: 17, lineHeight: 1.2, fontFamily: "monospace" }}>{m.membershipId || m.id}</div>
                  <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 4 }}>{m.name}</div>
                </div>
                {/* Details */}
                <div style={{ padding: "16px 20px" }}>
                  {[
                    { label: "Email",   value: m.email },
                    { label: "Phone",   value: m.phone || "—" },
                    { label: "Joined",  value: m.joined },
                    { label: "Type",    value: m.membershipType ? m.membershipType.charAt(0).toUpperCase() + m.membershipType.slice(1) : "—" },
                    { label: "Plan",    value: plan ? plan.name : "No plan assigned" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.gray100}`, fontSize: 13 }}>
                      <span style={{ color: C.gray600, fontWeight: 600 }}>{label}</span>
                      <span style={{ color: C.gray900, fontWeight: 500, textAlign: "right", maxWidth: 160, wordBreak: "break-word" }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: 13 }}>
                    <span style={{ color: C.gray600, fontWeight: 600 }}>Status</span>
                    <Badge label={activationStatus || "—"} color={activationStatus.toLowerCase() === "active" ? C.greenMid : activationStatus.toLowerCase() === "pending" ? C.orange : C.red} />
                  </div>
                  {(() => {
                    const membershipFee   = plan?.cost || 0;
                    const penaltyFees     = m.fees || 0;
                    const totalOutstanding = membershipFee + penaltyFees;
                    if (!plan && penaltyFees === 0) return null;
                    return (
                      <div style={{ marginTop: 10, padding: "10px 12px", background: totalOutstanding > 0 ? C.redLight : C.gray50, borderRadius: 8, border: `1px solid ${totalOutstanding > 0 ? C.red + "30" : C.gray100}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: totalOutstanding > 0 ? C.red : C.gray600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7 }}>Total Outstanding</div>
                        {membershipFee > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.gray600, marginBottom: 4 }}>
                            <span>Membership Fee</span>
                            <span style={{ fontWeight: 600 }}>₹{membershipFee.toLocaleString()}</span>
                          </div>
                        )}
                        {penaltyFees > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.red, marginBottom: 4 }}>
                            <span>Penalties</span>
                            <span style={{ fontWeight: 600 }}>₹{penaltyFees.toLocaleString()}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: totalOutstanding > 0 ? C.red : C.gray600, borderTop: `1px solid ${totalOutstanding > 0 ? C.red + "20" : C.gray100}`, paddingTop: 6, marginTop: 4 }}>
                          <span>Total Due</span>
                          <span>₹{totalOutstanding.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Quick stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                    {[
                      { label: "Active Loans",  value: activeLoans.length },
                      { label: "Total Borrowed", value: mTxns.length },
                      { label: "Returned",       value: history.length },
                      { label: "Pending Reqs",  value: mRequests.filter(r => r.status === "pending").length },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: C.gray50, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ fontWeight: 800, color: C.green, fontSize: 18 }}>{value}</div>
                        <div style={{ color: C.gray600, fontSize: 11, marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Action buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                    <Btn variant="secondary" icon="edit" onClick={() => openEditMember(m)}>Edit Profile</Btn>
                    {m.status === "pending" && (
                      <Btn variant="primary" icon="check" onClick={() => { setActivateModal({ member: m }); setActivatePlanId((settings.plans || DEFAULT_PLANS)[0]?.id || ""); }}>Activate Member</Btn>
                    )}
                  </div>
                </div>
              </div>

              {/* ── MIDDLE: Borrowing History ── */}
              <div>
                {/* Active Loans */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: "0 0 12px", color: C.green, fontSize: 15, fontWeight: 700 }}>Active Loans ({activeLoans.length})</h3>
                  {activeLoans.length === 0 ? (
                    <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "24px", textAlign: "center", color: C.gray600, fontSize: 13 }}>No active loans.</div>
                  ) : (
                    <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, overflow: "hidden" }}>
                      {activeLoans.map((t, i) => {
                        const bk = books.find(b => b.id === t.bookId);
                        const late = calcLateFee(t.dueDate, settings.fees.lateFeePerDay);
                        return (
                          <div key={t.id} style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center" }}>
                            <div style={{ width: 44, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: C.gray100 }}>
                              {bk?.cover ? <img src={bk.cover} alt={t.bookTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{t.bookTitle}</div>
                              {t.accessionNumber && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>Acc#: {t.accessionNumber}</div>}
                              <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Borrowed: {t.borrowDate} · Due: {t.dueDate}</div>
                              {late > 0 && <div style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>Late fee: ₹{late}</div>}
                            </div>
                            {late > 0 ? <Badge label="Overdue" color={C.red} /> : <Badge label="Active" color={C.greenMid} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pending Requests */}
                {mRequests.filter(r => r.status === "pending").length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 12px", color: C.orange, fontSize: 15, fontWeight: 700 }}>Pending Requests ({mRequests.filter(r => r.status === "pending").length})</h3>
                    <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, overflow: "hidden" }}>
                      {mRequests.filter(r => r.status === "pending").map((r, i) => {
                        const bk = books.find(b => b.id === r.bookId);
                        return (
                          <div key={r.id} style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center" }}>
                            <div style={{ width: 44, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: C.gray100 }}>
                              {bk?.cover ? <img src={bk.cover} alt={r.bookTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{r.bookTitle}</div>
                              <div style={{ fontSize: 12, color: C.gray600 }}>Requested: {r.requestDate}</div>
                            </div>
                            <Badge label="Pending" color={C.orange} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Borrow History */}
                <div>
                  <h3 style={{ margin: "0 0 12px", color: C.gray900, fontSize: 15, fontWeight: 700 }}>Borrow History ({history.length})</h3>
                  {history.length === 0 ? (
                    <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "24px", textAlign: "center", color: C.gray600, fontSize: 13 }}>No borrowing history yet.</div>
                  ) : (
                    <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, overflow: "hidden" }}>
                      {history.map((t, i) => {
                        const bk = books.find(b => b.id === t.bookId);
                        return (
                          <div key={t.id} style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center" }}>
                            <div style={{ width: 44, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: C.gray100 }}>
                              {bk?.cover ? <img src={bk.cover} alt={t.bookTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{t.bookTitle}</div>
                              {t.accessionNumber && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>Acc#: {t.accessionNumber}</div>}
                              <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>{t.borrowDate} → Returned: {t.returnDate}</div>
                              {t.lateFee > 0 && <div style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>Late fee paid: ₹{t.lateFee}</div>}
                            </div>
                            <Badge label="Returned" color={C.greenMid} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ margin: "0 0 12px", color: C.gray900, fontSize: 15, fontWeight: 700 }}>Payment History ({mPayments.length})</h3>
                  {mPayments.length === 0 ? (
                    <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "24px", textAlign: "center", color: C.gray600, fontSize: 13 }}>No payment history yet.</div>
                  ) : (
                    <div className="revenue-tbl-scroll">
                      <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, overflow: "hidden" }}>
                        <div className="revenue-tbl-inner" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: C.gray50, fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase" }}>
                          <span>Date</span><span>Plan</span><span>Amount</span><span>Method</span><span>Type</span><span>Next Fee Month</span>
                        </div>
                        {mPayments.map((p, i) => (
                          <div key={p.id} className="revenue-tbl-inner" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr 1fr 1fr", padding: "12px 16px", borderTop: `1px solid ${C.gray100}`, alignItems: "center", background: i % 2 === 0 ? C.white : C.gray50 }}>
                            <span style={{ fontSize: 13, color: C.gray700 }}>{p.date || "—"}</span>
                            <span style={{ fontSize: 13, color: C.gray700 }}>{p.bookPlan || "—"}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: C.greenMid }}>₹{p.amountPaid.toLocaleString()}</span>
                            <span style={{ fontSize: 13, color: C.gray700 }}>{p.paymentMethod || "—"}</span>
                            <span style={{ fontSize: 13, color: C.gray700 }}>{p.paymentType || "—"}</span>
                            <span style={{ fontSize: 13, color: C.gray700 }}>{p.nextFeeMonth || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {tab === "requests" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: C.green, fontSize: 16, fontWeight: 700 }}>
              Borrow Requests ({(requests || []).filter(r => r.status === "pending").length} pending)
            </h2>
            <Btn size="sm" variant="outline" icon="refresh" onClick={async () => {
              const { data } = await supabase.from("borrow_requests").select("*").order("created_at", { ascending: false });
              if (data) setRequests(data.map(dbToRequest));
              showToast("Requests refreshed.");
            }}>Refresh</Btn>
          </div>
          {(requests || []).length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.gray600 }}>No requests yet.</div>
          ) : (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              {(requests || []).map((req, i) => {
                const book = books.find(b => b.id === req.bookId);
                const reqCopy = req.copyId
                  ? bookCopies.find(c => c.id === req.copyId)
                  : bookCopies.find(c => c.bookId === req.bookId);
                return (
                  <div key={req.id} style={{ display: "flex", gap: 14, padding: "14px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap", background: i % 2 === 0 ? C.white : C.gray50 }}>
                    {/* Book cover */}
                    <div style={{ width: 48, height: 64, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: C.gray100 }}>
                      {book?.cover
                        ? <img src={book.cover} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{req.bookTitle}</div>
                      <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 1 }}>Acc#: {reqCopy?.accessionNumber || book?.accessionNumber || "—"}</div>
                      <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Member: {req.memberName} ({req.memberId})</div>
                      <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Requested: {req.requestDate} · {book ? `${book.available ?? 0} cop${(book.available ?? 0) !== 1 ? "ies" : "y"} available` : "Book not found"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge
                        label={req.status === "pending" ? "Pending" : req.status === "approved" ? "Approved" : "Rejected"}
                        color={req.status === "pending" ? C.orange : req.status === "approved" ? C.greenMid : C.red}
                      />
                      {req.status === "pending" && (
                        <>
                          <Btn size="sm" variant="primary" onClick={async () => {
                            const dueDate = addDays(today(), settings.fees.borrowDays);
                            // Find a specific available copy to assign; fall back to any reserved copy
                            const assignedCopy = req.copyId
                              ? bookCopies.find(c => c.id === req.copyId)
                              : bookCopies.find(c => c.bookId === req.bookId && c.status === "available")
                              || bookCopies.find(c => c.bookId === req.bookId && c.status === "reserved");
                            try {
                              const txnInsert = {
                                member_id: req.memberId, book_id: req.bookId,
                                type: "borrow", due_date: new Date(dueDate).toISOString(), late_fee: 0,
                              };
                              if (assignedCopy) txnInsert.copy_id = assignedCopy.id;
                              const { data: txnData } = await supabase.from("transactions").insert(txnInsert).select().single();
                              const txnId = txnData?.id || ("TXN" + String(Date.now()).slice(-6));
                              // available_copies was already decremented when the request was placed — only update status here
                              await supabase.from("borrow_requests").update({ status: "approved" }).eq("id", req.id);
                              if (assignedCopy) await supabase.from("book_copies").update({ status: "borrowed" }).eq("id", assignedCopy.id);
                              setTransactions(prev => [...prev, { id: txnId, memberId: req.memberId, memberName: req.memberName, bookId: req.bookId, bookTitle: req.bookTitle, borrowDate: today(), dueDate, returnDate: null, lateFee: 0, copyId: assignedCopy?.id, accessionNumber: assignedCopy?.accessionNumber }]);
                            } catch (err) {
                              showToast(`Could not issue book: ${err?.message || "Unknown error"}`, "error");
                              console.error("Approve issue failed:", err);
                              return;
                            }
                            if (assignedCopy) setBookCopies(prev => prev.map(c => c.id === assignedCopy.id ? { ...c, status: "borrowed" } : c));
                            setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
                            showToast(`"${req.bookTitle}" issued to ${req.memberName}. Due: ${dueDate}.`);
                          }}>Approve & Issue</Btn>
                          <Btn size="sm" variant="danger" onClick={async () => {
                            // Increment available_copies back since the request was rejected
                            const reservedCopy = req.copyId ? bookCopies.find(c => c.id === req.copyId) : null;
                            try {
                              await supabase.from("borrow_requests").update({ status: "rejected" }).eq("id", req.id);
                              // Restore the copy count that was decremented when the request was placed
                              const { data: bookRow } = await supabase.from("books").select("available_copies").eq("id", req.bookId).single();
                              if (bookRow) await supabase.from("books").update({ available_copies: (bookRow.available_copies || 0) + 1 }).eq("id", req.bookId);
                              if (reservedCopy) await supabase.from("book_copies").update({ status: "available" }).eq("id", reservedCopy.id);
                            } catch {}
                            if (reservedCopy) setBookCopies(prev => prev.map(c => c.id === reservedCopy.id ? { ...c, status: "available" } : c));
                            setBooks(prev => prev.map(b => b.id === req.bookId ? { ...b, available: (b.available || 0) + 1 } : b));
                            setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
                            showToast(`Request for "${req.bookTitle}" rejected.`, "info");
                          }}>Reject</Btn>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ ACTIVE LOANS TAB ══ */}
      {tab === "loans" && (
        <div>
          <h2 style={{ margin: "0 0 16px", color: C.green, fontSize: 16, fontWeight: 700 }}>Active Loans ({activeLoans.length})</h2>
          {activeLoans.length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.gray600 }}>No active loans.</div>
          ) : (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              {activeLoans.map((t, i) => {
                const late = calcLateFee(t.dueDate, settings.fees.lateFeePerDay);
                const overdue = isOverdue(t.dueDate);
                const loanBook = books.find(b => b.id === t.bookId);
                const loanCopy = t.copyId
                  ? bookCopies.find(c => c.id === t.copyId)
                  : bookCopies.find(c => c.bookId === t.bookId);
                return (
                  <div key={t.id} style={{ display: "flex", gap: 14, padding: "14px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap", background: overdue ? "#FFF5F5" : i % 2 === 0 ? C.white : C.gray50 }}>
                    {/* Book cover */}
                    <div style={{ width: 48, height: 64, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: C.gray100 }}>
                      {loanBook?.cover
                        ? <img src={loanBook.cover} alt={loanBook.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{t.bookTitle}</div>
                      <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 1 }}>Acc#: {loanCopy?.accessionNumber || loanBook?.accessionNumber || "—"}</div>
                      <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Member: {t.memberName} ({t.memberId})</div>
                      <div style={{ fontSize: 12, color: overdue ? C.red : C.gray600, marginTop: 2, fontWeight: overdue ? 700 : 400 }}>
                        Borrowed: {t.borrowDate} · Due: {t.dueDate} {overdue && "⚠ OVERDUE"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {late > 0 && <Badge label={`Late Fee: ₹${late}`} color={C.red} />}
                      <Btn size="sm" variant="ghost" onClick={() => {
                        const loanMember = members.find(m => m.id === t.memberId);
                        setPenaltyModal({ txn: t, member: loanMember, lateAmt: late });
                        setPenaltyExtras({ lateFee: late > 0, lostBook: false, lostBookQty: 1, damagedBook: false, damagedBookQty: 1, cautionDeposit: false });
                        setPenaltyShowQR(false);
                      }}>Penalty</Btn>
                      <Btn size="sm" variant="outline" icon="return" onClick={() => setReturnConfirm(t)}>Mark Returned</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Waitlist reserved — needs librarian action */}
          {(waitlist || []).filter(w => w.status === "reserved").length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ color: C.gold, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Reserved (Awaiting Collection)</h3>
              <div style={{ background: C.white, border: `1px solid ${C.goldDark}`, borderRadius: 12, overflow: "hidden" }}>
                {(waitlist || []).filter(w => w.status === "reserved").map((w, i) => (
                  <div key={w.id} style={{ display: "flex", gap: 14, padding: "12px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: C.green, fontSize: 13 }}>{w.bookTitle}</div>
                      <div style={{ fontSize: 12, color: C.gray600 }}>Reserved for: <strong>{w.memberName}</strong></div>
                      <div style={{ fontSize: 12, color: C.orange }}>Grace deadline: {w.graceDeadline}</div>
                    </div>
                    <Btn size="sm" variant="primary" onClick={async () => {
                      // Librarian issues the book — create transaction
                      const book = books.find(b => b.id === w.bookId);
                      if (!book) return;
                      const dueDate = addDays(today(), settings.fees.borrowDays);
                      const availCopy = bookCopies.find(c => c.bookId === w.bookId && c.status === "available");
                      try {
                        const txnInsert = { member_id: w.memberId, book_id: w.bookId, type: "borrow", due_date: new Date(dueDate).toISOString(), late_fee: 0 };
                        if (availCopy) txnInsert.copy_id = availCopy.id;
                        const { data: txnData, error: txnErr } = await supabase.from("transactions").insert(txnInsert).select().single();
                        if (txnErr) throw txnErr;
                        await supabase.from("books").update({ available_copies: Math.max(0, (book.available || 1) - 1) }).eq("id", w.bookId);
                        await supabase.from("book_waitlist").update({ status: "issued" }).eq("id", w.id);
                        if (availCopy) await supabase.from("book_copies").update({ status: "borrowed" }).eq("id", availCopy.id);
                        setTransactions(prev => [...prev, { id: txnData?.id || ("TXN" + Date.now()), memberId: w.memberId, memberName: w.memberName, bookId: w.bookId, bookTitle: w.bookTitle, borrowDate: today(), dueDate, returnDate: null, lateFee: 0, copyId: availCopy?.id }]);
                      } catch (err) {
                        showToast(`Could not issue: ${err?.message || "Unknown error"}`, "error");
                        return;
                      }
                      setBooks(prev => prev.map(b => b.id === w.bookId ? { ...b, available: b.available - 1 } : b));
                      if (availCopy) setBookCopies(prev => prev.map(c => c.id === availCopy.id ? { ...c, status: "borrowed" } : c));
                      setWaitlist(prev => prev.map(x => x.id === w.id ? { ...x, status: "issued" } : x));
                      reorderWaitlist(w.bookId);
                      showToast(`"${w.bookTitle}" issued to ${w.memberName}. Due: ${dueDate}.`);
                    }}>Issue Book</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ WAITLIST TAB ══ */}
      {tab === "waitlist" && (() => {
        const waiting  = (waitlist || []).filter(w => w.status === "waiting");
        const reserved = (waitlist || []).filter(w => w.status === "reserved");

        // Group waiting entries by book
        const byBook = waiting.reduce((acc, w) => {
          if (!acc[w.bookId]) acc[w.bookId] = { bookTitle: w.bookTitle, bookId: w.bookId, entries: [] };
          acc[w.bookId].entries.push(w);
          return acc;
        }, {});
        const bookGroups = Object.values(byBook).sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));

        return (
          <div>
            <h2 style={{ margin: "0 0 20px", color: C.green, fontSize: 16, fontWeight: 700 }}>
              Waitlist ({waiting.length + reserved.length} active)
            </h2>

            {/* Reserved — needs immediate action */}
            {reserved.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: C.gold, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>
                  Reserved — Awaiting Collection ({reserved.length})
                </h3>
                <div style={{ background: C.white, border: `1px solid ${C.goldDark}`, borderRadius: 12, overflow: "hidden" }}>
                  {reserved.map((w, i) => (
                    <div key={w.id} style={{ display: "flex", gap: 14, padding: "14px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap", background: i % 2 === 0 ? C.white : "#FFFBF0" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{w.bookTitle}</div>
                        <div style={{ fontSize: 13, color: C.gray700, marginTop: 2 }}>Member: <strong>{w.memberName}</strong></div>
                        <div style={{ fontSize: 12, color: C.orange, marginTop: 2 }}>Grace deadline: {w.graceDeadline || "—"}</div>
                      </div>
                      <Badge label="Reserved" color={C.gold} />
                      <Btn size="sm" variant="primary" onClick={async () => {
                        const book = books.find(b => b.id === w.bookId);
                        if (!book) return;
                        const dueDate = addDays(today(), settings.fees.borrowDays);
                        const availCopy = bookCopies.find(c => c.bookId === w.bookId && c.status === "available");
                        try {
                          const txnInsert = { member_id: w.memberId, book_id: w.bookId, type: "borrow", due_date: new Date(dueDate).toISOString(), late_fee: 0 };
                          if (availCopy) txnInsert.copy_id = availCopy.id;
                          const { data: txnData, error: txnErr } = await supabase.from("transactions").insert(txnInsert).select().single();
                          if (txnErr) throw txnErr;
                          await supabase.from("books").update({ available_copies: Math.max(0, (book.available || 1) - 1) }).eq("id", w.bookId);
                          await supabase.from("book_waitlist").update({ status: "issued" }).eq("id", w.id);
                          if (availCopy) await supabase.from("book_copies").update({ status: "borrowed" }).eq("id", availCopy.id);
                          setTransactions(prev => [...prev, { id: txnData?.id || ("TXN" + Date.now()), memberId: w.memberId, memberName: w.memberName, bookId: w.bookId, bookTitle: w.bookTitle, borrowDate: today(), dueDate, returnDate: null, lateFee: 0, copyId: availCopy?.id }]);
                          setBooks(prev => prev.map(b => b.id === w.bookId ? { ...b, available: Math.max(0, b.available - 1) } : b));
                          if (availCopy) setBookCopies(prev => prev.map(c => c.id === availCopy.id ? { ...c, status: "borrowed" } : c));
                          setWaitlist(prev => prev.map(x => x.id === w.id ? { ...x, status: "issued" } : x));
                          showToast(`"${w.bookTitle}" issued to ${w.memberName}. Due: ${dueDate}.`);
                        } catch (err) {
                          showToast(`Could not issue: ${err?.message || "Unknown error"}`, "error");
                        }
                      }}>Issue Book</Btn>
                      <Btn size="sm" variant="outline" onClick={async () => {
                        try {
                          await supabase.from("book_waitlist").update({ status: "expired" }).eq("id", w.id);
                          setWaitlist(prev => prev.map(x => x.id === w.id ? { ...x, status: "expired" } : x));
                          showToast(`Reservation for ${w.memberName} expired.`, "info");
                        } catch {}
                      }}>Expire</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting queue — grouped by book */}
            {bookGroups.length === 0 && reserved.length === 0 ? (
              <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.gray600 }}>
                No active waitlist entries.
              </div>
            ) : bookGroups.length > 0 && (
              <div>
                <h3 style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>
                  Waiting Queue ({waiting.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {bookGroups.map(group => (
                    <div key={group.bookId} style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "12px 18px", background: C.gray50, borderBottom: `1px solid ${C.gray100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{group.bookTitle}</span>
                        <Badge label={`${group.entries.length} waiting`} color={C.orange} />
                      </div>
                      {group.entries.sort((a, b) => a.position - b.position).map((w, i) => (
                        <div key={w.id} style={{ display: "flex", gap: 14, padding: "12px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.greenLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: C.green, flexShrink: 0 }}>
                            {w.position}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: C.gray900, fontSize: 13 }}>{w.memberName}</div>
                            <div style={{ fontSize: 12, color: C.gray600, marginTop: 1 }}>Joined: {w.joinedAt || "—"}</div>
                          </div>
                          <Btn size="sm" variant="outline" onClick={async () => {
                            try {
                              await supabase.from("book_waitlist").update({ status: "cancelled" }).eq("id", w.id);
                              setWaitlist(prev => prev.filter(x => x.id !== w.id));
                              showToast(`${w.memberName} removed from waitlist.`, "info");
                            } catch {}
                          }}>Remove</Btn>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ RENEWALS TAB ══ */}
      {tab === "renewals" && (() => {
        const libraryUpi = localSettings.library?.upiId || settings.library?.upiId || "";
        const makeUpiLink = (plan, member) => {
          if (!libraryUpi || !plan) return null;
          const amount = member.totalOutstanding || plan.cost;
          const dueDate = new Date(member.renewalDue || today());
          const monthLabel = dueDate.toLocaleString("en-IN", { month: "short" }) + "-" + String(dueDate.getFullYear()).slice(2);
          const note = encodeURIComponent(`${member.membershipId || member.id}-${monthLabel}`);
          return `upi://pay?pa=${encodeURIComponent(libraryUpi)}&am=${amount}&tn=${note}&cu=INR`;
        };
        const makeWhatsAppLink = (m, plan) => {
          const phone = (m.phone || "").replace(/\D/g, "");
          if (!phone) return null;
          const upiLink = makeUpiLink(plan, m);
          const dueDate = new Date(m.renewalDue || today());
          const monthLabel = dueDate.toLocaleString("en-IN", { month: "short" }) + " " + dueDate.getFullYear();
          const amountLine = m.overdueMonths > 0
            ? `Overdue: ₹${m.overdueAmount.toLocaleString()} (${m.overdueMonths} month${m.overdueMonths > 1 ? "s" : ""}) + This month: ₹${m.dueThisMonthAmount.toLocaleString()}\n*Total Due: ₹${m.totalOutstanding.toLocaleString()}*`
            : `Amount: *₹${m.dueThisMonthAmount}/month*`;
          const msg = `Hi ${m.name.split(" ")[0]}, your *${plan?.name || "membership"}* at *${localSettings.library?.name || "the library"}* is due for renewal on *${m.renewalDue}* (${monthLabel}).\n\n${amountLine}\n\n${upiLink ? `Pay now 👇\n${upiLink}\n\n` : ""}Pay using the UPI id shared to avoid Late fees and Notify the Librarian after payment. Thanks!! 🙏`;
          return `https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encodeURIComponent(msg)}`;
        };
        const renderRow = (m, i) => {
          const plan = resolvePlan(m.plan);
          const diff = daysDiff(m.renewalDue);
          const overdue = diff < 0;
          const waLink = makeWhatsAppLink(m, plan);
          return (
            <div key={m.id} style={{ display: "flex", gap: 14, padding: "14px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap", background: overdue ? "#FFF5F5" : i % 2 === 0 ? C.white : C.gray50 }}>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: overdue ? C.red : C.greenLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>{m.name.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, color: C.gray900, fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: C.gray600 }}>{m.email}{m.phone ? ` · ${m.phone}` : ""}</div>
                <div style={{ fontSize: 12, marginTop: 3 }}>
                  <span style={{ fontWeight: 600, color: C.blue }}>{plan?.name || "Unknown Plan"}</span>
                  <span style={{ color: C.gray600 }}> · ₹{plan?.cost || "—"}/month</span>
                </div>
              </div>
              {/* ── Fee Paid pop-out ── */}
              {m.renewalRequestedAt && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#fff7e6,#ffe4b3)", border: "2px solid #E67E22", borderRadius: 10, padding: "10px 14px", minWidth: 210, boxShadow: "0 2px 12px rgba(230,126,34,.25)" }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>💰</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#B7611A", lineHeight: 1.2 }}>Membership Fee Paid</div>
                    <div style={{ fontSize: 11, color: "#7D4E1A", marginTop: 2 }}>Review &amp; Renew</div>
                  </div>
                  <button
                    onClick={() => setRenewModal({ member: m, plan })}
                    style={{ background: "#E67E22", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    Renew Now
                  </button>
                </div>
              )}
              <div style={{ textAlign: "right", minWidth: 160 }}>
                <div style={{ fontSize: 12, color: C.gray600 }}>Due: <strong>{m.renewalDue}</strong></div>
                {overdue
                  ? <div style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>{Math.abs(diff)}d overdue</div>
                  : diff === 0
                    ? <div style={{ fontSize: 12, color: "#E67E22", fontWeight: 700 }}>Due Today</div>
                    : <div style={{ fontSize: 12, color: "#E67E22", fontWeight: 600 }}>In {diff} day{diff !== 1 ? "s" : ""}</div>
                }
                {m.overdueMonths > 0 && (
                  <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>
                    ₹{m.overdueAmount.toLocaleString()} overdue + ₹{m.dueThisMonthAmount.toLocaleString()} this month
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 800, color: C.gray900, marginTop: 2 }}>
                  Total ₹{m.totalOutstanding.toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "#25D366", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none", border: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                )}
                <Btn size="sm" variant="primary" icon="rupee" onClick={() => setRenewModal({ member: m, plan })}>
                  Collect &amp; Renew
                </Btn>
              </div>
            </div>
          );
        };

        return (
          <div>
            {/* Summary stats — click to filter */}
            <div className="renewals-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
              <div style={{ background: renewalFilter === "overdue" ? C.red : C.redLight, border: `2px solid ${C.red}`, borderRadius: 12, padding: "16px 20px", textAlign: "center", cursor: "pointer", transition: "all .15s" }}
                onClick={() => setRenewalFilter(renewalFilter === "overdue" ? null : "overdue")}>
                <div style={{ fontSize: 28, fontWeight: 800, color: renewalFilter === "overdue" ? C.white : C.red }}>{renewalOverdue.length}</div>
                <div style={{ fontSize: 12, color: renewalFilter === "overdue" ? C.white : C.red, fontWeight: 700, marginTop: 4 }}>Overdue {renewalFilter === "overdue" ? "✓" : ""}</div>
              </div>
              <div style={{ background: renewalFilter === "pending" ? "#E67E22" : "#FEF9E7", border: "2px solid #E67E22", borderRadius: 12, padding: "16px 20px", textAlign: "center", cursor: "pointer", transition: "all .15s" }}
                onClick={() => setRenewalFilter(renewalFilter === "pending" ? null : "pending")}>
                <div style={{ fontSize: 28, fontWeight: 800, color: renewalFilter === "pending" ? C.white : "#E67E22" }}>{renewalDueSoon.length}</div>
                <div style={{ fontSize: 12, color: renewalFilter === "pending" ? C.white : "#E67E22", fontWeight: 700, marginTop: 4 }}>Pending Renewals {renewalFilter === "pending" ? "✓" : ""}</div>
              </div>
              <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.blue }}>
                  ₹{renewalDueMembers.reduce((s, m) => s + m.totalOutstanding, 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, marginTop: 4 }}>Pending Revenue</div>
              </div>
            </div>

            {/* Active filter pill */}
            {renewalFilter && (
              <div style={{ marginBottom: 14 }}>
                <button onClick={() => setRenewalFilter(null)} style={{ background: C.gray100, border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: C.gray600, cursor: "pointer", fontFamily: "inherit" }}>
                  ✕ Clear filter — showing all
                </button>
              </div>
            )}

            {(renewalFilter === null || renewalFilter === "overdue") && renewalOverdue.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: C.red, fontSize: 14, fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  Overdue ({renewalOverdue.length})
                </h3>
                <div style={{ background: C.white, border: `1px solid ${C.red}40`, borderRadius: 12, overflow: "hidden" }}>
                  {renewalOverdue.map(renderRow)}
                </div>
              </div>
            )}

            {(renewalFilter === null || renewalFilter === "pending") && renewalDueSoon.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: "#E67E22", fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>
                  Due This Week ({renewalDueSoon.length})
                </h3>
                <div style={{ background: C.white, border: "1px solid #E67E2240", borderRadius: 12, overflow: "hidden" }}>
                  {renewalDueSoon.map(renderRow)}
                </div>
              </div>
            )}

            {renewalDueMembers.length === 0 && (
              <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ fontWeight: 700, color: C.green, fontSize: 16, marginBottom: 6 }}>All memberships are up to date!</div>
                <div style={{ color: C.gray600, fontSize: 13 }}>No renewals due in the next 7 days.</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ PAYMENTS TAB ══ */}
      {tab === "payments" && (() => {
        const q = paymentSearch.trim().toLowerCase();
        const thisMonthKey = new Date().toISOString().slice(0, 7);
        const matchesSearch = (p, member) => {
          if (!q) return true;
          const haystack = [
            p.memberId, member?.name, p.childMemberName,
            p.bookPlan, p.paymentMethod, p.paymentType,
            p.nextFeeMonth, p.fromAccount, p.panNo, p.date,
          ].filter(Boolean).join(" ").toLowerCase();
          return haystack.includes(q);
        };
        const renderPaymentsTable = (list, emptyMessage) => (
          list.length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: C.green + "18", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="rupee" size={30} color={C.green} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginBottom: 8 }}>No Payments Found</div>
              <div style={{ fontSize: 14, color: C.gray600, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>{emptyMessage}</div>
            </div>
          ) : (
            <div className="revenue-tbl-scroll">
              <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
                <div className="revenue-tbl-inner" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.5fr 1fr 0.9fr 1fr 1fr 1fr", padding: "10px 18px", background: C.gray50, fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase" }}>
                  <span>Date</span><span>Member</span><span>Plan</span><span>Amount</span><span>Method</span><span>Type</span><span>Next Fee Month</span>
                </div>
                {list.map((p, i) => {
                  const member = members.find(m => m.membershipId === p.memberId);
                  return (
                    <div key={p.id} className="revenue-tbl-inner" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.5fr 1fr 0.9fr 1fr 1fr 1fr", padding: "12px 18px", borderTop: `1px solid ${C.gray100}`, alignItems: "center", background: i % 2 === 0 ? C.white : C.gray50 }}>
                      <span style={{ fontSize: 13, color: C.gray700 }}>{p.date || "—"}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: C.green, fontSize: 13 }}>{member?.name || p.childMemberName || "—"}</div>
                        <div style={{ fontSize: 11, color: C.gray600 }}>{p.memberId}</div>
                      </div>
                      <span style={{ fontSize: 13, color: C.gray700 }}>{p.bookPlan || "—"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.greenMid }}>₹{p.amountPaid.toLocaleString()}</span>
                      <span style={{ fontSize: 13, color: C.gray700 }}>{p.paymentMethod || "—"}</span>
                      <span style={{ fontSize: 13, color: C.gray700 }}>{p.paymentType || "—"}</span>
                      <span style={{ fontSize: 13, color: C.gray700 }}>{p.nextFeeMonth || "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        );

        const pillStyle = (active) => ({
          background: active ? C.green : C.white, color: active ? C.white : C.gray600,
          border: `1px solid ${active ? C.green : C.gray200}`, borderRadius: 20, padding: "7px 16px",
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        });

        return (
          <div>
            <h2 style={{ margin: "0 0 6px", color: C.green, fontSize: 16, fontWeight: 700 }}>Payments</h2>
            <p style={{ color: C.gray600, fontSize: 13, margin: "0 0 16px" }}>Track membership fee payments collected from members.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button style={pillStyle(paymentsSubTab === "received")} onClick={() => setPaymentsSubTab("received")}>Payments Received</button>
              <button style={pillStyle(paymentsSubTab === "history")} onClick={() => setPaymentsSubTab("history")}>Payment History</button>
            </div>

            {paymentsSubTab === "received" ? (() => {
              const paymentsThisMonth = (payments || []).filter(p => p.date?.slice(0, 7) === thisMonthKey)
                .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
              const filtered = paymentsThisMonth.filter(p => matchesSearch(p, members.find(m => m.membershipId === p.memberId)));
              const thisMonthCollected = paymentsThisMonth.reduce((s, p) => s + p.amountPaid, 0);
              const thisMonthPayerCount = new Set(paymentsThisMonth.map(p => p.memberId)).size;
              return (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
                    <StatCard label="Payments This Month" value={paymentsThisMonth.length} icon="rupee" color={C.green} />
                    <StatCard label="Members Paid" value={thisMonthPayerCount} icon="users" color={C.blue} />
                    <StatCard label="Total Collected" value={`₹${thisMonthCollected.toLocaleString()}`} icon="check" color={C.greenMid} />
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <Input placeholder="Search member, plan, method (e.g. 2 Books)…" value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} />
                  </div>
                  {renderPaymentsTable(filtered, "Payments recorded this month will show up here.")}
                </div>
              );
            })() : (() => {
              const monthOptions = Array.from(new Set((payments || []).map(p => p.date ? p.date.slice(0, 7) : null).filter(Boolean))).sort().reverse();
              const allFiltered = (payments || [])
                .filter(p => !paymentMonthFilter || p.date?.slice(0, 7) === paymentMonthFilter)
                .filter(p => matchesSearch(p, members.find(m => m.membershipId === p.memberId)))
                .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
              const totalFiltered = allFiltered.reduce((s, p) => s + p.amountPaid, 0);
              return (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
                    <StatCard label="Total Payments" value={(payments || []).length.toLocaleString()} icon="rupee" color={C.green} />
                    <StatCard label={paymentMonthFilter || q ? "Filtered Total" : "All-Time Collected"} value={`₹${totalFiltered.toLocaleString()}`} icon="check" color={C.greenMid} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <Input placeholder="Search member, plan, method, month (e.g. Jun-26, 2 Books)…" value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} />
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <Select value={paymentMonthFilter} onChange={e => setPaymentMonthFilter(e.target.value)} options={[{ value: "", label: "All Months" }, ...monthOptions.map(mo => ({ value: mo, label: mo }))]} />
                    </div>
                  </div>
                  {renderPaymentsTable(allFiltered, "Payment records will appear here once they're collected and synced from the payments table.")}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ══ CUSTOMIZE TAB ══ */}
      {tab === "customize" && (
        <div>
          <h2 style={{ margin: "0 0 6px", color: C.green, fontSize: 16, fontWeight: 700 }}>Customize Homepage</h2>
          <p style={{ color: C.gray600, fontSize: 13, margin: "0 0 20px" }}>Toggle sections on/off and rename them. Changes apply instantly.</p>

          <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {Object.entries(localSettings.sections).map(([key, val]) => (
              <div key={key} style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <Toggle value={val.enabled} onChange={v => updateSection(key, "enabled", v)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.gray600, marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Section Label</div>
                  <input value={val.label} onChange={e => updateSection(key, "label", e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", background: val.enabled ? C.white : C.gray50, color: val.enabled ? C.gray900 : C.gray300, boxSizing: "border-box" }}
                    disabled={!val.enabled} />
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Browse Menu Items</h3>
          <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {Object.entries(localSettings.browseMenu).map(([key, val]) => (
              <div key={key} style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <Toggle value={val.enabled} onChange={v => updateBrowse(key, "enabled", v)} />
                <input value={val.label} onChange={e => updateBrowse(key, "label", e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                  disabled={!val.enabled} />
              </div>
            ))}
          </div>

          <h3 style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Library Information</h3>
          <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "18px 20px" }}>
            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Object.entries(localSettings.library).filter(([key]) => !["upiId","renewalReminderDays"].includes(key)).map(([key, val]) => (
                <div key={key} style={{ gridColumn: key === "tagline" || key === "address" ? "1 / -1" : "auto" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{key}</label>
                  {key === "tagline" ? (
                    <textarea value={val} onChange={e => updateLibrary(key, e.target.value)} rows={2}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                  ) : (
                    <input value={val} onChange={e => updateLibrary(key, e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Catalogue ID Field Configuration */}
          <h3 style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: "28px 0 6px" }}>Catalogue ID — Field Configuration</h3>
          <p style={{ color: C.gray600, fontSize: 13, margin: "0 0 14px" }}>Choose which fields are included when auto-generating the Catalogue ID for a book.</p>
          <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "16px 20px", maxWidth: 480 }}>
            {[
              { key: "catalogueNo", label: "Catalogue No",  example: "001"  },
              { key: "genre",       label: "Genre (abbr.)", example: "EI"   },
              { key: "language",    label: "Language",      example: "T"    },
              { key: "colorCode",   label: "Color Code",    example: "R"    },
            ].map(({ key, label, example }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Toggle value={catIdFields[key]} onChange={v => {
                  const updated = { ...catIdFields, [key]: v };
                  setCatIdFields(updated);
                  const newSettings = { ...localSettings, catalogueIdFields: updated };
                  setLocalSettings(newSettings); onSettings(newSettings);
                }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.gray900 }}>{label}</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", background: C.gray50, border: `1px solid ${C.gray100}`, borderRadius: 4, padding: "2px 7px", color: C.gray600 }}>e.g. "{example}"</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: "10px 14px", background: C.gray50, borderRadius: 8, border: `1px solid ${C.gray100}` }}>
              <span style={{ fontSize: 12, color: C.gray600 }}>Preview: </span>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: C.green }}>
                {buildCatalogueId({ catalogueNo: "001", genre: "Epic / Mythology", language: "Tamil", colorCode: "R" }, catIdFields) || "—"}
              </span>
            </div>
          </div>

          {/* Color Code Legend */}
          <h3 style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: "28px 0 12px" }}>Color Code Legend</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {COLOR_CODES.map(c => (
              <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 10, background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: c.hex, flexShrink: 0, border: "1px solid rgba(0,0,0,.12)" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gray900 }}>{c.label} <span style={{ fontFamily: "monospace", color: C.gray600, fontWeight: 400 }}>({c.code})</span></div>
              </div>
            ))}
          </div>

          {/* Save Settings */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.gray100}` }}>
            <Btn variant="primary" icon="check" onClick={saveSettings}>Save Settings</Btn>
          </div>
        </div>
      )}

      {/* ══ FEE SETTINGS TAB ══ */}
      {tab === "fees" && (
        <div>
          <h2 style={{ margin: "0 0 6px", color: C.green, fontSize: 16, fontWeight: 700 }}>Fee Configuration</h2>
          <p style={{ color: C.gray600, fontSize: 13, margin: "0 0 20px" }}>All amounts in Indian Rupees (₹). Changes apply to new transactions.</p>
          <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: "20px 24px", maxWidth: 500 }}>
            {[
              { key: "lateFeePerDay",    label: "Late Return Fee",         suffix: "/ day" },
              { key: "bookDamageFee",    label: "Book Damage Fee",         suffix: ""      },
              { key: "bookLostFee",      label: "Book Lost Fee",           suffix: ""      },
              { key: "cautionDeposit",   label: "One Time Registration Fee", suffix: ""      },
              { key: "borrowDays",       label: "Default Borrow Period",   suffix: "days"  },
              { key: "gracePeriodDays",  label: "Waitlist Grace Period",   suffix: "days"  },
            ].map(({ key, label, suffix }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.gray100}` }}>
                <label style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.gray900 }}>{label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, color: C.gray600 }}>{!["borrowDays","gracePeriodDays"].includes(key) ? "₹" : ""}</span>
                  <input type="number" value={localSettings.fees[key]} onChange={e => updateFee(key, e.target.value)} min="0"
                    style={{ width: 80, padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", textAlign: "center" }} />
                  {suffix && <span style={{ fontSize: 12, color: C.gray600, whiteSpace: "nowrap" }}>{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Btn variant="primary" onClick={saveFees}>Save Fee Settings</Btn>
          </div>

          {/* ── UPI & RENEWAL SETTINGS ── */}
          <h2 style={{ color: C.green, fontSize: 16, fontWeight: 700, margin: "32px 0 6px" }}>UPI &amp; Renewal Reminders</h2>
          <p style={{ color: C.gray600, fontSize: 13, margin: "0 0 14px" }}>Library UPI ID is pre-filled in payment links sent to members for membership renewal.</p>
          <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: "18px 20px", marginBottom: 8 }}>
            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Library UPI ID</label>
                <input value={localSettings.library?.upiId || ""} onChange={e => updateLibrary("upiId", e.target.value)}
                  placeholder="libraryname@upi or 9944411121@paytm"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ fontSize: 11, color: C.gray600, marginTop: 4 }}>e.g. arivagam@ybl or 9944411121@paytm</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Send Reminder (days before due)</label>
                <input type="number" min={1} max={30} value={localSettings.library?.renewalReminderDays || 5} onChange={e => updateLibrary("renewalReminderDays", parseInt(e.target.value) || 5)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ fontSize: 11, color: C.gray600, marginTop: 4 }}>Members see renewal banner &amp; automated email this many days before due</div>
              </div>
            </div>
            {localSettings.library?.upiId && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: C.blueLight, borderRadius: 8, fontSize: 12, color: C.blue }}>
                <strong>Preview:</strong> upi://pay?pa={localSettings.library.upiId}&amp;am=300&amp;tn=Apr-26+Renewal
              </div>
            )}
          </div>
          <div style={{ marginBottom: 28 }}>
            <Btn variant="primary" onClick={saveFees}>Save UPI Settings</Btn>
          </div>

          {/* ── MEMBERSHIP PLANS ── */}
          <h2 style={{ color: C.green, fontSize: 16, fontWeight: 700, margin: "32px 0 6px" }}>Membership Plans</h2>
          <p style={{ color: C.gray600, fontSize: 13, margin: "0 0 16px" }}>Define plans with borrow limits and monthly cost.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 500 }}>
            {(localSettings.plans || DEFAULT_PLANS).map((plan, idx) => {
              const isEditing = editingPlanId === plan.id;
              return (
                <div key={plan.id} style={{ background: C.white, border: `1px solid ${isEditing ? C.green : C.gray100}`, borderRadius: 10, padding: "12px 16px", transition: "border .15s" }}>
                  {isEditing ? (
                    <div>
                      <input value={plan.name} onChange={e => { const plans = [...(localSettings.plans || DEFAULT_PLANS)]; plans[idx] = { ...plan, name: e.target.value }; setLocalSettings(s => ({ ...s, plans })); }}
                        style={{ fontWeight: 700, color: C.green, fontSize: 14, border: "none", borderBottom: `1px solid ${C.gray300}`, outline: "none", background: "transparent", width: "100%", marginBottom: 10 }} placeholder="Plan name" />
                      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                        <label style={{ fontSize: 12, color: C.gray600 }}>Borrow limit:
                          <input type="number" min="0" max="20" value={plan.borrowLimit} onChange={e => { const plans = [...(localSettings.plans || DEFAULT_PLANS)]; plans[idx] = { ...plan, borrowLimit: parseInt(e.target.value) || 0 }; setLocalSettings(s => ({ ...s, plans })); }}
                            style={{ width: 48, marginLeft: 6, padding: "3px 6px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 12, textAlign: "center" }} />
                        </label>
                        <label style={{ fontSize: 12, color: C.gray600 }}>₹/month:
                          <input type="number" min="0" value={plan.cost} onChange={e => { const plans = [...(localSettings.plans || DEFAULT_PLANS)]; plans[idx] = { ...plan, cost: parseInt(e.target.value) || 0 }; setLocalSettings(s => ({ ...s, plans })); }}
                            style={{ width: 70, marginLeft: 6, padding: "3px 6px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 12, textAlign: "center" }} />
                        </label>
                        <label style={{ fontSize: 12, color: C.gray600 }}>Refundable Deposit ₹:
                          <input type="number" min="0" value={plan.refundableDeposit || 0} onChange={e => { const plans = [...(localSettings.plans || DEFAULT_PLANS)]; plans[idx] = { ...plan, refundableDeposit: parseInt(e.target.value) || 0 }; setLocalSettings(s => ({ ...s, plans })); }}
                            style={{ width: 70, marginLeft: 6, padding: "3px 6px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 12, textAlign: "center" }} />
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn size="sm" variant="primary" onClick={() => setEditingPlanId(null)}>Done</Btn>
                        <Btn size="sm" variant="danger" onClick={() => { const plans = (localSettings.plans || DEFAULT_PLANS).filter((_, i) => i !== idx); setLocalSettings(s => ({ ...s, plans })); setEditingPlanId(null); }}>Delete</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{plan.name}</div>
                        <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>
                          {plan.inhouseOnly
                            ? "Walk-in reading only · No borrowing · No monthly fee"
                            : `Borrow up to ${plan.borrowLimit} book${plan.borrowLimit > 1 ? "s" : ""} · ₹${plan.cost}/month${plan.refundableDeposit ? ` · Deposit ₹${plan.refundableDeposit}` : ""}`}
                        </div>
                      </div>
                      <button onClick={() => setEditingPlanId(plan.id)} style={{ background: C.blueLight, border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 6 }} title="Edit plan"><Icon name="edit" size={13} color={C.blue} /></button>
                    </div>
                  )}
                </div>
              );
            })}
            <Btn variant="outline" icon="plus" onClick={() => { const newPlan = { id: `plan-${Date.now()}`, name: "New Plan", borrowLimit: 2, cost: 0, refundableDeposit: 0 }; const plans = [...(localSettings.plans || DEFAULT_PLANS), newPlan]; setLocalSettings(s => ({ ...s, plans })); setEditingPlanId(newPlan.id); }}>Add Plan</Btn>
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="primary" onClick={saveSettings}>Save Plans</Btn>
          </div>
        </div>
      )}

      {/* ══ LIBRARIANS TAB (Admin only) ══ */}
      {tab === "librarians" && isAdmin && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: C.green, fontSize: 16, fontWeight: 700 }}>Librarians ({librarians.length})</h2>
            <Btn variant="primary" icon="plus" onClick={() => { setLibForm(emptyLib); setEditLib(null); setShowLibForm(true); }}>Add Librarian</Btn>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
            {librarians.map((l, i) => (
              <div key={l.id} style={{ display: "flex", gap: 12, padding: "14px 18px", borderTop: i > 0 ? `1px solid ${C.gray100}` : "none", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, background: C.green + "20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="user" size={18} color={C.green} />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: C.gray600 }}>{l.email} · {l.branch} Branch</div>
                  <div style={{ fontSize: 11, color: C.gray600 }}>Joined: {l.joined}</div>
                </div>
                <Badge label={l.id} color={C.gray600} />
                <Badge label={l.status} color={l.status === "active" ? C.greenMid : C.orange} />
                <button onClick={() => { setEditLib(l); setLibForm({ name: l.name, email: l.email, phone: l.phone || "", branch: l.branch, status: l.status, password: l.password || "" }); setShowLibForm(true); }} style={{ background: C.blueLight, border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 6 }}><Icon name="edit" size={13} color={C.blue} /></button>
                <button onClick={() => deleteLib(l.id)} style={{ background: C.redLight, border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 6 }}><Icon name="trash" size={13} color={C.red} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ REVENUE TAB (Admin only) ══ */}
      {tab === "revenue" && isAdmin && (() => {
        const planMap = Object.fromEntries((settings.plans || DEFAULT_PLANS).map(p => [p.id, p]));
        const now = new Date();

        // Build last 12 months of revenue data from DB state
        const revenueData = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
          const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const monthLabel = d.toLocaleString("en-IN", { month: "short" }) + " " + d.getFullYear();

          // Expected = plan cost × members who were active (joined on or before month end)
          const expected = members.reduce((sum, m) => {
            if (!m.plan || !m.joined) return sum;
            const joined = new Date(m.joined);
            if (joined > monthEnd) return sum;
            return sum + (planMap[m.plan]?.cost || 0);
          }, 0);

          // Collected membership = plan cost for members who first joined OR renewed in this month
          const membershipCollected = members.reduce((sum, m) => {
            if (!m.plan) return sum;
            const cost = planMap[m.plan]?.cost || 0;
            const joinedDate   = m.joined        ? new Date(m.joined)        : null;
            const renewedDate  = m.planRenewedAt ? new Date(m.planRenewedAt) : null;
            const joinedInMonth  = joinedDate  && joinedDate  >= monthStart && joinedDate  <= monthEnd;
            const renewedInMonth = renewedDate && renewedDate >= monthStart && renewedDate <= monthEnd;
            return sum + (joinedInMonth || renewedInMonth ? cost : 0);
          }, 0);

          // Collected late fees = late_fee from transactions returned this month
          const lateFeesCollected = transactions.reduce((sum, t) => {
            if (!t.returnDate || !t.lateFee) return sum;
            const ret = new Date(t.returnDate);
            return sum + (ret >= monthStart && ret <= monthEnd ? (t.lateFee || 0) : 0);
          }, 0);

          return { month: monthLabel, expected, collected: membershipCollected + lateFeesCollected, membership: membershipCollected, lateFees: lateFeesCollected };
        });

        const ytdStart = new Date(now.getFullYear(), 0, 1);
        const ytdData  = revenueData.filter((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return d >= ytdStart;
        });
        const totalExpected  = ytdData.reduce((s, r) => s + r.expected, 0);
        const totalCollected = ytdData.reduce((s, r) => s + r.collected, 0);
        const outstanding    = members.reduce((s, m) => s + (m.fees || 0), 0);

        return (
          <div>
            <h2 style={{ margin: "0 0 20px", color: C.green, fontSize: 16, fontWeight: 700 }}>Revenue Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Expected (YTD)" value={`₹${totalExpected.toLocaleString()}`} icon="money" color={C.green} />
              <StatCard label="Total Collected (YTD)" value={`₹${totalCollected.toLocaleString()}`} icon="check" color={C.greenMid} />
              <StatCard label="Outstanding Fees" value={`₹${outstanding.toLocaleString()}`} icon="alert" color={C.orange} />
            </div>
            <div className="revenue-tbl-scroll">
            <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, overflow: "hidden" }}>
              <div className="revenue-tbl-inner" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.5fr", padding: "10px 18px", background: C.gray50, fontSize: 11, fontWeight: 700, color: C.gray600, textTransform: "uppercase" }}>
                <span>Month</span><span>Expected</span><span>Membership</span><span>Late Fees</span><span>Collection %</span>
              </div>
              {revenueData.map((r, i) => {
                const pct = r.expected > 0 ? Math.round((r.collected / r.expected) * 100) : 0;
                return (
                  <div key={r.month} className="revenue-tbl-inner" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.5fr", padding: "14px 18px", borderTop: `1px solid ${C.gray100}`, alignItems: "center", background: i % 2 === 0 ? C.white : C.gray50 }}>
                    <span style={{ fontWeight: 600, color: C.green, fontSize: 14 }}>{r.month}</span>
                    <span style={{ fontSize: 14, color: C.gray900 }}>₹{r.expected.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: C.gray700 }}>₹{r.membership.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: r.lateFees > 0 ? C.orange : C.gray600 }}>₹{r.lateFees.toLocaleString()}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 10, background: C.gray100, borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 100 ? C.greenMid : pct >= 80 ? C.gold : C.orange, borderRadius: 5, transition: "width .4s" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.gray600, minWidth: 32 }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>{/* /revenue-tbl-scroll */}
          </div>
        );
      })()}

      {/* ══ BRANCHES TAB (Admin only) ══ */}
      {tab === "branches" && isAdmin && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: C.green, fontSize: 16, fontWeight: 700 }}>Branch Management</h2>
            <Btn variant="primary" icon="plus" onClick={() => setShowBranchForm(true)}>New Branch</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {branches.map(b => (
              <div key={b.id} style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 12, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.green, fontSize: 16, marginBottom: 4 }}>{b.name}</div>
                    <div style={{ fontSize: 13, color: C.gray600, marginBottom: 8, maxWidth: 480 }}>{b.address}</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: C.gray600 }}>📚 {b.books} books</span>
                      <span style={{ fontSize: 13, color: C.gray600 }}>👥 {b.members} members</span>
                      <span style={{ fontSize: 13, color: C.gray600 }}>Librarian: {b.librarian}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge label={b.status} color={C.greenMid} />
                    <Btn size="sm" variant="outline" icon="settings">Manage</Btn>
                  </div>
                </div>
              </div>
            ))}
            {/* New branch CTA */}
            <div style={{ background: C.gold + "15", border: `2px dashed ${C.gold}`, borderRadius: 12, padding: "28px", textAlign: "center" }}>
              <Icon name="branch" size={32} color={C.goldDark} />
              <h3 style={{ color: C.green, margin: "12px 0 8px" }}>Expand to a New Branch</h3>
              <p style={{ color: C.gray600, margin: "0 0 16px", fontSize: 13, lineHeight: 1.6, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>Each branch gets its own portal connected to this main admin. Books, members, and data sync automatically via Supabase.</p>
              <Btn variant="secondary" icon="plus" onClick={() => setShowBranchForm(true)}>Create New Branch</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Book form */}
      <Modal open={showBookForm} onClose={() => { setShowBookForm(false); setEditBook(null); }} title={editBook ? "Edit Book" : "Add New Book"} width={580}>
        <div className="book-form-grid">
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Book Title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} placeholder="e.g. Ponniyin Selvan" required />
          </div>
          <Input label="Author" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} placeholder="Author name" required />
          <Select label="Genre" value={bookForm.genre} onChange={e => { const upd = { ...bookForm, genre: e.target.value }; setBookForm(rebuildComputed(upd, catIdFields)); }} options={GENRES} required />
          <Input label="Year Published" type="number" value={bookForm.year} onChange={e => setBookForm({ ...bookForm, year: e.target.value })} placeholder="e.g. 1950" />
          <Select label="Language" value={bookForm.language} onChange={e => { const upd = { ...bookForm, language: e.target.value }; setBookForm(rebuildComputed(upd, catIdFields)); }} options={LANGUAGES} />

          {/* ISBN */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>ISBN</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                onKeyDown={e => e.key === "Enter" && lookupISBN(bookForm.isbn)}
                placeholder="ISBN-10 or ISBN-13"
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: C.white, color: C.gray900 }}
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e => e.target.style.borderColor = C.gray300} />
              <Btn variant="outline" size="sm" onClick={() => lookupISBN(bookForm.isbn)} disabled={isbnLoading}>
                {isbnLoading ? "…" : "Lookup"}
              </Btn>
              <button onClick={startScanner} title="Scan barcode"
                style={{ padding: "0 10px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="barcode" size={18} color={C.green} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: C.gray600, margin: "4px 0 0" }}>Enter ISBN and press Enter or click Lookup to auto-fill · or scan a barcode</p>
          </div>

          <Input label="Number of Copies" type="number" value={bookForm.copies} onChange={e => setBookForm({ ...bookForm, copies: e.target.value })} min="1" />

          <Input label="Age Group" type="number" min="0" value={bookForm.ageGroup} onChange={e => { const upd = { ...bookForm, ageGroup: e.target.value }; setBookForm(rebuildComputed(upd, catIdFields)); }} placeholder="e.g. 8 (years)" />
          <Input label="Category" value={bookForm.category} onChange={e => { const val = e.target.value.slice(0, 2); const upd = { ...bookForm, category: val }; setBookForm(rebuildComputed(upd, catIdFields)); }} placeholder="e.g. SB" maxLength={2} hint="2 characters max (e.g. SB = Story Books)" />
          <Input label="Tags" value={bookForm.tags} onChange={e => setBookForm({ ...bookForm, tags: e.target.value })} placeholder="e.g. adventure, classic, award-winning" hint="Comma-separated tags" />

          {/* Catalogue No */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Catalogue No</label>
            <input type="number" min="1" value={bookForm.catalogueNo} onChange={e => { const upd = { ...bookForm, catalogueNo: e.target.value }; setBookForm(rebuildComputed(upd, catIdFields)); }}
              placeholder="e.g. 1"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: C.white, color: C.gray900 }}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e => e.target.style.borderColor = C.gray300} />
          </div>

          {/* Color Code */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Color Code</label>
            <select value={bookForm.colorCode} onChange={e => { const upd = { ...bookForm, colorCode: e.target.value }; setBookForm(rebuildComputed(upd, catIdFields)); }}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", background: C.white, color: C.gray900 }}>
              <option value="">— Select —</option>
              {COLOR_CODES.map(c => (
                <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
              ))}
            </select>
            {bookForm.colorCode && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: COLOR_CODES.find(c => c.code === bookForm.colorCode)?.hex, border: "1px solid rgba(0,0,0,.15)" }} />
                <span style={{ fontSize: 12, color: C.gray600 }}>{COLOR_CODES.find(c => c.code === bookForm.colorCode)?.label}</span>
              </div>
            )}
          </div>

          {/* Auto-generated identifiers */}
          <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, textTransform: "uppercase", letterSpacing: .5 }}>Auto-Generated Call Numbers</label>
              <Btn size="sm" variant="outline" onClick={() => setBookForm(prev => rebuildComputed(prev, catIdFields))}>Regenerate</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Call No. Prefix", value: bookForm.callNumberPrefix, hint: "S101 + Lang(2) + Age + Cat(3) + Color(1)" },
                { label: "Call No. Suffix",  value: bookForm.callNumberSuffix, hint: "Prefix + 001, 002, 003… (auto-sequence per prefix)" },
              ].map(({ label, value, hint }) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray600, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
                  <input value={value} readOnly
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.greenLight}`, fontSize: 13, fontWeight: 800, fontFamily: "monospace", background: C.gray50, color: C.green, letterSpacing: 1, boxSizing: "border-box" }} />
                  <p style={{ fontSize: 10, color: C.gray300, margin: "3px 0 0" }}>{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Cover Image URL" value={bookForm.cover} onChange={e => setBookForm({ ...bookForm, cover: e.target.value })} placeholder="https://covers.openlibrary.org/…" icon="eye" hint="Use openlibrary.org cover URLs or any public image URL" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn onClick={saveBook} variant="primary">{editBook ? "Save Changes" : "Add Book"}</Btn>
          <Btn onClick={() => { setShowBookForm(false); setEditBook(null); }} variant="ghost">Cancel</Btn>
        </div>
      </Modal>

      {/* Hidden file input for iOS Safari / older Android barcode capture fallback */}
      <input ref={isbnFileInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={handleISBNFileCapture} />

      {/* Barcode scanner overlay */}
      {showScanner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>Point camera at the barcode</div>
          <video ref={scannerVideoRef} playsInline muted
            style={{ width: Math.min(360, window.innerWidth - 32), borderRadius: 12, background: "#000", border: `3px solid ${C.gold}` }} />
          <Btn variant="danger" onClick={stopScanner}>Cancel</Btn>
        </div>
      )}

      {/* Member form */}
      <Modal open={showMemberForm} onClose={() => { setShowMemberForm(false); setEditMember(null); }} title={editMember ? "Edit Member" : "Add New Member"} width={560}>
        {/* ── Member Info ── */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Member Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Full Name" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Member's full name" icon="user" required />
          <Input label="Enrollment Date" type="date" value={memberForm.enrollmentDate} onChange={e => setMemberForm({ ...memberForm, enrollmentDate: e.target.value })} />
          <Input label="Email" type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="email@example.com" icon="mail" required />
          <Input label="Phone" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="+91 98765 43210" icon="phone" required />
          <Input label="Alternate Phone" value={memberForm.altPhone} onChange={e => setMemberForm({ ...memberForm, altPhone: e.target.value })} placeholder="+91 98765 43210" icon="phone" />
          <Input label="UPI ID" value={memberForm.upiId} onChange={e => setMemberForm({ ...memberForm, upiId: e.target.value })} placeholder="name@upi or 9876543210@paytm" hint="Used for renewal payment links" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Address<span style={{ color: C.red }}> *</span></label>
          <textarea value={memberForm.address} onChange={e => setMemberForm({ ...memberForm, address: e.target.value })} placeholder="Full address" rows={2} required
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.gray300} />
        </div>

        {/* ── Child Member ── */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Child Member (if applicable)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Child Member Name" value={memberForm.childMemberName} onChange={e => setMemberForm({ ...memberForm, childMemberName: e.target.value })} placeholder="Child's full name" />
          <Input label="Child Date of Birth" type="date" value={memberForm.childMemberDOB} onChange={e => setMemberForm({ ...memberForm, childMemberDOB: e.target.value })} />
          <Input label="Parent / Guardian Name" value={memberForm.guardianName} onChange={e => setMemberForm({ ...memberForm, guardianName: e.target.value })} placeholder="Guardian's name" />
          <Input label="Relationship to Member" value={memberForm.relationshipToMember} onChange={e => setMemberForm({ ...memberForm, relationshipToMember: e.target.value })} placeholder="e.g. Father, Mother" />
        </div>

        {/* ── Payment ── */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Payment</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Select label="Payment Method" value={memberForm.paymentMethod} onChange={e => setMemberForm({ ...memberForm, paymentMethod: e.target.value })} options={[
            { value: "", label: "— Select —" },
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "bank_transfer", label: "Bank Transfer" },
            { value: "card", label: "Card" },
            { value: "cheque", label: "Cheque" },
          ]} />
          <Input label="Offer Type" value={memberForm.offerType} onChange={e => setMemberForm({ ...memberForm, offerType: e.target.value })} placeholder="e.g. Referral, Festival" />
          <Input label="One-time Registration Fee (₹)" type="number" value={memberForm.registrationFees} onChange={e => setMemberForm({ ...memberForm, registrationFees: e.target.value })} placeholder="0" />
          <Input label="Refundable Deposit (₹)" type="number" value={memberForm.refundableDeposit} onChange={e => setMemberForm({ ...memberForm, refundableDeposit: e.target.value })} placeholder="0" />
        </div>

        {/* ── Membership ── */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Membership</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Select label="Membership Plan" required value={memberForm.plan} onChange={e => {
            const planId = e.target.value;
            const chosenPlan = (settings.plans || DEFAULT_PLANS).find(p => p.id === planId);
            setMemberForm({
              ...memberForm, plan: planId,
              refundableDeposit: chosenPlan ? String(chosenPlan.refundableDeposit || 0) : memberForm.refundableDeposit,
              planDescription: chosenPlan
                ? (chosenPlan.inhouseOnly ? `${chosenPlan.name} — walk-in, no borrowing` : `${chosenPlan.name} — Borrow up to ${chosenPlan.borrowLimit} book${chosenPlan.borrowLimit !== 1 ? "s" : ""} · ₹${chosenPlan.cost}/month subscription`)
                : memberForm.planDescription,
              membershipType: chosenPlan ? (chosenPlan.inhouseOnly ? "inhouse" : "monthly") : memberForm.membershipType,
            });
          }} options={[
            { value: "", label: "— Select a plan —" },
            ...(settings.plans || DEFAULT_PLANS).map(p => ({ value: p.id, label: p.inhouseOnly ? `${p.name} (walk-in)` : `${p.name} (${p.borrowLimit} books · ₹${p.cost}/mo)` })),
          ]} />
          <Select label="Membership Type" value={memberForm.membershipType} onChange={e => setMemberForm({ ...memberForm, membershipType: e.target.value })} options={[
            { value: "monthly",     label: "Monthly" },
            { value: "quarterly",   label: "Quarterly" },
            { value: "halfyearly",  label: "Half-Yearly" },
            { value: "annual",      label: "Annual" },
            { value: "inhouse",     label: "In-Library (Inhouse)" },
          ]} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Membership Plan Description</label>
          <textarea value={memberForm.planDescription} onChange={e => setMemberForm({ ...memberForm, planDescription: e.target.value })} placeholder="Optional description of the plan" rows={2}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.gray300} />
        </div>

        {/* ── Admin ── */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Admin</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Select label="Branch" value={memberForm.branch} onChange={e => setMemberForm({ ...memberForm, branch: e.target.value })} options={[
            { value: "", label: "— Select branch —" },
            ...branches.map(b => ({ value: b.id, label: b.name })),
          ]} />
          <Select label="Status" value={memberForm.status} onChange={e => setMemberForm({ ...memberForm, status: e.target.value })} options={[
            { value: "active",    label: "Active"    },
            { value: "pending",   label: "Pending"   },
            { value: "suspended", label: "Suspended" },
          ]} />
          <Input label="Password" type="password" value={memberForm.password} onChange={e => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="Set login password" icon="lock" hint="Leave blank to auto-generate" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Comments</label>
          <textarea value={memberForm.comments} onChange={e => setMemberForm({ ...memberForm, comments: e.target.value })} placeholder="Any additional notes or remarks" rows={2}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.green} onBlur={e => e.target.style.borderColor = C.gray300} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn onClick={saveMember} variant="primary">{editMember ? "Save Changes" : "Create Member"}</Btn>
          <Btn onClick={() => { setShowMemberForm(false); setEditMember(null); }} variant="ghost">Cancel</Btn>
        </div>
      </Modal>

      {/* Librarian form */}
      <Modal open={showLibForm} onClose={() => { setShowLibForm(false); setEditLib(null); }} title={editLib ? "Edit Librarian" : "Add Librarian"} width={460}>
        <Input label="Full Name" value={libForm.name} onChange={e => setLibForm({ ...libForm, name: e.target.value })} placeholder="Librarian name" icon="user" required />
        <Input label="Email" type="email" value={libForm.email} onChange={e => setLibForm({ ...libForm, email: e.target.value })} placeholder="librarian@arivagam.com" icon="mail" required />
        <Input label="Phone" value={libForm.phone} onChange={e => setLibForm({ ...libForm, phone: e.target.value })} placeholder="+91 98765 43210" icon="phone" />
        <Input label="Password" type="password" value={libForm.password} onChange={e => setLibForm({ ...libForm, password: e.target.value })} placeholder="Login password" icon="lock" />
        <Input label="Branch" value={libForm.branch} onChange={e => setLibForm({ ...libForm, branch: e.target.value })} placeholder="e.g. Main / T.Nagar" />
        <Select label="Status" value={libForm.status} onChange={e => setLibForm({ ...libForm, status: e.target.value })} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn onClick={saveLib} variant="primary">{editLib ? "Save Changes" : "Add Librarian"}</Btn>
          <Btn onClick={() => { setShowLibForm(false); setEditLib(null); }} variant="ghost">Cancel</Btn>
        </div>
      </Modal>

      {/* Branch form */}
      <Modal open={showBranchForm} onClose={() => setShowBranchForm(false)} title="Create New Branch" width={460}>
        <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: C.blue, fontWeight: 600 }}>
          <Icon name="info" size={14} color={C.blue} /> Each new branch gets its own sub-portal. A Supabase connection enables live data sync.
        </div>
        <Input label="Branch Name" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="e.g. T.Nagar Branch" required />
        <Input label="Address" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Full street address" />
        <Input label="Assigned Librarian" value={branchForm.librarian} onChange={e => setBranchForm({ ...branchForm, librarian: e.target.value })} placeholder="Librarian name" />
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <Btn onClick={() => {
            if (!branchForm.name.trim()) { showToast("Branch name required.", "error"); return; }
            const id = nextId(branches, "BR");
            setBranches([...branches, { ...branchForm, id, status: "active", books: 0, members: 0 }]);
            setShowBranchForm(false); setBranchForm(emptyBranch);
            showToast(`Branch "${branchForm.name}" created!`);
          }} variant="primary">Create Branch</Btn>
          <Btn onClick={() => setShowBranchForm(false)} variant="ghost">Cancel</Btn>
        </div>
      </Modal>

      {/* Return confirmation modal */}
      {/* ── ACTIVATE MEMBER MODAL ── */}
      <Modal open={!!activateModal} onClose={() => { setActivateModal(null); setActivatePlanId(""); }} title="Activate Membership" width={420}>
        {activateModal && (
          <div>
            <p style={{ color: C.gray900, fontSize: 14, margin: "0 0 16px" }}>
              Activating <strong>{activateModal.member.name}</strong>. Select a membership plan:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(settings.plans || DEFAULT_PLANS).map(plan => (
                <label key={plan.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: `2px solid ${activatePlanId === plan.id ? C.green : C.gray100}`, borderRadius: 10, cursor: "pointer", background: activatePlanId === plan.id ? C.green + "0d" : C.white }}>
                  <input type="radio" name="plan" value={plan.id} checked={activatePlanId === plan.id} onChange={() => setActivatePlanId(plan.id)} style={{ accentColor: C.green }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: C.gray600 }}>Borrow up to {plan.borrowLimit} book{plan.borrowLimit > 1 ? "s" : ""} · ₹{plan.cost}/month{plan.refundableDeposit ? ` · Deposit ₹${plan.refundableDeposit}` : ""}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => approveMember(activateModal.member.id, activatePlanId)} variant="primary" icon="check" disabled={!activatePlanId}>Activate Member</Btn>
              <Btn onClick={() => { setActivateModal(null); setActivatePlanId(""); }} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── RENEW MEMBER MODAL ── */}
      {renewModal && (() => {
        const { member: m, plan: modalPlan } = renewModal;
        const plan = modalPlan || resolvePlan(m.plan);
        const ex      = renewExtras;
        const resetExtras = () => setRenewExtras({ lateFee: false, lostBook: false, lostBookQty: 1, damagedBook: false, damagedBookQty: 1, cautionDeposit: false });
        const closeModal = () => { setRenewModal(null); resetExtras(); setCollectMode("total"); setManualPaidMonth(""); };

        // Recompute arrears here (rather than trusting the caller) so the modal works whether it's
        // opened from the Renewals tab (which precomputes this) or the Members tab pop-out (which doesn't).
        const statusRow = (memberStatuses || []).find(s => s.memberId === m.membershipId);
        const paidDate = statusRow?.lastPaidMonth ? new Date(statusRow.lastPaidMonth) : null;
        const validPaidDate = paidDate && !isNaN(paidDate) ? paidDate : null;
        const dueBase = validPaidDate ? new Date(validPaidDate) : new Date(m.joined || today());
        dueBase.setMonth(dueBase.getMonth() + 1);
        const renewalDue = dueBase.toISOString().split("T")[0];
        const diff    = daysDiff(renewalDue);
        const overdue = diff < 0;
        const monthlyCost = plan?.cost || 0;
        const overdueMonths = Math.max(0, monthDiff(dueBase, renewalCurrentMonthStart));
        const overdueAmount = overdueMonths * monthlyCost;
        const dueThisMonthAmount = monthlyCost;

        const lateFeeAmt         = m.fees || 0;
        const lostBookAmt        = settings.fees.bookLostFee      || 500;
        const damagedBookAmt     = settings.fees.bookDamageFee    || 200;
        const cautionDepositAmt  = settings.fees.cautionDeposit   || 1000;

        const extraTotal =
          (ex.lateFee         ? lateFeeAmt                                       : 0) +
          (ex.lostBook        ? lostBookAmt        * (ex.lostBookQty    || 1)    : 0) +
          (ex.damagedBook     ? damagedBookAmt     * (ex.damagedBookQty || 1)    : 0) +
          (ex.cautionDeposit  ? cautionDepositAmt                                : 0);
        const total = overdueAmount + dueThisMonthAmount + extraTotal;

        const currentMonthLabel = monthYearLabel(renewalCurrentMonthStart.getFullYear(), renewalCurrentMonthStart.getMonth());
        const defaultMonthValue = `${renewalCurrentMonthStart.getFullYear()}-${String(renewalCurrentMonthStart.getMonth() + 1).padStart(2, "0")}`;
        const confirmRenew = () => {
          let lastPaidMonthText = currentMonthLabel;
          if (collectMode === "partial") {
            const [y, mo] = (manualPaidMonth || defaultMonthValue).split("-").map(Number);
            lastPaidMonthText = monthYearLabel(y, mo - 1);
          }
          renewMember(m.id, { lateFeeCollected: ex.lateFee, currentFees: m.fees || 0, membershipId: m.membershipId, memberName: m.name, lastPaidMonthText });
        };

        // Shared styles for qty stepper buttons
        const qtyBtn = { width: 26, height: 26, borderRadius: 4, border: `1px solid ${C.gray200}`, background: C.white, cursor: "pointer", fontSize: 15, lineHeight: 1, fontFamily: "inherit" };

        return (
          <Modal open title="Collect & Renew Membership" width={500} onClose={closeModal}>
            <div>
              {/* Member info */}
              <div style={{ background: overdue ? C.redLight : C.blueLight, border: `1px solid ${overdue ? C.red : C.blue}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: overdue ? C.red : C.blue }}>{m.name}</div>
                <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>{m.email}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12 }}><span style={{ color: C.gray600 }}>Plan: </span><strong style={{ color: C.green }}>{plan?.name || "—"}</strong></span>
                  <span style={{ fontSize: 12 }}><span style={{ color: C.gray600 }}>Due: </span><strong style={{ color: overdue ? C.red : "#E67E22" }}>{renewalDue} {overdue ? `(${Math.abs(diff)}d overdue)` : diff === 0 ? "(today)" : `(in ${diff}d)`}</strong></span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div style={{ background: C.gray50, borderRadius: 10, padding: "14px 16px", marginBottom: 18, border: `1px solid ${C.gray100}` }}>
                <div style={{ fontSize: 12, color: C.gray600, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Payment Breakdown</div>

                {/* Membership fee — always */}
                {overdueMonths > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0" }}>
                    <span style={{ fontWeight: 600, color: C.red }}>Overdue — {overdueMonths} month{overdueMonths > 1 ? "s" : ""}</span>
                    <span style={{ fontWeight: 700, color: C.red }}>₹{overdueAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: overdueMonths > 0 ? `1px solid ${C.gray100}` : "none" }}>
                  <span style={{ fontWeight: 600 }}>{plan?.name} — {overdueMonths > 0 ? "this month" : "1 month renewal"}</span>
                  <span style={{ fontWeight: 700 }}>₹{dueThisMonthAmount.toLocaleString()}</span>
                </div>

                <div style={{ fontSize: 12, color: C.gray600, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "10px 0 2px" }}>Additional Charges</div>

                {/* Late Fee row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                  <input type="checkbox" id="re-latefee"
                    checked={ex.lateFee}
                    disabled={lateFeeAmt === 0}
                    onChange={() => setRenewExtras(prev => ({ ...prev, lateFee: !prev.lateFee }))}
                    style={{ width: 16, height: 16, accentColor: C.green, cursor: lateFeeAmt > 0 ? "pointer" : "not-allowed", flexShrink: 0 }} />
                  <label htmlFor="re-latefee" style={{ flex: 1, fontSize: 13, color: lateFeeAmt > 0 ? (ex.lateFee ? C.gray900 : C.gray600) : C.gray400, cursor: lateFeeAmt > 0 ? "pointer" : "default", fontWeight: ex.lateFee ? 600 : 400 }}>
                    Outstanding Late Fee
                    <span style={{ fontSize: 12, color: C.gray500, fontWeight: 400 }}>{lateFeeAmt > 0 ? ` (₹${lateFeeAmt.toLocaleString()})` : " (none)"}</span>
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ex.lateFee ? C.red : C.gray400, minWidth: 60, textAlign: "right" }}>
                    {ex.lateFee ? `₹${lateFeeAmt.toLocaleString()}` : "—"}
                  </span>
                </div>

                {/* Lost Book row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                  <input type="checkbox" id="re-lost"
                    checked={ex.lostBook}
                    onChange={() => setRenewExtras(prev => ({ ...prev, lostBook: !prev.lostBook }))}
                    style={{ width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }} />
                  <label htmlFor="re-lost" style={{ flex: 1, fontSize: 13, color: ex.lostBook ? C.gray900 : C.gray600, cursor: "pointer", fontWeight: ex.lostBook ? 600 : 400 }}>
                    Lost Book
                    <span style={{ fontSize: 12, color: C.gray500, fontWeight: 400 }}> (₹{lostBookAmt.toLocaleString()} each)</span>
                  </label>
                  {ex.lostBook && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button style={qtyBtn} onClick={() => setRenewExtras(prev => ({ ...prev, lostBookQty: Math.max(1, (prev.lostBookQty || 1) - 1) }))}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{ex.lostBookQty || 1}</span>
                      <button style={qtyBtn} onClick={() => setRenewExtras(prev => ({ ...prev, lostBookQty: (prev.lostBookQty || 1) + 1 }))}>+</button>
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: ex.lostBook ? C.red : C.gray400, minWidth: 60, textAlign: "right" }}>
                    {ex.lostBook ? `₹${(lostBookAmt * (ex.lostBookQty || 1)).toLocaleString()}` : "—"}
                  </span>
                </div>

                {/* Damaged Book row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                  <input type="checkbox" id="re-damaged"
                    checked={ex.damagedBook}
                    onChange={() => setRenewExtras(prev => ({ ...prev, damagedBook: !prev.damagedBook }))}
                    style={{ width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }} />
                  <label htmlFor="re-damaged" style={{ flex: 1, fontSize: 13, color: ex.damagedBook ? C.gray900 : C.gray600, cursor: "pointer", fontWeight: ex.damagedBook ? 600 : 400 }}>
                    Damaged Book
                    <span style={{ fontSize: 12, color: C.gray500, fontWeight: 400 }}> (₹{damagedBookAmt.toLocaleString()} each)</span>
                  </label>
                  {ex.damagedBook && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button style={qtyBtn} onClick={() => setRenewExtras(prev => ({ ...prev, damagedBookQty: Math.max(1, (prev.damagedBookQty || 1) - 1) }))}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{ex.damagedBookQty || 1}</span>
                      <button style={qtyBtn} onClick={() => setRenewExtras(prev => ({ ...prev, damagedBookQty: (prev.damagedBookQty || 1) + 1 }))}>+</button>
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: ex.damagedBook ? C.red : C.gray400, minWidth: 60, textAlign: "right" }}>
                    {ex.damagedBook ? `₹${(damagedBookAmt * (ex.damagedBookQty || 1)).toLocaleString()}` : "—"}
                  </span>
                </div>

                {/* Registration Fee row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                  <input type="checkbox" id="re-caution"
                    checked={ex.cautionDeposit}
                    onChange={() => setRenewExtras(prev => ({ ...prev, cautionDeposit: !prev.cautionDeposit }))}
                    style={{ width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }} />
                  <label htmlFor="re-caution" style={{ flex: 1, fontSize: 13, color: ex.cautionDeposit ? C.gray900 : C.gray600, cursor: "pointer", fontWeight: ex.cautionDeposit ? 600 : 400 }}>
                    One Time Registration Fee
                    <span style={{ fontSize: 12, color: C.gray600, fontWeight: 400 }}> (₹{cautionDepositAmt.toLocaleString()})</span>
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ex.cautionDeposit ? C.red : C.gray400, minWidth: 60, textAlign: "right" }}>
                    {ex.cautionDeposit ? `₹${cautionDepositAmt.toLocaleString()}` : "—"}
                  </span>
                </div>

                {/* Total */}
                <div style={{ borderTop: `2px solid ${C.gray300}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17 }}>
                  <span>Total to Collect</span>
                  <span style={{ color: C.green }}>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Last Paid Month — controls what gets written to the status table */}
              <div style={{ background: C.gray50, borderRadius: 10, padding: "14px 16px", marginBottom: 18, border: `1px solid ${C.gray100}` }}>
                <div style={{ fontSize: 12, color: C.gray600, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Last Paid Month</div>
                <div style={{ display: "flex", gap: 18, marginBottom: collectMode === "partial" ? 12 : 0 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: collectMode === "total" ? 700 : 400, color: collectMode === "total" ? C.gray900 : C.gray600 }}>
                    <input type="radio" name="collectMode" checked={collectMode === "total"} onChange={() => setCollectMode("total")} style={{ accentColor: C.green, cursor: "pointer" }} />
                    Total Due
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: collectMode === "partial" ? 700 : 400, color: collectMode === "partial" ? C.gray900 : C.gray600 }}>
                    <input type="radio" name="collectMode" checked={collectMode === "partial"} onChange={() => setCollectMode("partial")} style={{ accentColor: C.green, cursor: "pointer" }} />
                    Partial / Advance
                  </label>
                </div>
                {collectMode === "total" ? (
                  <div style={{ fontSize: 12, color: C.gray600 }}>Marks the member paid through <strong>{currentMonthLabel}</strong>.</div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: C.gray600, marginBottom: 6 }}>
                      Choose the last month this payment covers — a past month if they're only paying part of what's owed, or a future month if they're paying in advance.
                    </div>
                    <input type="month" value={manualPaidMonth || defaultMonthValue} onChange={e => setManualPaidMonth(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 13, fontFamily: "inherit" }} />
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: C.gray600, margin: "0 0 18px" }}>
                Check applicable charges, collect payment, then click <strong>Confirm & Renew</strong>.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={confirmRenew} variant="primary" icon="check">Confirm & Renew</Btn>
                <Btn onClick={closeModal} variant="ghost">Cancel</Btn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── PENALTY MODAL ── */}
      {penaltyModal && (() => {
        const { txn: t, member: pm, lateAmt } = penaltyModal;
        const px = penaltyExtras;
        const lostAmt      = settings.fees.bookLostFee      || 500;
        const damagedAmt   = settings.fees.bookDamageFee    || 200;
        const cautionAmt   = settings.fees.cautionDeposit   || 1000;
        const penTotal =
          (px.lateFee         ? (lateAmt || 0)                              : 0) +
          (px.lostBook        ? lostAmt      * (px.lostBookQty        || 1) : 0) +
          (px.damagedBook     ? damagedAmt   * (px.damagedBookQty     || 1) : 0) +
          (px.cautionDeposit  ? cautionAmt                                   : 0);
        const upiId = localSettings.library?.upiId || "";
        const libName = localSettings.library?.name || "Library";
        const upiLink = upiId && penTotal > 0
          ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(libName)}&am=${penTotal}&tn=${encodeURIComponent("Penalty-" + (pm?.name || t.memberName))}&cu=INR`
          : null;
        const qrSrc = upiLink
          ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}&margin=6&color=1B4332`
          : null;
        const pqtyBtn = { width: 26, height: 26, borderRadius: 4, border: `1px solid ${C.gray300}`, background: C.white, cursor: "pointer", fontSize: 15, lineHeight: 1, fontFamily: "inherit" };
        return (
          <Modal open title="Penalty Charges" width={520} onClose={() => { setPenaltyModal(null); resetPenaltyExtras(); setPenaltyShowQR(false); }}>
            <div>
              {/* Loan info banner */}
              <div style={{ background: C.blueLight, border: `1px solid ${C.blue}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.green }}>{t.bookTitle}</div>
                <div style={{ fontSize: 12, color: C.gray600, marginTop: 2 }}>Member: <strong>{pm?.name || t.memberName}</strong> · Due: <strong style={{ color: lateAmt > 0 ? C.red : C.gray900 }}>{t.dueDate}</strong>{lateAmt > 0 && <span style={{ color: C.red, fontWeight: 700 }}> ⚠ Overdue — Late Fee ₹{lateAmt}</span>}</div>
              </div>

              {penaltyShowQR ? (
                /* QR view */
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  {qrSrc ? (
                    <>
                      <div style={{ background: C.white, border: `2px solid ${C.green}`, borderRadius: 14, padding: 10, display: "inline-block", boxShadow: "0 4px 16px rgba(0,0,0,.1)" }}>
                        <img src={qrSrc} alt="UPI QR Code" width={180} height={180} style={{ display: "block", borderRadius: 8 }} />
                      </div>
                      <div style={{ marginTop: 12, fontSize: 15, fontWeight: 800, color: C.green }}>Scan &amp; Pay ₹{penTotal.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: C.gray600, marginTop: 4 }}>Ask the member to scan this with any UPI app</div>
                    </>
                  ) : (
                    <div style={{ background: C.gray50, border: `1.5px dashed ${C.gray300}`, borderRadius: 12, padding: "28px 20px" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📵</div>
                      <div style={{ fontSize: 13, color: C.gray600 }}>Library UPI not configured.<br />Go to Fee Settings → UPI &amp; Renewal Reminders.</div>
                    </div>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <Btn variant="ghost" onClick={() => setPenaltyShowQR(false)}>← Back to Charges</Btn>
                  </div>
                </div>
              ) : (
                /* Charges form */
                <>
                  <div style={{ background: C.gray50, borderRadius: 10, padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.gray100}` }}>
                    <div style={{ fontSize: 12, color: C.gray600, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Select Applicable Charges</div>

                    {/* Late Fee */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                      <input type="checkbox" id="pen-latefee" checked={px.lateFee} disabled={!lateAmt}
                        onChange={() => setPenaltyExtras(prev => ({ ...prev, lateFee: !prev.lateFee }))}
                        style={{ width: 16, height: 16, accentColor: C.green, cursor: lateAmt > 0 ? "pointer" : "not-allowed", flexShrink: 0 }} />
                      <label htmlFor="pen-latefee" style={{ flex: 1, fontSize: 13, color: lateAmt > 0 ? (px.lateFee ? C.gray900 : C.gray600) : C.gray300, cursor: lateAmt > 0 ? "pointer" : "default", fontWeight: px.lateFee ? 600 : 400 }}>
                        Late Fee{lateAmt > 0 ? ` — ₹${lateAmt}` : " (no overdue)"}
                      </label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: px.lateFee ? C.red : C.gray300, minWidth: 60, textAlign: "right" }}>{px.lateFee ? `₹${lateAmt}` : "—"}</span>
                    </div>

                    {/* Lost Book */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                      <input type="checkbox" id="pen-lost" checked={px.lostBook}
                        onChange={() => setPenaltyExtras(prev => ({ ...prev, lostBook: !prev.lostBook }))}
                        style={{ width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }} />
                      <label htmlFor="pen-lost" style={{ flex: 1, fontSize: 13, color: px.lostBook ? C.gray900 : C.gray600, cursor: "pointer", fontWeight: px.lostBook ? 600 : 400 }}>
                        Lost Book <span style={{ fontSize: 12, color: C.gray600, fontWeight: 400 }}>(₹{lostAmt.toLocaleString()} each)</span>
                      </label>
                      {px.lostBook && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button style={pqtyBtn} onClick={() => setPenaltyExtras(prev => ({ ...prev, lostBookQty: Math.max(1, (prev.lostBookQty || 1) - 1) }))}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{px.lostBookQty || 1}</span>
                          <button style={pqtyBtn} onClick={() => setPenaltyExtras(prev => ({ ...prev, lostBookQty: (prev.lostBookQty || 1) + 1 }))}>+</button>
                        </div>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: px.lostBook ? C.red : C.gray300, minWidth: 60, textAlign: "right" }}>{px.lostBook ? `₹${(lostAmt * (px.lostBookQty || 1)).toLocaleString()}` : "—"}</span>
                    </div>

                    {/* Damaged Book */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                      <input type="checkbox" id="pen-damaged" checked={px.damagedBook}
                        onChange={() => setPenaltyExtras(prev => ({ ...prev, damagedBook: !prev.damagedBook }))}
                        style={{ width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }} />
                      <label htmlFor="pen-damaged" style={{ flex: 1, fontSize: 13, color: px.damagedBook ? C.gray900 : C.gray600, cursor: "pointer", fontWeight: px.damagedBook ? 600 : 400 }}>
                        Damaged Book <span style={{ fontSize: 12, color: C.gray600, fontWeight: 400 }}>(₹{damagedAmt.toLocaleString()} each)</span>
                      </label>
                      {px.damagedBook && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button style={pqtyBtn} onClick={() => setPenaltyExtras(prev => ({ ...prev, damagedBookQty: Math.max(1, (prev.damagedBookQty || 1) - 1) }))}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{px.damagedBookQty || 1}</span>
                          <button style={pqtyBtn} onClick={() => setPenaltyExtras(prev => ({ ...prev, damagedBookQty: (prev.damagedBookQty || 1) + 1 }))}>+</button>
                        </div>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: px.damagedBook ? C.red : C.gray300, minWidth: 60, textAlign: "right" }}>{px.damagedBook ? `₹${(damagedAmt * (px.damagedBookQty || 1)).toLocaleString()}` : "—"}</span>
                    </div>

                    {/* Registration Fee */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.gray100}` }}>
                      <input type="checkbox" id="pen-caution" checked={px.cautionDeposit}
                        onChange={() => setPenaltyExtras(prev => ({ ...prev, cautionDeposit: !prev.cautionDeposit }))}
                        style={{ width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }} />
                      <label htmlFor="pen-caution" style={{ flex: 1, fontSize: 13, color: px.cautionDeposit ? C.gray900 : C.gray600, cursor: "pointer", fontWeight: px.cautionDeposit ? 600 : 400 }}>
                        One Time Registration Fee <span style={{ fontSize: 12, color: C.gray600, fontWeight: 400 }}>(₹{cautionAmt.toLocaleString()})</span>
                      </label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: px.cautionDeposit ? C.red : C.gray300, minWidth: 60, textAlign: "right" }}>{px.cautionDeposit ? `₹${cautionAmt.toLocaleString()}` : "—"}</span>
                    </div>

                    {/* Total */}
                    <div style={{ borderTop: `2px solid ${C.gray300}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17 }}>
                      <span>Total</span>
                      <span style={{ color: penTotal > 0 ? C.red : C.gray600 }}>₹{penTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Btn variant="primary" icon="check" onClick={() => savePenaltyFees({ memberId: pm?.id || t.memberId, extras: px, lateAmt, asPayLater: false })}>Save</Btn>
                    <Btn variant="outline" onClick={() => { if (penTotal > 0) setPenaltyShowQR(true); else showToast("Select at least one charge.", "error"); }}>Pay Now (QR)</Btn>
                    <Btn variant="ghost" onClick={() => savePenaltyFees({ memberId: pm?.id || t.memberId, extras: px, lateAmt, asPayLater: true })}>Pay Later (add to renewal)</Btn>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: C.gray600 }}>
                    <strong>Save</strong> — records the fee on the member's account.<br />
                    <strong>Pay Now</strong> — shows UPI QR for immediate payment.<br />
                    <strong>Pay Later</strong> — saves fee &amp; pre-selects it in the Collect &amp; Renew modal.
                  </div>
                </>
              )}
            </div>
          </Modal>
        );
      })()}

      <Modal open={!!returnConfirm} onClose={() => setReturnConfirm(null)} title="Confirm Book Return" width={400}>
        {returnConfirm && (
          <div>
            <p style={{ color: C.gray900, fontSize: 14, margin: "0 0 16px" }}>
              Mark <strong>"{returnConfirm.bookTitle}"</strong> as returned by <strong>{returnConfirm.memberName}</strong>?
            </p>
            {calcLateFee(returnConfirm.dueDate, settings.fees.lateFeePerDay) > 0 && (
              <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                <strong style={{ color: C.red }}>Late Fee: ₹{calcLateFee(returnConfirm.dueDate, settings.fees.lateFeePerDay)}</strong>
                <p style={{ color: C.red, margin: "4px 0 0", fontSize: 13 }}>This will be added to the member's account.</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => processReturn(returnConfirm.id)} variant="primary" icon="check">Confirm Return</Btn>
              <Btn onClick={() => setReturnConfirm(null)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CSV IMPORT MODAL ── */}
      <Modal open={showImportModal} onClose={() => { setShowImportModal(false); setImportResult(null); }} title="Import Members from CSV" width={680}>
        <div>
          {/* Step 1: file upload */}
          {!importHeaders.length && !importResult && (
            <div>
              <p style={{ fontSize: 13, color: C.gray600, margin: "0 0 16px" }}>
                Export your Google Sheet / Excel as a <strong>.csv</strong> file, then upload it here.
                Columns will be auto-detected.
              </p>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.green}`, borderRadius: 12, padding: "32px 24px", cursor: "pointer", background: C.gray50, gap: 8 }}>
                <span style={{ fontSize: 32 }}>📂</span>
                <span style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>Click to choose a CSV file</span>
                <span style={{ fontSize: 12, color: C.gray600 }}>Supports .csv files exported from Google Sheets or Excel</span>
                <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const { headers, rows } = parseCSV(ev.target.result);
                    setImportHeaders(headers);
                    setImportRows(rows);
                    setImportMapping(autoMapCSVHeaders(headers));
                  };
                  reader.readAsText(file);
                }} />
              </label>
            </div>
          )}

          {/* Step 2: column mapping + preview */}
          {importHeaders.length > 0 && !importResult && (
            <div>
              <div style={{ fontSize: 13, color: C.gray600, marginBottom: 12 }}>
                Found <strong>{importRows.length} rows</strong> with <strong>{importHeaders.length} columns</strong>. Map each column to a database field:
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto", border: `1px solid ${C.gray100}`, borderRadius: 8, marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.green, color: C.white }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Spreadsheet Column</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Map to Field</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: C.goldLight }}>Sample Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHeaders.map((h, i) => (
                      <tr key={h} style={{ borderTop: `1px solid ${C.gray100}`, background: i % 2 === 0 ? C.white : C.gray50 }}>
                        <td style={{ padding: "7px 12px", fontWeight: 600, color: C.gray900 }}>{h}</td>
                        <td style={{ padding: "7px 12px" }}>
                          <select
                            value={importMapping[h] || ""}
                            onChange={e => setImportMapping(m => ({ ...m, [h]: e.target.value }))}
                            style={{ border: `1px solid ${C.gray300}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, width: "100%", fontFamily: "inherit", background: importMapping[h] ? C.green + "10" : C.white }}
                          >
                            {CSV_DB_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "7px 12px", color: C.gray600, fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {importRows[0]?.[h] || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview first 3 rows */}
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray600, marginBottom: 6 }}>PREVIEW (first 3 rows)</div>
              <div style={{ maxHeight: 120, overflowY: "auto", border: `1px solid ${C.gray100}`, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
                {importRows.slice(0, 3).map((row, ri) => {
                  const nameCol = Object.keys(importMapping).find(k => importMapping[k] === "child_member_name");
                  const guardianCol = Object.keys(importMapping).find(k => importMapping[k] === "parent_guardian_name");
                  const phoneCol = Object.keys(importMapping).find(k => importMapping[k] === "phone_number");
                  const emailCol = Object.keys(importMapping).find(k => importMapping[k] === "email_id");
                  return (
                    <div key={ri} style={{ padding: "8px 12px", borderTop: ri > 0 ? `1px solid ${C.gray100}` : "none", background: ri % 2 === 0 ? C.white : C.gray50 }}>
                      <span style={{ fontWeight: 700, color: C.green }}>{nameCol ? row[nameCol] : "(no name)"}</span>
                      {guardianCol && row[guardianCol] && <span style={{ color: C.gray600 }}> · Guardian: {row[guardianCol]}</span>}
                      {phoneCol && row[phoneCol] && <span style={{ color: C.gray600 }}> · {row[phoneCol]}</span>}
                      {emailCol && row[emailCol] && <span style={{ color: C.gray600 }}> · {row[emailCol]}</span>}
                    </div>
                  );
                })}
              </div>

              <div style={{ background: C.goldLight + "88", border: `1px solid ${C.gold}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.gray900, marginBottom: 16 }}>
                <strong>Note:</strong> Make sure <strong>"Child/Member Name"</strong> is mapped — rows without a name will be skipped.
                All imported members will be set to <strong>Active</strong> status.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="primary" onClick={handleImportCSV} disabled={importLoading}>
                  {importLoading ? "Importing…" : `Import ${importRows.length} Members`}
                </Btn>
                <Btn variant="ghost" onClick={() => { setImportHeaders([]); setImportRows([]); setImportMapping({}); }}>
                  Upload Different File
                </Btn>
              </div>
            </div>
          )}

          {/* Step 3: result */}
          {importResult && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{importResult.failed === 0 ? "✅" : "⚠️"}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.green, marginBottom: 8 }}>
                Import Complete
              </div>
              <div style={{ fontSize: 14, color: C.gray600, marginBottom: 4 }}>
                <strong style={{ color: C.green }}>{importResult.inserted}</strong> members imported successfully
                {importResult.failed > 0 && <span>, <strong style={{ color: C.red }}>{importResult.failed}</strong> failed</span>}
              </div>
              {importResult.errors?.length > 0 && (
                <div style={{ fontSize: 11, color: C.red, marginTop: 8, textAlign: "left", background: C.redLight, borderRadius: 8, padding: "8px 12px" }}>
                  {importResult.errors.slice(0, 3).join(" | ")}
                </div>
              )}
              <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
                <Btn variant="primary" onClick={() => setShowImportModal(false)}>Done</Btn>
                <Btn variant="ghost" onClick={() => { setImportHeaders([]); setImportRows([]); setImportMapping({}); setImportResult(null); }}>Import Another File</Btn>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Shared state (lifted to root so all views stay in sync) ──
  const [books,        setBooks]        = useState([]);
  const [members,      setMembers]      = useState(SEED_MEMBERS);
  const [librarians,   setLibrarians]   = useState(SEED_LIBRARIANS);
  const [branches,     setBranches]     = useState(SEED_BRANCHES);
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);
  const [requests,     setRequests]     = useState([]);
  const [bookCopies,   setBookCopies]   = useState([]);
  const [waitlist,     setWaitlist]     = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [settings,     setSettings]     = useState(() => {
    try {
      const saved = localStorage.getItem("arivagam_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  // Load live data from Supabase on mount
  useEffect(() => {
    // Supabase/PostgREST caps each response at 1000 rows by default — page through
    // tables that can exceed that (books, book_copies, payments) to fetch everything.
    const fetchAllRows = async (buildQuery, pageSize = 1000) => {
      let all = [];
      let from = 0;
      for (;;) {
        const { data, error } = await buildQuery().range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    };
    const load = async () => {
      try {
        const [usersRes, txnsRes, reqsRes, feeRes, waitRes, statusRes, booksData, copiesData, paymentsData] = await Promise.all([
          supabase.from("users").select("*").order("child_member_name"),
          supabase.from("transactions").select("*, users!member_id(child_member_name), books!book_id(title), book_copies!copy_id(accession_number)"),
          supabase.from("borrow_requests").select("*").order("created_at", { ascending: false }),
          supabase.from("fee_settings").select("*").limit(1).maybeSingle(),
          supabase.from("book_waitlist").select("*").order("position"),
          supabase.from("status").select("*"),
          fetchAllRows(() => supabase.from("books").select("*").eq("status", "active").order("title").order("id")),
          fetchAllRows(() => supabase.from("book_copies").select("*").order("accession_number").order("id")),
          fetchAllRows(() => supabase.from("payments").select("*").order("date", { ascending: false }).order("id")),
        ]);
        if (booksData.length)       setBooks(booksData.map(dbToBook));
        if (usersRes.data?.length) {
          setMembers(usersRes.data.filter(u => u.role === "member").map(dbToUser));
          setLibrarians(usersRes.data.filter(u => u.role === "librarian").map(dbToUser));
        }
        if (txnsRes.data?.length)   setTransactions(txnsRes.data.map(dbToTxn));
        if (reqsRes.data)           setRequests(reqsRes.data.map(dbToRequest));
        if (copiesData.length)      setBookCopies(copiesData.map(dbToCopy));
        if (waitRes.data?.length)   setWaitlist(waitRes.data.map(dbToWaitlist));
        if (paymentsData.length)    setPayments(paymentsData.map(dbToPayment));
        if (statusRes.data)         setMemberStatuses(statusRes.data.map(dbToMemberStatus));
        if (feeRes.data) {
          // Load full settings from DB if available (saved via saveSettings)
          if (feeRes.data.settings_json) {
            try {
              const dbSettings = JSON.parse(feeRes.data.settings_json);
              setSettings(_prev => ({ ...DEFAULT_SETTINGS, ...dbSettings,
                // Deep-merge nested objects so new keys added to DEFAULT_SETTINGS are never lost
                library: { ...DEFAULT_SETTINGS.library, ...(dbSettings.library || {}) },
                sections: { ...DEFAULT_SETTINGS.sections, ...(dbSettings.sections || {}) },
                browseMenu: { ...DEFAULT_SETTINGS.browseMenu, ...(dbSettings.browseMenu || {}) },
                fees: {
                ...DEFAULT_SETTINGS.fees,
                ...(dbSettings.fees || {}),
                lateFeePerDay:     feeRes.data.late_fee_per_day   ?? (dbSettings.fees?.lateFeePerDay     ?? DEFAULT_SETTINGS.fees.lateFeePerDay),
                bookDamageFee:     feeRes.data.book_damage_fee    ?? (dbSettings.fees?.bookDamageFee     ?? DEFAULT_SETTINGS.fees.bookDamageFee),
                bookLostFee:       feeRes.data.book_lost_fee      ?? (dbSettings.fees?.bookLostFee       ?? DEFAULT_SETTINGS.fees.bookLostFee),
                gracePeriodDays:   feeRes.data.grace_period_days  ?? (dbSettings.fees?.gracePeriodDays   ?? 3),
              }}));
            } catch { /* malformed JSON — fall back to fee-only load */ }
          } else {
            setSettings(prev => ({ ...prev, fees: {
              ...prev.fees,
              lateFeePerDay:     feeRes.data.late_fee_per_day,
              bookDamageFee:     feeRes.data.book_damage_fee,
              bookLostFee:       feeRes.data.book_lost_fee,
              gracePeriodDays:   feeRes.data.grace_period_days || 3,
            }}));
          }
        }
      } catch (err) {
        console.warn("Supabase load failed:", err.message);
      }
    };
    load();

    // Realtime: pick up borrow requests and book availability changes from other sessions
    const channel = supabase.channel("live_updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "borrow_requests" }, (payload) => {
        setRequests(prev => {
          if (prev.some(r => r.id === payload.new.id)) return prev;
          return [dbToRequest(payload.new), ...prev];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "borrow_requests" }, (payload) => {
        setRequests(prev => prev.map(r => r.id === payload.new.id ? dbToRequest(payload.new) : r));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "books" }, (payload) => {
        // Keep available_copies in sync across all sessions (updated on request placed/rejected/returned)
        setBooks(prev => prev.map(b => b.id === payload.new.id ? { ...b, available: payload.new.available_copies } : b));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const [user,         setUser]         = useState(() => {
    try { const s = localStorage.getItem("arivagam_user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [page,         setPage]         = useState(() => {
    try { const s = localStorage.getItem("arivagam_user"); if (!s) return "home"; const u = JSON.parse(s); return u.role === "admin" ? "admin" : u.role === "librarian" ? "librarian" : "member"; } catch { return "home"; }
  });
  const [pageParams,   setPageParams]   = useState({});
  const [selectedBook, setSelectedBook] = useState(null);
  const [toast,        setToast]        = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const navigate = useCallback((p, params = {}) => {
    setPage(p);
    setPageParams(params);
    window.scrollTo(0, 0);
  }, []);

  const login = useCallback((u) => {
    setUser(u);
    try { localStorage.setItem("arivagam_user", JSON.stringify(u)); } catch {}
    navigate(u.role === "admin" ? "admin" : u.role === "librarian" ? "librarian" : "member");
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem("arivagam_user"); } catch {}
    navigate("home");
  }, [navigate]);

  // Member places a borrow request — immediately decrements available so card shows Checked Out
  const handleRequestBorrow = useCallback(async (book) => {
    if (!user || user.role !== "member") return;
    // Guard: overdue membership blocks borrowing
    const memberPlanForRenewal = user.plan ? (settings.plans || DEFAULT_PLANS).find(p => p.id === user.plan) : null;
    if (memberPlanForRenewal) {
      const renewalBase = user.planRenewedAt || user.joined;
      if (renewalBase) {
        const renewalDate = new Date(renewalBase);
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        const diffDays = Math.ceil((renewalDate - new Date()) / 86400000);
        if (diffDays < 0) {
          showToast("Your membership is overdue. Please renew your membership to borrow books.", "error");
          return;
        }
      }
    }
    // Guard: already has a pending/approved request for this book
    const existing = requests.find(r => r.bookId === book.id && r.memberId === user.id && (r.status === "pending" || r.status === "approved"));
    if (existing) { showToast("You already have an active request for this book.", "info"); return; }
    // Guard: already has an active loan for this book
    const activeLoan = transactions.find(tx => tx.bookId === book.id && tx.memberId === user.id && !tx.returnDate);
    if (activeLoan) { showToast("You already have this book checked out.", "info"); return; }
    // Guard: enforce plan borrow limit
    const memberPlan = user.plan ? (settings.plans || DEFAULT_PLANS).find(p => p.id === user.plan) : null;
    const borrowLimit = memberPlan ? memberPlan.borrowLimit : (settings.plans || DEFAULT_PLANS)[0]?.borrowLimit || 2;
    const activeCount = transactions.filter(tx => tx.memberId === user.id && !tx.returnDate).length
                      + requests.filter(r => r.memberId === user.id && r.status === "pending").length;
    if (activeCount >= borrowLimit) {
      const planName = memberPlan ? memberPlan.name : "current";
      showToast(`For your ${planName} plan you can borrow only ${borrowLimit} book${borrowLimit > 1 ? "s" : ""}. To borrow more, upgrade your plan or return one of your books.`, "error");
      return;
    }
    try {
      const { data, error } = await supabase.from("borrow_requests").insert({
        member_id: user.id, book_id: book.id,
        member_name: user.name, book_title: book.title,
        status: "pending",
      }).select().single();
      if (error) throw error;
      setRequests(prev => [...prev, dbToRequest(data)]);
      // Decrement available_copies immediately so all sessions see the updated count via realtime
      await supabase.from("books").update({ available_copies: Math.max(0, (book.available || 1) - 1) }).eq("id", book.id);
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available: Math.max(0, (b.available || 1) - 1) } : b));
      showToast(`Request placed for "${book.title}". The librarian will issue it to you shortly.`);
    } catch (err) {
      const msg = err?.message || "Unknown error";
      showToast(`Could not place request: ${msg}`, "error");
      console.error("Borrow request failed:", err);
    }
  }, [user, requests, transactions, settings, showToast]);

  // Member joins the waitlist for a fully-borrowed book
  const handleJoinWaitlist = useCallback(async (book) => {
    if (!user || user.role !== "member") return;
    const alreadyOn = waitlist.some(w => w.bookId === book.id && w.memberId === user.id && w.status === "waiting");
    if (alreadyOn) { showToast("You are already on the waitlist for this book.", "info"); return; }
    const position = waitlist.filter(w => w.bookId === book.id && w.status === "waiting").length + 1;
    try {
      const { data, error } = await supabase.from("book_waitlist").insert({
        book_id: book.id, member_id: user.id,
        book_title: book.title, member_name: user.name,
        position, status: "waiting",
      }).select().single();
      if (error) throw error;
      setWaitlist(prev => [...prev, dbToWaitlist(data)]);
    } catch {
      setWaitlist(prev => [...prev, {
        id: "WL" + Date.now(), bookId: book.id, bookTitle: book.title,
        memberId: user.id, memberName: user.name,
        position, status: "waiting", joinedAt: today(), reservedAt: null, graceDeadline: null,
      }]);
    }
    showToast(`Added to waitlist for "${book.title}" at position ${position}.`);
  }, [user, waitlist, showToast]);

  // Register new member
  const handleRegister = useCallback((newMember) => {
    setMembers(prev => [...prev, newMember]);
  }, []);

  // Member requests renewal from their dashboard
  const handleRequestRenewal = useCallback(async (memberId) => {
    const requestedAt = new Date().toISOString();
    try {
      await supabase.from("users").update({ renewal_requested_at: requestedAt }).eq("id", memberId);
    } catch {}
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, renewalRequestedAt: requestedAt } : m));
    // Update the logged-in user object too
    setUser(prev => prev ? { ...prev, renewalRequestedAt: requestedAt } : prev);
  }, []);

  // After registration → back to login
  const goToLogin = useCallback(() => navigate("login"), [navigate]);

  // ── Route guards ──
  if (page === "login")    return <LoginPage onLogin={login} onRegister={() => navigate("register")} initialTab={pageParams.tab || "member"} />;
  if (page === "register") return <RegisterPage onRegisterSuccess={handleRegister} onBack={goToLogin} settings={settings} />;
  if ((page === "admin" || page === "librarian" || page === "member") && !user) return <LoginPage onLogin={login} onRegister={() => navigate("register")} />;

  return (
    <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <TopNav user={user} onLogout={logout} onNavigate={navigate} currentPage={page} settings={settings} />

      {page === "home" && (
        <HomePage settings={settings} books={books} bookCopies={bookCopies} onBook={setSelectedBook} onNavigate={navigate} user={user} waitlist={waitlist} requests={requests} onBorrow={handleRequestBorrow} onWaitlist={handleJoinWaitlist} />
      )}

      {page === "catalog" && (
        <CatalogPage books={books} onBook={setSelectedBook} initialQuery={pageParams.q || ""} initialGenre={pageParams.genre || ""} />
      )}

      {page === "member" && user && (
        <MemberDashboard user={user} books={books} transactions={transactions} requests={requests} waitlist={waitlist} settings={settings} onNavigate={navigate} onRequestRenewal={handleRequestRenewal} />
      )}

      {page === "librarian" && user && (
        <LibrarianDashboard
          books={books} setBooks={setBooks}
          members={members} setMembers={setMembers}
          librarians={librarians} setLibrarians={setLibrarians}
          branches={branches} setBranches={setBranches}
          transactions={transactions} setTransactions={setTransactions}
          requests={requests} setRequests={setRequests}
          bookCopies={bookCopies} setBookCopies={setBookCopies}
          waitlist={waitlist} setWaitlist={setWaitlist}
          payments={payments} memberStatuses={memberStatuses} setMemberStatuses={setMemberStatuses}
          settings={settings} onSettings={setSettings}
          isAdmin={false}
        />
      )}

      {page === "admin" && user && (
        <LibrarianDashboard
          books={books} setBooks={setBooks}
          members={members} setMembers={setMembers}
          librarians={librarians} setLibrarians={setLibrarians}
          branches={branches} setBranches={setBranches}
          transactions={transactions} setTransactions={setTransactions}
          requests={requests} setRequests={setRequests}
          bookCopies={bookCopies} setBookCopies={setBookCopies}
          waitlist={waitlist} setWaitlist={setWaitlist}
          payments={payments} memberStatuses={memberStatuses} setMemberStatuses={setMemberStatuses}
          settings={settings} onSettings={setSettings}
          isAdmin={true}
        />
      )}

      {/* Book detail modal (shown from any page) */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        user={user}
        onRequest={handleRequestBorrow}
        onWaitlist={handleJoinWaitlist}
        transactions={transactions}
        requests={requests}
        waitlist={waitlist}
        settings={settings}
      />

      {/* Floating sign-in CTA when logged out */}
      {!user && page !== "login" && page !== "register" && (
        <button onClick={() => navigate("login")}
          style={{ position: "fixed", bottom: 24, right: 24, background: C.green, color: C.white, border: "none", padding: "12px 20px", borderRadius: 40, boxShadow: "0 8px 24px rgba(0,0,0,.25)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, zIndex: 500, fontFamily: "inherit" }}>
          <Icon name="user" size={16} color={C.gold} /> Sign In / Register
        </button>
      )}

      {/* Floating back-to-top button, appears after scrolling down */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Back to top" aria-label="Back to top"
          style={{ position: "fixed", bottom: 24, left: 24, width: 44, height: 44, borderRadius: "50%", background: C.green, color: C.white, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
          <Icon name="chevronUp" size={20} color={C.white} />
        </button>
      )}
    </div>
  );
}