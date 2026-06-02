// client/src/components/attendance/AttendanceCalendarModal.jsx

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle, Send, Loader2 } from "lucide-react";
import api from "../../api/axios";

// ─── Legend dot ───────────────────────────────────────────────────────────────
const Dot = ({ color }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
);

// ─── Regularization mini-form ─────────────────────────────────────────────────
const RegularizationForm = ({ date, onSuccess, onClose, existingRequest }) => {
  const [reason, setReason]       = useState("");
  const [remarks, setRemarks]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const labelDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api.post("/regularization", { date, reason, remarks });
      setSubmitted(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (existingRequest) {
    const statusColors = {
      PENDING:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
      APPROVED: "text-green-400 bg-green-500/10 border-green-500/20",
      REJECTED: "text-red-400 bg-red-500/10 border-red-500/20",
    };
    return (
      <div className="mt-3 p-3 rounded-xl border bg-slate-800/60 border-slate-700">
        <p className="text-xs text-slate-400 mb-2 font-medium">Regularization Request</p>
        <div className={`text-xs px-3 py-2 rounded-lg border font-medium ${statusColors[existingRequest.status]}`}>
          {existingRequest.status === "PENDING" && "⏳ Request pending admin review"}
          {existingRequest.status === "APPROVED" && "✅ Request approved — marked Present"}
          {existingRequest.status === "REJECTED" && "❌ Request rejected"}
        </div>
        {existingRequest.adminRemarks && (
          <p className="text-xs text-slate-400 mt-2">
            Admin note: <span className="text-slate-300">{existingRequest.adminRemarks}</span>
          </p>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-3 p-3 rounded-xl border bg-green-500/10 border-green-500/20 text-green-400 text-xs font-medium text-center">
        ✅ Request submitted successfully!
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-xl border border-slate-700 bg-slate-800/60">
      <p className="text-xs font-semibold text-slate-300 mb-3">Apply Attendance Regularization</p>
      <p className="text-xs text-slate-400 mb-3">{labelDate}</p>

      <div className="mb-3">
        <label className="text-xs text-slate-400 block mb-1.5">Reason <span className="text-red-400">*</span></label>
        <div className="flex flex-col gap-2">
          {[
            { value: "FORGOT_TO_PUNCH", label: "Forgot to Punch" },
            { value: "SYSTEM_ISSUE",    label: "System / Technical Issue" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="reg-reason"
                value={opt.value}
                checked={reason === opt.value}
                onChange={() => setReason(opt.value)}
                className="w-3.5 h-3.5 accent-indigo-500"
              />
              <span className={`text-xs transition-colors ${reason === opt.value ? "text-indigo-300" : "text-slate-400 group-hover:text-slate-300"}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-slate-400 block mb-1.5">Remarks (optional)</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          placeholder="Add any additional context..."
          className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!reason || loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded-lg transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {loading ? "Submitting…" : "Submit Request"}
      </button>
    </div>
  );
};

// ─── Day detail panel ─────────────────────────────────────────────────────────
const DayDetail = ({ day, regularizations, onRegSuccess }) => {
  const [showForm, setShowForm] = useState(false);

  if (!day) return null;

  const { date, status, checkIn, checkOut, workingHours, dayType } = day;

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "—";

  const statusConfig = {
    PRESENT: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", label: "Present" },
    ABSENT:  { icon: XCircle,      color: "text-red-400",   bg: "bg-red-500/10 border-red-500/20",     label: "Absent"  },
    LATE:    { icon: Clock,        color: "text-yellow-400",bg: "bg-yellow-500/10 border-yellow-500/20",label: "Late"   },
    HOLIDAY: { icon: AlertCircle,  color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20",   label: "Holiday" },
    WEEKEND: { icon: AlertCircle,  color: "text-slate-400", bg: "bg-slate-700/40 border-slate-600/30", label: "Weekend" },
  };

  const cfg = statusConfig[status] || statusConfig.ABSENT;
  const Icon = cfg.icon;

  const labelDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long",
  });

  const existingReq = regularizations.find(
    (r) => new Date(r.date).toDateString() === new Date(date).toDateString()
  );

  const canRegularize = status === "ABSENT";

  return (
    <div className="mt-4 p-4 rounded-2xl border border-slate-700 bg-slate-800/40 text-sm">
      <p className="text-xs text-slate-400 mb-2">{labelDate}</p>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cfg.bg} mb-3`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
        {dayType && <span className="text-xs text-slate-400 ml-auto">{dayType}</span>}
      </div>

      {(checkIn || checkOut) && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="text-xs text-slate-500">Check-in</p>
            <p className="text-xs font-medium text-slate-200 mt-0.5">{fmt(checkIn)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="text-xs text-slate-500">Check-out</p>
            <p className="text-xs font-medium text-slate-200 mt-0.5">{fmt(checkOut)}</p>
          </div>
          {workingHours && (
            <div className="col-span-2 bg-slate-900/60 rounded-lg p-2">
              <p className="text-xs text-slate-500">Working Hours</p>
              <p className="text-xs font-medium text-slate-200 mt-0.5">{workingHours}h</p>
            </div>
          )}
        </div>
      )}

      {canRegularize && !showForm && !existingReq && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mt-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors py-2 rounded-lg font-medium"
        >
          Apply Attendance Regularization
        </button>
      )}

      {(showForm || existingReq) && (
        <RegularizationForm
          date={date}
          existingRequest={existingReq}
          onSuccess={onRegSuccess}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const AttendanceCalendarModal = ({ onClose }) => {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [records,   setRecords]   = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, regRes] = await Promise.all([
        api.get("/attendance"),
        api.get("/regularization/my"),
      ]);
      setRecords(attRes.data.data || []);
      setRegularizations(regRes.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Build a date → status map from records
  const statusMap = {};
  records.forEach((r) => {
    const key = new Date(r.date).toDateString();
    statusMap[key] = r;
  });

  // Calendar grid
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const blanks     = Array(firstDay).fill(null);
  const days       = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelected(null);
  };

  const getDayInfo = (dayNum) => {
    const d    = new Date(viewYear, viewMonth, dayNum);
    const key  = d.toDateString();
    const rec  = statusMap[key];
    const dow  = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isFuture  = d > today;

    if (isFuture)    return { date: d.toISOString(), status: "FUTURE" };
    if (isWeekend)   return { date: d.toISOString(), status: "WEEKEND" };
    if (rec)         return { ...rec, date: d.toISOString() };
    return { date: d.toISOString(), status: "ABSENT" };
  };

  const cellStyle = (status) => {
    switch (status) {
      case "PRESENT": return "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30";
      case "LATE":    return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30";
      case "ABSENT":  return "bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25";
      case "WEEKEND": return "bg-slate-700/30 text-slate-500 border border-slate-700/30";
      case "FUTURE":  return "text-slate-600 border border-transparent cursor-default";
      default:        return "text-slate-500 border border-transparent";
    }
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Attendance Calendar</h2>
            <p className="text-xs text-slate-500 mt-0.5">{monthLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-200">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {blanks.map((_, i) => <div key={`b-${i}`} />)}
              {days.map((dayNum) => {
                const info = getDayInfo(dayNum);
                const isSelected = selected && new Date(selected.date).getDate() === dayNum
                  && new Date(selected.date).getMonth() === viewMonth;
                return (
                  <button
                    key={dayNum}
                    onClick={() => info.status !== "FUTURE" && setSelected(info)}
                    disabled={info.status === "FUTURE"}
                    className={`
                      relative aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                      ${cellStyle(info.status)}
                      ${isSelected ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900" : ""}
                    `}
                  >
                    {dayNum}
                    {/* Regularization dot indicator */}
                    {regularizations.some(
                      (r) => new Date(r.date).toDateString() === new Date(viewYear, viewMonth, dayNum).toDateString()
                    ) && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4">
            {[
              { color: "bg-green-500",  label: "Present" },
              { color: "bg-red-500",    label: "Absent"  },
              { color: "bg-yellow-500", label: "Late"    },
              { color: "bg-slate-600",  label: "Weekend" },
              { color: "bg-indigo-400", label: "Regularization" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Dot color={color} />
                <span className="text-[10px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Day detail */}
          {selected && (
            <DayDetail
              day={selected}
              regularizations={regularizations}
              onRegSuccess={fetchData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendarModal;