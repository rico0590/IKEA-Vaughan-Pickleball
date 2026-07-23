import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Images,
  Trophy,
  Users,
  MapPin,
  LogIn,
  LogOut,
  Shield,
  Plus,
  Trash2,
  X,
  Check,
  History,
  KeyRound,
  Pencil,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Trim in case a stray space or line break came along with a pasted value.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim().replace(/^["']|["']$/g, "");

// Creating the client with missing or malformed values throws, which would
// crash the page to a blank white screen. We catch that instead and show a
// readable message below.
let supabase = null;
let CONFIG_ERROR = null;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  CONFIG_ERROR = "missing";
} else {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    CONFIG_ERROR = e && e.message ? e.message : "invalid";
  }
}
const CONFIG_OK = Boolean(supabase);

const ADMIN_PASSWORD = "VAUGHAN26";

const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

  .ivp-root { font-family: 'Inter', sans-serif; background:#FAF8F3; color:#14213D; }
  .ivp-display { font-family: 'Space Grotesk', sans-serif; }
  .ivp-mono { font-family: 'IBM Plex Mono', monospace; }

  .ivp-eyebrow {
    display:inline-flex; align-items:center; gap:8px;
    font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:0.14em;
    text-transform:uppercase; color:#0051BA; font-weight:600;
  }
  .ivp-eyebrow::before { content:''; width:18px; height:2px; background:#FFC845; display:inline-block; }

  .ivp-placard {
    background:#FFC845; border:2px solid #14213D; border-radius:4px;
    padding:16px 14px 12px; position:relative;
  }
  .ivp-placard::after {
    content:''; position:absolute; left:10px; right:10px; bottom:6px; height:0;
    border-bottom:2px dashed rgba(20,33,61,0.35);
  }
  .ivp-placard .num { font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:34px; line-height:1; color:#14213D; }
  .ivp-placard .lbl { font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; color:#14213D; opacity:0.75; margin-top:14px; display:block; }

  .ivp-card { background:#FFFFFF; border:1.5px solid #E4DFD3; border-radius:6px; }
  .ivp-btn-primary {
    background:#0051BA; color:#fff; font-weight:600; border-radius:4px;
    padding:9px 16px; font-size:14px; transition:background .15s ease;
  }
  .ivp-btn-primary:hover { background:#003C8A; }
  .ivp-btn-secondary {
    background:transparent; color:#0051BA; font-weight:600; border-radius:4px;
    padding:9px 16px; font-size:14px; border:1.5px solid #0051BA; transition:all .15s ease;
  }
  .ivp-btn-secondary:hover { background:#0051BA; color:#fff; }
  .ivp-tag-green { background:#7CB518; color:#14213D; }

  .ivp-focus:focus-visible { outline:2px solid #0051BA; outline-offset:2px; }

  @media (prefers-reduced-motion: reduce) {
    .ivp-root * { transition:none !important; animation:none !important; }
  }
`;

// Shared club data lives in one Supabase table called "club_data",
// which has two columns: key (text, primary key) and value (jsonb).
// Each key ("accounts", "sessions", "matches", "gallery") holds a list.
function useSharedStorage() {
  const getList = useCallback(async (key) => {
    try {
      const { data, error } = await supabase
        .from("club_data")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data && Array.isArray(data.value) ? data.value : [];
    } catch (e) {
      console.error("load failed", key, e);
      return [];
    }
  }, []);
  const setList = useCallback(async (key, value) => {
    try {
      const { error } = await supabase
        .from("club_data")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
    } catch (e) {
      console.error("save failed", key, e);
    }
  }, []);
  return { getList, setList };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function hashPassword(pw) {
  try {
    const enc = new TextEncoder().encode(pw);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return pw;
  }
}

function computeRankings(players, matches) {
  const stats = {};
  players.forEach((p) => {
    stats[p.id] = { id: p.id, name: p.name, phone: p.phone, department: p.department, wins: 0, losses: 0, points: 0, diff: 0, games: 0 };
  });
  matches.forEach((m) => {
    const teamA = (m.teamA || []).map((id) => stats[id]).filter(Boolean);
    const teamB = (m.teamB || []).map((id) => stats[id]).filter(Boolean);
    if (teamA.length === 0 || teamB.length === 0) return;
    const margin = m.scoreA - m.scoreB;
    teamA.forEach((p) => {
      p.games += 1;
      p.diff += margin;
    });
    teamB.forEach((p) => {
      p.games += 1;
      p.diff -= margin;
    });
    if (m.scoreA > m.scoreB) {
      teamA.forEach((p) => { p.wins += 1; p.points += 3; });
      teamB.forEach((p) => { p.losses += 1; });
    } else if (m.scoreB > m.scoreA) {
      teamB.forEach((p) => { p.wins += 1; p.points += 3; });
      teamA.forEach((p) => { p.losses += 1; });
    }
  });
  return Object.values(stats).sort((x, y) => y.points - x.points || y.diff - x.diff);
}

// Maps a player's record to a 1-10 skill level.
// Blends win rate (70%) with average point margin per game (30%),
// then eases the rating toward the middle until enough games are played
// so one lucky night doesn't peg someone at 10.
function computeSkillLevel(p) {
  if (!p.games) return null;
  const winRate = p.wins / p.games; // 0..1
  const avgMargin = p.diff / p.games; // typically about -11..+11
  const marginScore = Math.max(0, Math.min(1, (avgMargin + 11) / 22)); // 0..1
  const blended = winRate * 0.7 + marginScore * 0.3; // 0..1

  // Confidence: ramps from 0 to 1 across the first 5 games.
  const confidence = Math.min(1, p.games / 5);
  // Before enough games, pull the score toward the midpoint (0.5).
  const adjusted = 0.5 + (blended - 0.5) * confidence;

  const level = Math.round(adjusted * 9) + 1; // 1..10
  return { level, provisional: p.games < 5 };
}

function skillTier(level) {
  if (level >= 9) return { label: "Elite", color: "#7B2D8E" };
  if (level >= 7) return { label: "Advanced", color: "#0051BA" };
  if (level >= 5) return { label: "Intermediate", color: "#2E7D32" };
  if (level >= 3) return { label: "Developing", color: "#C77700" };
  return { label: "Beginner", color: "#8A8A8A" };
}

function fmtMatchDate(dateStr) {
  try {
    return new Date(`${dateStr}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function fmtDate(dateStr, timeStr) {
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    return {
      weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
      day: d.toLocaleDateString(undefined, { day: "numeric" }),
    };
  } catch {
    return { weekday: "", day: "" };
  }
}

export default function App() {
  const { getList, setList } = useSharedStorage();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home");
  const [accounts, setAccounts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [gallery, setGallery] = useState([]);

  const [myId, setMyId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTab, setAccountTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ name: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [signupForm, setSignupForm] = useState({ name: "", department: "", phone: "", password: "", confirm: "" });
  const [signupError, setSignupError] = useState("");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ department: "", phone: "" });

  const [showAdminGate, setShowAdminGate] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [resetTargetId, setResetTargetId] = useState(null);
  const [resetForm, setResetForm] = useState({ password: "", confirm: "" });
  const [resetError, setResetError] = useState("");

  const [newSession, setNewSession] = useState({ date: "", time: "", location: "", capacity: 12 });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSession, setEditSession] = useState({ date: "", time: "", location: "", capacity: 12 });
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "" });
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [newGuestForm, setNewGuestForm] = useState({ name: "", phone: "", department: "" });
  const [newMatch, setNewMatch] = useState({
    teamA: ["", ""],
    teamB: ["", ""],
    scoreA: "",
    scoreB: "",
    date: "",
  });

  useEffect(() => {
    (async () => {
      const [acc, s, mt, g] = await Promise.all([
        getList("accounts"),
        getList("sessions"),
        getList("matches"),
        getList("gallery"),
      ]);
      setAccounts(acc);
      setSessions(s);
      setMatches(mt);
      setGallery(g);

      try {
        const savedId = localStorage.getItem("my-id");
        if (savedId) setMyId(savedId);
      } catch {}
      try {
        const savedAdmin = localStorage.getItem("is-admin");
        if (savedAdmin === "true") setIsAdmin(true);
      } catch {}

      setLoading(false);
    })();
  }, [getList]);

  const signUp = async () => {
    setSignupError("");
    const name = signupForm.name.trim();
    if (!name) return setSignupError("Enter your name.");
    if (accounts.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      return setSignupError("That name is already taken.");
    }
    if (signupForm.password.length < 6) return setSignupError("Password must be at least 6 characters.");
    if (!/[a-zA-Z]/.test(signupForm.password) || !/[0-9]/.test(signupForm.password)) {
      return setSignupError("Password must include a letter and a number.");
    }
    if (signupForm.password !== signupForm.confirm) return setSignupError("Passwords don't match.");

    const passwordHash = await hashPassword(signupForm.password);
    const account = {
      id: uid(),
      name,
      department: signupForm.department.trim(),
      phone: signupForm.phone.trim(),
      passwordHash,
    };
    const updated = [...accounts, account];
    setAccounts(updated);
    await setList("accounts", updated);

    setMyId(account.id);
    try {
      localStorage.setItem("my-id", account.id);
    } catch {}

    setShowAccountModal(false);
    setSignupForm({ name: "", department: "", phone: "", password: "", confirm: "" });
  };

  const logIn = async () => {
    setLoginError("");
    const name = loginForm.name.trim();
    const account = accounts.find((a) => a.name.toLowerCase() === name.toLowerCase());
    if (!account || !account.passwordHash) return setLoginError("No account with that name.");
    const hash = await hashPassword(loginForm.password);
    if (hash !== account.passwordHash) return setLoginError("Incorrect password.");

    setMyId(account.id);
    try {
      localStorage.setItem("my-id", account.id);
    } catch {}
    setShowAccountModal(false);
    setLoginForm({ name: "", password: "" });
  };

  const signOut = async () => {
    setMyId(null);
    try {
      localStorage.removeItem("my-id");
    } catch {}
  };

  const openProfileEditor = () => {
    const acc = accounts.find((a) => a.id === myId);
    if (!acc) return;
    setProfileForm({ department: acc.department || "", phone: acc.phone || "" });
    setShowProfileModal(true);
  };

  const saveProfile = async () => {
    const updated = accounts.map((a) =>
      a.id === myId ? { ...a, department: profileForm.department.trim(), phone: profileForm.phone.trim() } : a
    );
    setAccounts(updated);
    await setList("accounts", updated);
    setShowProfileModal(false);
  };

  const openResetPassword = (id) => {
    setResetTargetId(id);
    setResetForm({ password: "", confirm: "" });
    setResetError("");
  };

  const resetPassword = async () => {
    if (resetForm.password.length < 6) return setResetError("Password must be at least 6 characters.");
    if (!/[a-zA-Z]/.test(resetForm.password) || !/[0-9]/.test(resetForm.password)) {
      return setResetError("Password must include a letter and a number.");
    }
    if (resetForm.password !== resetForm.confirm) return setResetError("Passwords don't match.");
    const passwordHash = await hashPassword(resetForm.password);
    const updated = accounts.map((a) => (a.id === resetTargetId ? { ...a, passwordHash } : a));
    setAccounts(updated);
    await setList("accounts", updated);
    setResetTargetId(null);
  };

  const tryAdminUnlock = async () => {
    if (pwInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminGate(false);
      setPwInput("");
      setPwError(false);
      try {
        localStorage.setItem("is-admin", "true");
      } catch {}
    } else {
      setPwError(true);
    }
  };

  const toggleRsvp = async (sessionId) => {
    if (!myId) {
      setAccountTab("login");
      setShowAccountModal(true);
      return;
    }
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const has = s.rsvps.includes(myId);
      return { ...s, rsvps: has ? s.rsvps.filter((id) => id !== myId) : [...s.rsvps, myId] };
    });
    setSessions(updated);
    await setList("sessions", updated);
  };

  const addSession = async () => {
    if (!newSession.date || !newSession.time || !newSession.location) return;
    const updated = [
      ...sessions,
      { id: uid(), ...newSession, capacity: Number(newSession.capacity) || 12, rsvps: [] },
    ].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    setSessions(updated);
    await setList("sessions", updated);
    setNewSession({ date: "", time: "", location: "", capacity: 12 });
  };

  const startEditSession = (s) => {
    setEditingSessionId(s.id);
    setEditSession({ date: s.date, time: s.time, location: s.location, capacity: s.capacity });
  };

  const saveEditSession = async () => {
    if (!editSession.date || !editSession.time || !editSession.location) return;
    const updated = sessions
      .map((s) =>
        s.id === editingSessionId
          ? {
              ...s,
              date: editSession.date,
              time: editSession.time,
              location: editSession.location,
              capacity: Math.max(1, Number(editSession.capacity) || 1),
            }
          : s
      )
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    setSessions(updated);
    await setList("sessions", updated);
    setEditingSessionId(null);
  };

  const deleteSession = async (id) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    await setList("sessions", updated);
  };

  const addGuestAccount = async () => {
    const name = newGuestForm.name.trim();
    if (!name) return;
    if (accounts.some((a) => a.name.toLowerCase() === name.toLowerCase())) return;
    const updated = [
      ...accounts,
      { id: uid(), name, phone: newGuestForm.phone.trim(), department: newGuestForm.department.trim(), passwordHash: null },
    ];
    setAccounts(updated);
    await setList("accounts", updated);
    setNewGuestForm({ name: "", phone: "", department: "" });
  };

  const deleteAccount = async (id) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    await setList("accounts", updated);
  };

  const addMatch = async () => {
    const { teamA, teamB, scoreA, scoreB } = newMatch;
    const allIds = [...teamA, ...teamB];
    if (allIds.some((id) => !id)) return;
    if (new Set(allIds).size !== 4) return;
    if (scoreA === "" || scoreB === "" || Number(scoreA) === Number(scoreB)) return;
    const match = {
      id: uid(),
      teamA,
      teamB,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      date: newMatch.date || new Date().toISOString().slice(0, 10),
    };
    const updated = [match, ...matches];
    setMatches(updated);
    await setList("matches", updated);
    setNewMatch({ teamA: ["", ""], teamB: ["", ""], scoreA: "", scoreB: "", date: "" });
  };

  const deleteMatch = async (id) => {
    const updated = matches.filter((m) => m.id !== id);
    setMatches(updated);
    await setList("matches", updated);
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("That file isn't an image.");
      return;
    }
    // Phone photos are often 5-10MB; keep a sane ceiling.
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("That photo is over 10MB. Try a smaller one.");
      return;
    }
    setPhotoError("");
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${Date.now()}-${uid()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);

      const entry = {
        id: uid(),
        url: urlData.publicUrl,
        path,
        caption: newPhoto.caption.trim(),
        uploadedBy: (accounts.find((a) => a.id === myId) || {}).name || "Someone",
      };
      const updated = [entry, ...gallery];
      setGallery(updated);
      await setList("gallery", updated);
      setNewPhoto({ url: "", caption: "" });
    } catch (e) {
      console.error("upload failed", e);
      setPhotoError(e && e.message ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id) => {
    const photo = gallery.find((p) => p.id === id);
    const updated = gallery.filter((p) => p.id !== id);
    setGallery(updated);
    await setList("gallery", updated);
    // Also remove the stored file so it doesn't linger.
    if (photo && photo.path) {
      try {
        await supabase.storage.from("photos").remove([photo.path]);
      } catch (e) {
        console.error("file remove failed", e);
      }
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter((s) => s.date >= today);
  const rankedPlayers = computeRankings(accounts, matches);
  const topPlayer = rankedPlayers[0];
  const playerName = (id) => accounts.find((a) => a.id === id)?.name || "Unknown";
  const teamName = (ids) => (ids || []).map(playerName).join(" & ");
  const recentMatches = [...matches].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const myAccount = accounts.find((a) => a.id === myId) || null;
  const skillRated = rankedPlayers
    .map((p) => ({ ...p, skill: computeSkillLevel(p) }))
    .filter((p) => p.skill)
    .sort((a, b) => b.skill.level - a.skill.level || b.diff - a.diff);
  const unrated = rankedPlayers.filter((p) => !p.games);

  if (!CONFIG_OK) {
    return (
      <div className="ivp-root min-h-screen flex items-center justify-center px-6">
        <style>{FONT_STYLES}</style>
        <div className="ivp-card p-6 max-w-md">
          <span className="ivp-eyebrow">Setup needed · v2</span>
          <h1 className="ivp-display font-bold text-xl mt-2 mb-3">Database not connected</h1>
          <p className="text-sm text-[#14213D]/75 mb-3">
            The site loaded, but it couldn't connect to Supabase. In Netlify go to
            Site configuration → Environment variables, check both values below,
            then run Deploys → Trigger deploy → Deploy site.
          </p>
          <p className="ivp-mono text-[10px] text-red-600 mb-3 break-words">Reason: {CONFIG_ERROR}</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${SUPABASE_URL ? "bg-[#7CB518]" : "bg-red-500"}`}>
                {SUPABASE_URL && <Check size={9} className="text-white" strokeWidth={3} />}
              </span>
              <span className="ivp-mono">VITE_SUPABASE_URL</span>
              <span className="text-[#14213D]/50">{SUPABASE_URL ? "found" : "missing"}</span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${SUPABASE_KEY ? "bg-[#7CB518]" : "bg-red-500"}`}>
                {SUPABASE_KEY && <Check size={9} className="text-white" strokeWidth={3} />}
              </span>
              <span className="ivp-mono">VITE_SUPABASE_ANON_KEY</span>
              <span className="text-[#14213D]/50">{SUPABASE_KEY ? "found" : "missing"}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ivp-root min-h-screen flex items-center justify-center">
        <style>{FONT_STYLES}</style>
        <p className="ivp-mono text-sm text-[#0051BA]">Loading club data…</p>
      </div>
    );
  }

  return (
    <div className="ivp-root min-h-screen pb-16">
      <style>{FONT_STYLES}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b-2 border-[#14213D] sticky top-0 bg-[#FAF8F3] z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background: "#0051BA" }}>
            <span className="ivp-display text-[#FFC845] font-bold text-sm">IV</span>
          </div>
          <div>
            <p className="ivp-display font-bold text-sm leading-none">IKEA VAUGHAN</p>
            <p className="ivp-mono text-[10px] tracking-widest text-[#0051BA]">PICKLEBALL CLUB</p>
          </div>
        </div>

        {myAccount ? (
          <div className="flex items-center gap-3">
            <button
              onClick={openProfileEditor}
              className="ivp-focus flex items-center gap-1.5 text-xs font-semibold text-[#0051BA] border border-[#0051BA]/30 rounded px-2.5 py-1.5 hover:bg-[#0051BA]/10 max-w-[42vw] sm:max-w-none"
              title="Edit my profile"
            >
              <Users size={13} className="shrink-0" />
              <span className="truncate">{myAccount.name}</span>
            </button>
            <button onClick={signOut} className="ivp-btn-secondary ivp-focus flex items-center gap-1.5 text-xs">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setAccountTab("login"); setShowAccountModal(true); }}
            className="ivp-btn-primary ivp-focus flex items-center gap-1.5"
          >
            <LogIn size={15} /> Sign in
          </button>
        )}
      </header>

      {/* Page navigation */}
      <nav className="border-b border-[#E4DFD3] bg-[#FAF8F3] sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-8 flex gap-1 overflow-x-auto">
          {[
            { id: "home", label: "Home" },
            { id: "schedule", label: "Schedule" },
            { id: "rankings", label: "Rankings" },
            { id: "skill", label: "Skill Levels" },
            { id: "gallery", label: "Gallery" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setPage(t.id); window.scrollTo(0, 0); }}
              className={`ivp-focus whitespace-nowrap px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                page === t.id
                  ? "border-[#0051BA] text-[#0051BA]"
                  : "border-transparent text-[#14213D]/55 hover:text-[#0051BA]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 sm:px-8">
        {page === "home" && (<>
        {/* Intro */}
        <section className="pt-10 pb-6">
          <span className="ivp-eyebrow">Bin 01 · Club Status</span>
          <h1 className="ivp-display text-3xl sm:text-4xl font-bold mt-3 leading-tight">
            Coworkers who assemble on the court, not just in the warehouse.
          </h1>
          <p className="text-[15px] text-[#14213D]/70 mt-2 max-w-xl">
            Weekly pickleball for the IKEA Vaughan team. Check the schedule, RSVP, and see where you land on the board.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
          <div className="ivp-placard">
            <span className="num">{accounts.length}</span>
            <span className="lbl">Active members</span>
          </div>
          <div className="ivp-placard">
            <span className="num">{sessions.length}</span>
            <span className="lbl">Sessions logged</span>
          </div>
          <div className="ivp-placard">
            <span className="num">{upcoming.length}</span>
            <span className="lbl">Upcoming</span>
          </div>
          <div className="ivp-placard">
            <span className="num ivp-mono" style={{ fontSize: topPlayer ? 22 : 34 }}>
              {topPlayer ? `${topPlayer.wins}-${topPlayer.losses}` : "—"}
            </span>
            <span className="lbl">{topPlayer ? `Top of board · ${topPlayer.name}` : "Top record"}</span>
          </div>
        </section>
        </>)}

        {page === "schedule" && (<>
        {/* Schedule */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <span className="ivp-eyebrow">Aisle 02 · Schedule</span>
            {isAdmin && (
              <span className="ivp-mono text-[10px] px-2 py-1 rounded ivp-tag-green">STAFF VIEW</span>
            )}
          </div>

          <div className="space-y-3">
            {upcoming.length === 0 && (
              <div className="ivp-card p-6 text-sm text-[#14213D]/60">No sessions on the schedule yet.</div>
            )}
            {upcoming.map((s) => {
              const validRsvps = s.rsvps.filter((id) => accounts.some((a) => a.id === id));
              const rsvped = myId && validRsvps.includes(myId);
              const full = validRsvps.length >= s.capacity;

              if (isAdmin && editingSessionId === s.id) {
                return (
                  <div key={s.id} className="ivp-card p-4">
                    <p className="ivp-mono text-[11px] uppercase tracking-wide mb-3 text-[#0051BA]">Edit session</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="date" value={editSession.date} onChange={(e) => setEditSession({ ...editSession, date: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                      <input type="time" value={editSession.time} onChange={(e) => setEditSession({ ...editSession, time: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                      <input placeholder="Location" value={editSession.location} onChange={(e) => setEditSession({ ...editSession, location: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                      <input type="number" min="1" placeholder="Capacity" value={editSession.capacity} onChange={(e) => setEditSession({ ...editSession, capacity: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                    </div>
                    <p className="ivp-mono text-[9px] text-[#14213D]/45 mt-2">
                      {validRsvps.length} player{validRsvps.length === 1 ? "" : "s"} signed up. Raise the capacity to open more spots.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveEditSession} className="ivp-btn-primary ivp-focus flex items-center gap-1.5 text-xs">
                        <Check size={14} /> Save changes
                      </button>
                      <button onClick={() => setEditingSessionId(null)} className="ivp-btn-secondary ivp-focus text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={s.id} className="ivp-card p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="ivp-mono text-center leading-tight w-14 shrink-0">
                      <div className="text-xs text-[#0051BA] font-semibold">{fmtDate(s.date, s.time).weekday}</div>
                      <div className="text-lg font-semibold">{fmtDate(s.date, s.time).day}</div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-[#0051BA]" /> {s.time}
                      </p>
                      <p className="text-xs text-[#14213D]/60 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={12} /> {s.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="ivp-mono text-xs text-[#14213D]/60">
                      {validRsvps.length}/{s.capacity}
                    </span>
                    <button
                      onClick={() => toggleRsvp(s.id)}
                      disabled={!rsvped && full}
                      className={`ivp-focus text-xs font-semibold px-3 py-2 rounded flex items-center gap-1 ${
                        rsvped
                          ? "bg-[#7CB518] text-[#14213D]"
                          : full
                          ? "bg-[#E4DFD3] text-[#14213D]/40 cursor-not-allowed"
                          : "ivp-btn-primary"
                      }`}
                    >
                      {rsvped ? <Check size={13} /> : null}
                      {rsvped ? "You're in" : full ? "Full" : "RSVP"}
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => startEditSession(s)} className="ivp-focus text-[#14213D]/40 hover:text-[#0051BA]" title="Edit session">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteSession(s.id)} className="ivp-focus text-[#14213D]/40 hover:text-red-600" title="Delete session">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div className="ivp-card p-4 mt-4">
              <p className="ivp-mono text-[11px] uppercase tracking-wide mb-3 text-[#0051BA]">Add session</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input type="date" value={newSession.date} onChange={(e) => setNewSession({ ...newSession, date: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                <input type="time" value={newSession.time} onChange={(e) => setNewSession({ ...newSession, time: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                <input placeholder="Location" value={newSession.location} onChange={(e) => setNewSession({ ...newSession, location: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                <input type="number" min="1" placeholder="Capacity" value={newSession.capacity} onChange={(e) => setNewSession({ ...newSession, capacity: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
              </div>
              <button onClick={addSession} className="ivp-btn-primary ivp-focus mt-3 flex items-center gap-1.5 text-xs">
                <Plus size={14} /> Add session
              </button>
            </div>
          )}
        </section>
        </>)}

        {page === "rankings" && (<>
        {/* Rankings */}
        <section className="mb-14">
          <span className="ivp-eyebrow">Aisle 03 · Rankings</span>
          <p className="text-xs text-[#14213D]/50 mt-2 mb-4">Win = 3 pts. Diff is total point margin across logged games — the tiebreaker when points are level.</p>

          <div className="ivp-card overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 border-b border-[#E4DFD3] ivp-mono text-[10px] uppercase tracking-wide text-[#14213D]/50">
              <span>#</span>
              <span>Player</span>
              <span>W-L</span>
              <span>Diff</span>
              <span>Pts</span>
              <span></span>
            </div>
            {rankedPlayers.length === 0 && (
              <div className="p-6 text-sm text-[#14213D]/60">No players yet.</div>
            )}
            {rankedPlayers.map((r, i) => (
              <div key={r.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 items-center border-b border-[#E4DFD3] last:border-b-0">
                <span className="ivp-mono text-xs text-[#0051BA] font-semibold">{i + 1}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {i === 0 && r.games > 0 && <Trophy size={13} className="text-[#FFC845]" fill="#FFC845" />} {r.name}
                  </span>
                  <span className="flex items-center gap-2 flex-wrap">
                    {r.department && (
                      <span className="ivp-mono text-[9px] uppercase tracking-wide text-[#0051BA] bg-[#0051BA]/10 px-1.5 py-0.5 rounded">{r.department}</span>
                    )}
                    {isAdmin && r.phone && (
                      <span className="ivp-mono text-[10px] text-[#14213D]/50">{r.phone}</span>
                    )}
                  </span>
                </span>
                <span className="ivp-mono text-xs">{r.wins}-{r.losses}</span>
                <span className="ivp-mono text-xs">{r.diff > 0 ? `+${r.diff}` : r.diff}</span>
                <span className="ivp-mono text-xs font-semibold">{r.points}</span>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 justify-self-end">
                    <button onClick={() => openResetPassword(r.id)} className="ivp-focus text-[#14213D]/40 hover:text-[#0051BA]" title="Reset password">
                      <KeyRound size={13} />
                    </button>
                    <button onClick={() => deleteAccount(r.id)} className="ivp-focus text-[#14213D]/40 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                ) : <span />}
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-3 mb-6">
              <p className="ivp-mono text-[10px] text-[#14213D]/40 mb-2">Players can create their own account (top right). Use this only to add a guest without login access.</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input placeholder="Player name" value={newGuestForm.name} onChange={(e) => setNewGuestForm({ ...newGuestForm, name: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-xs" />
                <input placeholder="Department" value={newGuestForm.department} onChange={(e) => setNewGuestForm({ ...newGuestForm, department: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-xs" />
                <input placeholder="Phone (staff only)" value={newGuestForm.phone} onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-xs" />
                <button onClick={addGuestAccount} className="ivp-btn-primary ivp-focus flex items-center justify-center gap-1.5 text-xs"><Plus size={14} /> Add guest</button>
              </div>
            </div>
          )}

          {/* Recent matches */}
          <div className="mt-6">
            <p className="ivp-mono text-[10px] uppercase tracking-wide text-[#14213D]/50 flex items-center gap-1.5 mb-3">
              <History size={12} /> Recent matches
            </p>
            {recentMatches.length === 0 && (
              <p className="text-sm text-[#14213D]/60">No matches logged yet.</p>
            )}
            <div className="space-y-2">
              {recentMatches.map((m) => {
                const aWin = m.scoreA > m.scoreB;
                return (
                  <div key={m.id} className="ivp-card px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                    <span className="ivp-mono text-[10px] text-[#14213D]/40 w-12 shrink-0">{fmtMatchDate(m.date)}</span>
                    <span className="flex-1 flex items-center justify-center gap-2 flex-wrap text-center">
                      <span className={aWin ? "font-semibold" : "text-[#14213D]/60"}>{teamName(m.teamA)}</span>
                      <span className="ivp-mono text-xs bg-[#F4F1EA] px-2 py-0.5 rounded shrink-0">{m.scoreA}–{m.scoreB}</span>
                      <span className={!aWin ? "font-semibold" : "text-[#14213D]/60"}>{teamName(m.teamB)}</span>
                    </span>
                    {isAdmin && (
                      <button onClick={() => deleteMatch(m.id)} className="ivp-focus text-[#14213D]/40 hover:text-red-600 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isAdmin && (
            <div className="ivp-card p-4 mt-4">
              <p className="ivp-mono text-[11px] uppercase tracking-wide mb-3 text-[#0051BA]">Log 2v2 match</p>
              {accounts.length < 4 ? (
                <p className="text-xs text-[#14213D]/50">Add at least four players above before logging a 2v2 match.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="ivp-mono text-[10px] uppercase tracking-wide text-[#14213D]/50 mb-1.5">Team A</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newMatch.teamA[0]} onChange={(e) => setNewMatch({ ...newMatch, teamA: [e.target.value, newMatch.teamA[1]] })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs">
                          <option value="">Player 1</option>
                          {accounts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={newMatch.teamA[1]} onChange={(e) => setNewMatch({ ...newMatch, teamA: [newMatch.teamA[0], e.target.value] })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs">
                          <option value="">Player 2</option>
                          {accounts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="ivp-mono text-[10px] uppercase tracking-wide text-[#14213D]/50 mb-1.5">Team B</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newMatch.teamB[0]} onChange={(e) => setNewMatch({ ...newMatch, teamB: [e.target.value, newMatch.teamB[1]] })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs">
                          <option value="">Player 1</option>
                          {accounts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={newMatch.teamB[1]} onChange={(e) => setNewMatch({ ...newMatch, teamB: [newMatch.teamB[0], e.target.value] })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs">
                          <option value="">Player 2</option>
                          {accounts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <input type="number" placeholder="Team A score" value={newMatch.scoreA} onChange={(e) => setNewMatch({ ...newMatch, scoreA: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                    <input type="number" placeholder="Team B score" value={newMatch.scoreB} onChange={(e) => setNewMatch({ ...newMatch, scoreB: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                    <input type="date" value={newMatch.date} onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })} className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs" />
                  </div>
                  <button onClick={addMatch} className="ivp-btn-primary ivp-focus mt-3 flex items-center gap-1.5 text-xs">
                    <Plus size={14} /> Log match
                  </button>
                </>
              )}
            </div>
          )}
        </section>
        </>)}

        {page === "skill" && (<>
        {/* Skill Levels */}
        <section className="mb-14">
          <span className="ivp-eyebrow">Aisle 04 · Skill Levels</span>
          <p className="text-xs text-[#14213D]/50 mt-2 mb-4">
            Each player's 1–10 level is calculated from their match results — win rate blended with average point margin. New players show a provisional rating until they've played 5 games.
          </p>

          {skillRated.length === 0 ? (
            <div className="ivp-card p-6 text-sm text-[#14213D]/60">
              No rated players yet. Levels appear once matches are logged.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skillRated.map((p) => {
                const tier = skillTier(p.skill.level);
                return (
                  <div key={p.id} className="ivp-card p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-md flex flex-col items-center justify-center shrink-0"
                      style={{ background: tier.color }}
                    >
                      <span className="ivp-mono font-bold text-white text-lg leading-none">{p.skill.level}</span>
                      <span className="ivp-mono text-white/80 text-[7px] tracking-wide">/ 10</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {p.department && (
                          <span className="ivp-mono text-[9px] uppercase tracking-wide text-[#0051BA] bg-[#0051BA]/10 px-1.5 py-0.5 rounded">{p.department}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="ivp-mono text-[10px] font-semibold uppercase tracking-wide" style={{ color: tier.color }}>
                          {tier.label}
                        </span>
                        {p.skill.provisional && (
                          <span className="ivp-mono text-[9px] text-[#14213D]/45 uppercase tracking-wide">Provisional</span>
                        )}
                      </div>
                      {/* Level bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-[#E4DFD3] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${p.skill.level * 10}%`, background: tier.color }}
                        />
                      </div>
                      <span className="ivp-mono text-[9px] text-[#14213D]/45 mt-1 inline-block">
                        {p.wins}-{p.losses} · {p.games} game{p.games === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {unrated.length > 0 && (
            <div className="mt-4">
              <p className="ivp-mono text-[10px] uppercase tracking-wide text-[#14213D]/50 mb-2">Not yet rated</p>
              <div className="flex flex-wrap gap-2">
                {unrated.map((p) => (
                  <span key={p.id} className="ivp-card px-3 py-1.5 flex items-center gap-2">
                    <span className="text-xs font-medium">{p.name}</span>
                    {p.department && (
                      <span className="ivp-mono text-[9px] uppercase tracking-wide text-[#0051BA] bg-[#0051BA]/10 px-1.5 py-0.5 rounded">{p.department}</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="ivp-mono text-[9px] text-[#14213D]/45 mt-2">A rating appears after their first logged match.</p>
            </div>
          )}

          {skillRated.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                { label: "Beginner", range: "1–2", color: "#8A8A8A" },
                { label: "Developing", range: "3–4", color: "#C77700" },
                { label: "Intermediate", range: "5–6", color: "#2E7D32" },
                { label: "Advanced", range: "7–8", color: "#0051BA" },
                { label: "Elite", range: "9–10", color: "#7B2D8E" },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
                  <span className="ivp-mono text-[9px] uppercase tracking-wide text-[#14213D]/55">{t.label} {t.range}</span>
                </span>
              ))}
            </div>
          )}
        </section>
        </>)}

        {page === "gallery" && (<>
        {/* Gallery */}
        <section className="mb-14">
          <span className="ivp-eyebrow">Aisle 05 · Gallery</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {gallery.length === 0 && (
              <div className="ivp-card p-6 text-sm text-[#14213D]/60 col-span-full">No photos yet.</div>
            )}
            {gallery.map((p) => (
              <div key={p.id} className="relative group aspect-square overflow-hidden rounded ivp-card">
                <img src={p.url} alt={p.caption || "Club photo"} className="w-full h-full object-cover" loading="lazy" />
                {(p.caption || p.uploadedBy) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#14213D]/70 text-white px-2 py-1">
                    {p.caption && <div className="text-[10px] ivp-mono leading-tight">{p.caption}</div>}
                    {p.uploadedBy && <div className="text-[8px] ivp-mono opacity-70">{p.uploadedBy}</div>}
                  </div>
                )}
                {isAdmin && (
                  <button onClick={() => deletePhoto(p.id)} className="ivp-focus absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Trash2 size={13} className="text-red-600" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {myId ? (
            <div className="ivp-card p-4 mt-4">
              <p className="ivp-mono text-[11px] uppercase tracking-wide mb-3 text-[#0051BA]">Add a photo</p>
              <input
                placeholder="Caption (optional)"
                value={newPhoto.caption}
                onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                className="ivp-focus border border-[#E4DFD3] rounded px-2 py-2 text-xs w-full mb-2"
              />
              <label className={`ivp-btn-primary ivp-focus inline-flex items-center gap-1.5 text-xs cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                <Images size={14} />
                {uploading ? "Uploading…" : "Choose photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    e.target.value = "";
                    uploadPhoto(file);
                  }}
                />
              </label>
              {photoError && <p className="text-xs text-red-600 mt-2">{photoError}</p>}
              <p className="ivp-mono text-[9px] text-[#14213D]/45 mt-2">Opens your photo library. Max 10MB.</p>
            </div>
          ) : (
            <p className="text-xs text-[#14213D]/50 mt-4">Sign in to add photos.</p>
          )}
        </section>
        </>)}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-5 sm:px-8 pt-6 border-t border-[#E4DFD3] flex items-center justify-between">
        <p className="ivp-mono text-[10px] text-[#14213D]/40">IKEA Vaughan Pickleball Club</p>
        {!isAdmin && (
          <button onClick={() => setShowAdminGate(true)} className="ivp-focus text-[10px] text-[#14213D]/40 hover:text-[#0051BA] flex items-center gap-1">
            <Shield size={11} /> Staff
          </button>
        )}
      </footer>

      {/* Account modal: log in or create account */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-[#14213D]/50 flex items-center justify-center z-30 px-5" onClick={() => setShowAccountModal(false)}>
          <div className="ivp-card p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAccountModal(false)} className="ivp-focus absolute top-3 right-3 text-[#14213D]/40"><X size={16} /></button>
            <span className="ivp-eyebrow">Account</span>

            <div className="flex gap-1 mt-3 mb-4 bg-[#F4F1EA] rounded p-1">
              <button
                onClick={() => setAccountTab("login")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded ${accountTab === "login" ? "bg-white text-[#0051BA]" : "text-[#14213D]/50"}`}
              >
                Log in
              </button>
              <button
                onClick={() => setAccountTab("signup")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded ${accountTab === "signup" ? "bg-white text-[#0051BA]" : "text-[#14213D]/50"}`}
              >
                Create account
              </button>
            </div>

            {accountTab === "login" ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  placeholder="Name"
                  value={loginForm.name}
                  onChange={(e) => { setLoginForm({ ...loginForm, name: e.target.value }); setLoginError(""); }}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && logIn()}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                {loginError && <p className="text-xs text-red-600">{loginError}</p>}
                <button onClick={logIn} className="ivp-btn-primary ivp-focus w-full mt-2">Log in</button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  autoFocus
                  placeholder="Name"
                  value={signupForm.name}
                  onChange={(e) => { setSignupForm({ ...signupForm, name: e.target.value }); setSignupError(""); }}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                <input
                  placeholder="Department"
                  value={signupForm.department}
                  onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                <input
                  placeholder="Phone (staff only)"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={signupForm.password}
                  onChange={(e) => { setSignupForm({ ...signupForm, password: e.target.value }); setSignupError(""); }}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={signupForm.confirm}
                  onChange={(e) => { setSignupForm({ ...signupForm, confirm: e.target.value }); setSignupError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && signUp()}
                  className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
                />
                <ul className="space-y-1 pt-0.5">
                  {[
                    { ok: signupForm.password.length >= 6, label: "At least 6 characters" },
                    { ok: /[a-zA-Z]/.test(signupForm.password), label: "Contains a letter" },
                    { ok: /[0-9]/.test(signupForm.password), label: "Contains a number" },
                    { ok: signupForm.password.length > 0 && signupForm.password === signupForm.confirm, label: "Passwords match" },
                  ].map((c) => (
                    <li key={c.label} className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? "bg-[#7CB518]" : "bg-[#E4DFD3]"}`}
                      >
                        {c.ok && <Check size={9} className="text-white" strokeWidth={3} />}
                      </span>
                      <span className={c.ok ? "text-[#14213D]" : "text-[#14213D]/50"}>{c.label}</span>
                    </li>
                  ))}
                </ul>
                {signupError && <p className="text-xs text-red-600">{signupError}</p>}
                <button onClick={signUp} className="ivp-btn-primary ivp-focus w-full mt-2">Create account</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      {showProfileModal && myAccount && (
        <div className="fixed inset-0 bg-[#14213D]/50 flex items-center justify-center z-30 px-5" onClick={() => setShowProfileModal(false)}>
          <div className="ivp-card p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowProfileModal(false)} className="ivp-focus absolute top-3 right-3 text-[#14213D]/40"><X size={16} /></button>
            <span className="ivp-eyebrow">My profile</span>
            <h2 className="ivp-display font-bold text-lg mt-2 mb-4">{myAccount.name}</h2>
            <div className="space-y-2">
              <input
                autoFocus
                placeholder="Department"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
              />
              <input
                placeholder="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
              />
            </div>
            <button onClick={saveProfile} className="ivp-btn-primary ivp-focus w-full mt-4">Save</button>
          </div>
        </div>
      )}

      {/* Staff reset password modal */}
      {resetTargetId && (
        <div className="fixed inset-0 bg-[#14213D]/50 flex items-center justify-center z-30 px-5" onClick={() => setResetTargetId(null)}>
          <div className="ivp-card p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setResetTargetId(null)} className="ivp-focus absolute top-3 right-3 text-[#14213D]/40"><X size={16} /></button>
            <span className="ivp-eyebrow">Staff action</span>
            <h2 className="ivp-display font-bold text-lg mt-2 mb-1">Reset password</h2>
            <p className="text-xs text-[#14213D]/50 mb-4">
              For {accounts.find((a) => a.id === resetTargetId)?.name || "this player"}. Their match history stays intact.
            </p>
            <div className="space-y-2">
              <input
                autoFocus
                type="password"
                placeholder="New password (min 6, letter + number)"
                value={resetForm.password}
                onChange={(e) => { setResetForm({ ...resetForm, password: e.target.value }); setResetError(""); }}
                className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={resetForm.confirm}
                onChange={(e) => { setResetForm({ ...resetForm, confirm: e.target.value }); setResetError(""); }}
                onKeyDown={(e) => e.key === "Enter" && resetPassword()}
                className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
              />
              {resetError && <p className="text-xs text-red-600">{resetError}</p>}
            </div>
            <button onClick={resetPassword} className="ivp-btn-primary ivp-focus w-full mt-4">Set new password</button>
          </div>
        </div>
      )}

      {/* Admin gate modal */}
      {showAdminGate && (
        <div className="fixed inset-0 bg-[#14213D]/50 flex items-center justify-center z-30 px-5" onClick={() => setShowAdminGate(false)}>
          <div className="ivp-card p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAdminGate(false)} className="ivp-focus absolute top-3 right-3 text-[#14213D]/40"><X size={16} /></button>
            <span className="ivp-eyebrow">Staff access</span>
            <h2 className="ivp-display font-bold text-lg mt-2 mb-4">Enter staff passcode</h2>
            <input
              autoFocus
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && tryAdminUnlock()}
              className="ivp-focus border border-[#E4DFD3] rounded px-3 py-2 text-sm w-full"
            />
            {pwError && <p className="text-xs text-red-600 mt-1.5">Incorrect passcode.</p>}
            <button onClick={tryAdminUnlock} className="ivp-btn-primary ivp-focus w-full mt-4">Unlock</button>
          </div>
        </div>
      )}
    </div>
  );
}
