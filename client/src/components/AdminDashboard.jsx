

import {
  Building2Icon, CalendarIcon, FileTextIcon, UsersIcon,
  ClockIcon, LogInIcon, LogOutIcon, Loader2Icon,
  CheckCircleIcon, XCircleIcon, ClipboardListIcon,
  IndianRupeeIcon, BellIcon, CalendarDaysIcon, ArrowRightIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const REASON_LABELS = {
  FORGOT_TO_CHECKIN: "Forgot to check in",
  SYSTEM_ERROR:      "System / device error",
  WORKED_FROM_HOME:  "Worked from home",
  CLIENT_VISIT:      "Client / field visit",
  OTHER:             "Other",
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    PRESENT:  "bg-green-500/15 text-green-400",
    LATE:     "bg-yellow-500/15 text-yellow-400",
    ABSENT:   "bg-rose-500/15 text-rose-400",
    PENDING:  "bg-orange-500/15 text-orange-400",
    APPROVED: "bg-green-500/15 text-green-400",
    REJECTED: "bg-rose-500/15 text-rose-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ firstName, lastName }) => (
  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
    <span className="text-xs font-bold text-indigo-400">{firstName?.[0]}{lastName?.[0]}</span>
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, value, label, description, onClick }) => (
  <div
    onClick={onClick}
    className={`card card-hover p-4 sm:p-5 lg:p-6 relative overflow-hidden group flex items-center justify-between ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
    <div className="min-w-0">
      <p className="text-xs sm:text-sm text-slate-400 leading-tight">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">{value ?? 0}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
    <Icon className="size-8 sm:size-10 p-1.5 sm:p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0 ml-2" />
  </div>
);

// ─── Quick Nav Card ───────────────────────────────────────────────────────────
const QuickNavCard = ({ icon: Icon, label, description, accent, onClick }) => (
  <div
    onClick={onClick}
    className="card card-hover p-4 sm:p-5 cursor-pointer group relative overflow-hidden flex items-center gap-4"
  >
    <div className={`p-2.5 rounded-xl ${accent.bg} shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-5 h-5 ${accent.icon}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
    </div>
    <ArrowRightIcon className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
  </div>
);

// ─── Today Attendance Table (desktop) ─────────────────────────────────────────
const AttendanceTable = ({ records }) => (
  <div className="hidden sm:block overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-800">
          {["Employee", "Department", "Status", "Clock In", "Clock Out", "Hours"].map((h, i) => (
            <th key={h} className={`text-left py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? "px-5" : "px-4"}`}>
              {h === "Clock In"
                ? <span className="flex items-center gap-1"><LogInIcon  className="w-3.5 h-3.5 text-green-400" />{h}</span>
                : h === "Clock Out"
                  ? <span className="flex items-center gap-1"><LogOutIcon className="w-3.5 h-3.5 text-rose-400"  />{h}</span>
                  : h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/60">
        {records.map((r) => (
          <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar firstName={r.employee?.firstName} lastName={r.employee?.lastName} />
                <div>
                  <p className="text-sm font-medium text-slate-200">{r.employee?.firstName} {r.employee?.lastName}</p>
                  <p className="text-xs text-slate-500">{r.employee?.position}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{r.employee?.department ?? "—"}</span>
            </td>
            <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
            <td className="px-4 py-3.5"><span className="text-green-400 font-medium font-mono text-xs">{fmt(r.checkIn)}</span></td>
            <td className="px-4 py-3.5">
              {r.checkOut
                ? <span className="text-rose-400 font-medium font-mono text-xs">{fmt(r.checkOut)}</span>
                : <span className="inline-flex items-center gap-1 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />In office</span>}
            </td>
            <td className="px-4 py-3.5">
              {r.workingHours != null
                ? <span className="text-slate-300 text-xs font-medium">{r.workingHours.toFixed(1)}h{r.dayType && <span className="ml-1.5 text-slate-500">· {r.dayType}</span>}</span>
                : <span className="text-slate-600 text-xs">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Today Attendance Cards (mobile) ─────────────────────────────────────────
const AttendanceCards = ({ records }) => (
  <div className="sm:hidden divide-y divide-slate-800/60">
    {records.map((r) => (
      <div key={r._id} className="px-4 py-3.5 flex items-start gap-3">
        <Avatar firstName={r.employee?.firstName} lastName={r.employee?.lastName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-slate-200 truncate">{r.employee?.firstName} {r.employee?.lastName}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-xs text-slate-500 mb-2">{r.employee?.position} · {r.employee?.department ?? "—"}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-green-400"><LogInIcon className="w-3 h-3" />{fmt(r.checkIn)}</span>
            {r.checkOut
              ? <span className="flex items-center gap-1 text-xs text-rose-400"><LogOutIcon className="w-3 h-3" />{fmt(r.checkOut)}</span>
              : <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />In office</span>}
            {r.workingHours != null && (
              <span className="text-xs text-slate-400">{r.workingHours.toFixed(1)}h{r.dayType && ` · ${r.dayType}`}</span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Regularization Requests Section ─────────────────────────────────────────
const RegularizationSection = () => {
  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [reviewing,    setReviewing]    = useState(null);
  const [adminRemarks, setAdminRemarks] = useState({});
  const [filter,       setFilter]       = useState("PENDING");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/regularization");
      setRequests(res.data.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, status) => {
    setReviewing(id);
    try {
      await api.patch(`/regularization/${id}`, { status, adminRemark: adminRemarks[id] || "" });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      await fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update request");
    } finally {
      setReviewing(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const filtered     = requests.filter((r) => filter === "ALL" || r.status === filter);
  const FILTERS      = ["PENDING", "APPROVED", "REJECTED", "ALL"];

  return (
    <div className="card overflow-hidden mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
            <ClipboardListIcon className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
              Attendance Regularization
              {pendingCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                  {pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Review employee attendance correction requests</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filter === f ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2Icon className="w-5 h-5 animate-spin" /><span className="text-sm">Loading requests…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardListIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No {filter === "ALL" ? "" : filter.toLowerCase() + " "}requests</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {filtered.map((req) => {
            const emp         = req.employee;
            const isActioning = reviewing === req._id;
            return (
              <div key={req._id} className="px-4 sm:px-5 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar firstName={emp?.firstName} lastName={emp?.lastName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-200">{emp?.firstName} {emp?.lastName}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{emp?.position} · {emp?.department}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Date </span>
                        <span className="text-xs font-medium text-slate-200">{fmtDate(req.date)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reason </span>
                        <span className="text-xs font-medium text-slate-200">{REASON_LABELS[req.reason] || req.reason}</span>
                      </div>
                    </div>
                    {req.remarks && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        <span className="text-slate-500">Note: </span>{req.remarks}
                      </p>
                    )}
                  </div>
                </div>

                {req.status === "PENDING" && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-11">
                    <input
                      type="text"
                      placeholder="Admin remark (optional)"
                      value={adminRemarks[req._id] || ""}
                      onChange={(e) => setAdminRemarks((p) => ({ ...p, [req._id]: e.target.value }))}
                      className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req._id, "APPROVED")}
                        disabled={isActioning}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                      >
                        {isActioning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req._id, "REJECTED")}
                        disabled={isActioning}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                      >
                        {isActioning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {req.status !== "PENDING" && req.adminRemark && (
                  <p className="text-xs text-slate-400 mt-2 sm:ml-11">
                    <span className="text-slate-500">Admin note: </span>{req.adminRemark}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
const AdminDashboard = ({ data }) => {
  const navigate = useNavigate();
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attLoading,      setAttLoading]      = useState(true);

  useEffect(() => {
    api.get("/attendance/today")
      .then((res) => setTodayAttendance(res.data.data || []))
      .catch(() => setTodayAttendance([]))
      .finally(() => setAttLoading(false));
  }, []);

  const stillIn    = todayAttendance.filter((r) => !r.checkOut);
  const checkedOut = todayAttendance.filter((r) =>  r.checkOut);

  // ── Quick nav cards (sidebar links minus Settings) ────────────────────────
  const quickNav = [
    {
      icon:        UsersIcon,
      label:       "Employees",
      description: "Manage all employee profiles",
      accent:      { bg: "bg-indigo-500/10",  icon: "text-indigo-400"  },
      onClick:     () => navigate("/employees"),
    },
    {
      icon:        FileTextIcon,
      label:       "Leave Requests",
      description: "Review and approve leave applications",
      accent:      { bg: "bg-rose-500/10",    icon: "text-rose-400"    },
      onClick:     () => navigate("/leave"),
    },
    {
      icon:        IndianRupeeIcon,
      label:       "Payslips",
      description: "Generate and manage monthly payslips",
      accent:      { bg: "bg-green-500/10",   icon: "text-green-400"   },
      onClick:     () => navigate("/payslips"),
    },
    {
      icon:        CalendarDaysIcon,
      label:       "Calendar",
      description: "Holidays and company events",
      accent:      { bg: "bg-cyan-500/10",    icon: "text-cyan-400"    },
      onClick:     () => navigate("/calendar"),
    },
    {
      icon:        BellIcon,
      label:       "Announcements",
      description: "Post and manage announcements",
      accent:      { bg: "bg-amber-500/10",   icon: "text-amber-400"   },
      onClick:     () => navigate("/announcements"),
    },
    // {
    //   icon:        CalendarIcon,
    //   label:       "Attendance",
    //   description: "View and manage attendance records",
    //   accent:      { bg: "bg-violet-500/10",  icon: "text-violet-400"  },
    //   onClick:     () => navigate("/attendance"),
    // },
    {
      icon:        FileTextIcon,
      label:       "Leave Requests",
      description: "Review and approve leave applications",
      accent:      { bg: "bg-violet-500/10",    icon: "text-violet-400"    },
      onClick:     () => navigate("/letters"),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, Admin — here's your overview</p>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-0.5">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickNav.map((n) => <QuickNavCard key={n.label} {...n} />)}
        </div>
      </div>

      {/* ── Today's Attendance ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
              <ClockIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100">Today's Attendance</h2>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 sm:hidden">
                {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium whitespace-nowrap">
              {stillIn.length} <span className="hidden sm:inline">in office</span>
            </span>
            <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full bg-slate-700 text-slate-400 font-medium whitespace-nowrap">
              {checkedOut.length} <span className="hidden sm:inline">checked out</span>
            </span>
          </div>
        </div>

        {attLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2Icon className="w-5 h-5 animate-spin" /><span className="text-sm">Loading attendance…</span>
          </div>
        ) : todayAttendance.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No employees have clocked in today</p>
          </div>
        ) : (
          <>
            <AttendanceTable records={todayAttendance} />
            <AttendanceCards records={todayAttendance} />
          </>
        )}
      </div>

      {/* ── Regularization Requests ── */}
      <RegularizationSection />
    </div>
  );
};

export default AdminDashboard;