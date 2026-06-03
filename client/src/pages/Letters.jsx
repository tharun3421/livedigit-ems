// client/src/pages/Letters.jsx

import { useEffect, useState, useCallback } from "react";
import {
  MailIcon, SendIcon, Loader2Icon, Trash2Icon, EyeIcon,
  XIcon, ChevronDownIcon, FileTextIcon, AlertTriangleIcon, StarIcon,
} from "lucide-react";
import api       from "../api/axios";
import { useAuth } from "../context/authContext";

// ─── Template config ──────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    key:   "OFFER_LETTER",
    label: "Offer Letter",
    icon:  FileTextIcon,
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    desc:  "Formal job offer with position and terms",
    preview: (emp, custom) =>
      `Dear ${emp || "[Employee]"},\n\nWe are pleased to offer you the position discussed.\n\n${custom || "[Your custom message here]"}\n\nWarm regards,\nHR Department`,
  },
  {
    key:   "WARNING_LETTER",
    label: "Warning Letter",
    icon:  AlertTriangleIcon,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    desc:  "Official warning for disciplinary matters",
    preview: (emp, custom) =>
      `Dear ${emp || "[Employee]"},\n\nThis letter serves as an official warning.\n\n${custom || "[Your custom message here]"}\n\nRegards,\nHR Department`,
  },
  {
    key:   "APPRECIATION_LETTER",
    label: "Appreciation Letter",
    icon:  StarIcon,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    desc:  "Recognise outstanding contributions",
    preview: (emp, custom) =>
      `Dear ${emp || "[Employee]"},\n\nWe sincerely appreciate your outstanding contribution.\n\n${custom || "[Your custom message here]"}\n\nWith appreciation,\nHR Department`,
  },
];

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

// ─── Letter detail modal ──────────────────────────────────────────────────────
const LetterModal = ({ letter, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-800 sticky top-0 bg-slate-900">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              {TEMPLATES.find((t) => t.key === letter.templateType)?.label ?? letter.templateType}
            </p>
            <h2 className="text-sm font-semibold text-slate-100">{letter.subject}</h2>
            <p className="text-xs text-slate-500 mt-1">{fmtDate(letter.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {letter.renderedBody}
          </pre>
        </div>
      </div>
    </div>
  );
};

// ─── Admin View ───────────────────────────────────────────────────────────────
const AdminLetters = () => {
  const [employees,     setEmployees]     = useState([]);
  const [letters,       setLetters]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [viewLetter,    setViewLetter]    = useState(null);

  // Form state
  const [template,      setTemplate]      = useState("");
  const [recipient,     setRecipient]     = useState("");
  const [customText,    setCustomText]    = useState("");
  const [empSearch,     setEmpSearch]     = useState("");
  const [empOpen,       setEmpOpen]       = useState(false);

  const selectedEmp  = employees.find((e) => e._id === recipient);
  const filteredEmps = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase())
  );
  const selectedTpl  = TEMPLATES.find((t) => t.key === template);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, letRes] = await Promise.all([
        api.get("/employees"),
        api.get("/letters/all"),
      ]);
      setEmployees(empRes.data.data || empRes.data || []);
      setLetters(letRes.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSend = async () => {
    if (!template || !recipient || !customText.trim()) return;
    setSending(true);
    try {
      await api.post("/letters", {
        templateType:        template,
        customText:          customText.trim(),
        recipientEmployeeId: recipient,
      });
      setTemplate("");
      setRecipient("");
      setCustomText("");
      setEmpSearch("");
      await fetchAll();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to send letter");
    } finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this letter?")) return;
    setDeleting(id);
    try {
      await api.delete(`/letters/${id}`);
      setLetters((prev) => prev.filter((l) => l._id !== id));
    } catch { alert("Failed to delete"); }
    finally { setDeleting(null); }
  };

  const canSend = template && recipient && customText.trim();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Letters</h1>
        <p className="page-subtitle">Compose and send official letters to employees</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Compose panel ── */}
        <div className="card p-5 sm:p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <SendIcon className="w-4 h-4 text-indigo-400" /> Compose Letter
          </h2>

          {/* Template picker */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Select Template</p>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((tpl) => {
                const Icon    = tpl.icon;
                const active  = template === tpl.key;
                return (
                  <button
                    key={tpl.key}
                    onClick={() => setTemplate(tpl.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      active
                        ? `${tpl.color} border-current`
                        : "border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "" : "text-slate-500"}`} />
                    <div>
                      <p className="text-xs font-semibold">{tpl.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{tpl.desc}</p>
                    </div>
                    {active && <span className="ml-auto text-[10px] font-bold">Selected</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient picker */}
          <div className="relative">
            <p className="text-xs text-slate-400 mb-2">Recipient</p>
            <button
              onClick={() => setEmpOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-slate-600 transition-colors"
            >
              <span className={selectedEmp ? "text-slate-200" : "text-slate-500"}>
                {selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : "Choose employee…"}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${empOpen ? "rotate-180" : ""}`} />
            </button>

            {empOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-800">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search employee…"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredEmps.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No employees found</p>
                  ) : filteredEmps.map((e) => (
                    <button
                      key={e._id}
                      onClick={() => { setRecipient(e._id); setEmpOpen(false); setEmpSearch(""); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800 transition-colors ${recipient === e._id ? "bg-indigo-500/10 text-indigo-300" : "text-slate-300"}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-indigo-400">{e.firstName?.[0]}{e.lastName?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium">{e.firstName} {e.lastName}</p>
                        <p className="text-[10px] text-slate-500">{e.position} · {e.department}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom text */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Custom Message <span className="text-red-400">*</span></p>
            <textarea
              rows={5}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Write your personalised message. It will be inserted into the template…"
              className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors leading-relaxed"
            />
          </div>

          {/* Live preview */}
          {selectedTpl && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Preview</p>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed line-clamp-6">
                {selectedTpl.preview(
                  selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : undefined,
                  customText || undefined,
                )}
              </pre>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {sending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
            {sending ? "Sending…" : "Send Letter"}
          </button>
        </div>

        {/* ── Sent letters list ── */}
        <div className="card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-indigo-400" /> Sent Letters
            </h2>
            <span className="text-xs text-slate-500">{letters.length} total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2Icon className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span>
            </div>
          ) : letters.length === 0 ? (
            <div className="text-center py-12">
              <MailIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No letters sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
              {letters.map((l) => {
                const tpl = TEMPLATES.find((t) => t.key === l.templateType);
                const emp = l.recipientEmployeeId;
                return (
                  <div key={l._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                    <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${tpl?.color ?? "bg-slate-700 border-slate-600 text-slate-400"}`}>
                      {tpl ? <tpl.icon className="w-3.5 h-3.5" /> : <FileTextIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{l.subject}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        To: {emp?.firstName} {emp?.lastName} · {fmtDate(l.createdAt)}
                      </p>
                      <p className="text-[10px] mt-0.5">
                        {l.readAt
                          ? <span className="text-green-400">✓ Read</span>
                          : <span className="text-slate-500">Unread</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setViewLetter(l)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="View"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(l._id)}
                        disabled={deleting === l._id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === l._id ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <Trash2Icon className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewLetter && <LetterModal letter={viewLetter} onClose={() => setViewLetter(null)} />}
    </div>
  );
};

// ─── Employee View (Inbox) ────────────────────────────────────────────────────
const EmployeeLetters = () => {
  const [letters,    setLetters]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [viewLetter, setViewLetter] = useState(null);

  const fetchLetters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/letters");
      setLetters(res.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLetters(); }, [fetchLetters]);

  const handleOpen = async (letter) => {
    setViewLetter(letter);
    if (!letter.readAt) {
      try {
        await api.patch(`/letters/${letter._id}/read`);
        setLetters((prev) =>
          prev.map((l) => l._id === letter._id ? { ...l, readAt: new Date().toISOString() } : l)
        );
      } catch { /* silent */ }
    }
  };

  const unread = letters.filter((l) => !l.readAt).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          Letters
          {unread > 0 && (
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold">
              {unread} new
            </span>
          )}
        </h1>
        <p className="page-subtitle">Official letters sent to you by HR</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MailIcon className="w-4 h-4 text-indigo-400" /> Inbox
          </h2>
          <span className="text-xs text-slate-500">{letters.length} letter{letters.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2Icon className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-16">
            <MailIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No letters yet</p>
            <p className="text-slate-600 text-xs mt-1">Letters from HR will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {letters.map((l) => {
              const tpl    = TEMPLATES.find((t) => t.key === l.templateType);
              const isNew  = !l.readAt;
              return (
                <button
                  key={l._id}
                  onClick={() => handleOpen(l)}
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors text-left"
                >
                  {/* Unread dot */}
                  <div className="relative shrink-0 mt-1">
                    <div className={`p-2 rounded-xl border ${tpl?.color ?? "bg-slate-700 border-slate-600 text-slate-400"}`}>
                      {tpl ? <tpl.icon className="w-4 h-4" /> : <FileTextIcon className="w-4 h-4" />}
                    </div>
                    {isNew && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-900" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${isNew ? "font-semibold text-slate-100" : "font-medium text-slate-300"}`}>
                        {l.subject}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0">{fmtDate(l.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {tpl?.label ?? l.templateType}
                      {isNew && <span className="ml-2 text-[10px] text-indigo-400 font-semibold">NEW</span>}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                      {l.renderedBody.split("\n").find((ln) => ln.trim()) ?? ""}
                    </p>
                  </div>

                  <EyeIcon className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {viewLetter && <LetterModal letter={viewLetter} onClose={() => setViewLetter(null)} />}
    </div>
  );
};

// ─── Page entry point ─────────────────────────────────────────────────────────
const Letters = () => {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "ADMIN" ? <AdminLetters /> : <EmployeeLetters />;
};

export default Letters;