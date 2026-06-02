// import { Building2Icon, CalendarIcon, FileTextIcon, UsersIcon, ClockIcon, LogInIcon, LogOutIcon, Loader2Icon } from 'lucide-react'
// import { useEffect, useState } from 'react'
// import api from '../api/axios'

// // ── time formatter ────────────────────────────────────────────────────────────
// const fmt = (iso) => {
//     if (!iso) return "—"
//     return new Date(iso).toLocaleTimeString("en-IN", {
//         hour:   "2-digit",
//         minute: "2-digit",
//         hour12: true,
//     })
// }

// // ── status badge ──────────────────────────────────────────────────────────────
// const StatusBadge = ({ status }) => {
//     const map = {
//         PRESENT: "bg-green-500/15 text-green-400",
//         LATE:    "bg-yellow-500/15 text-yellow-400",
//         ABSENT:  "bg-rose-500/15 text-rose-400",
//     }
//     return (
//         <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? map.ABSENT}`}>
//             {status}
//         </span>
//     )
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// const AdminDashboard = ({ data }) => {
//     const [todayAttendance, setTodayAttendance] = useState([])
//     const [attLoading,      setAttLoading]      = useState(true)

//     useEffect(() => {
//         api.get("/attendance/today")
//             .then((res) => setTodayAttendance(res.data.data || []))
//             .catch(() => setTodayAttendance([]))
//             .finally(() => setAttLoading(false))
//     }, [])

//     const stats = [
//         { icon: UsersIcon,    value: data.totalEmployees,  label: "Total Employees",    description: "Active workforce"      },
//         { icon: Building2Icon,value: data.totalDepartments,label: "Departments",         description: "Organisation units"    },
//         { icon: CalendarIcon, value: data.totalAttendance, label: "Today's Attendance",  description: "Checked in today"      },
//         { icon: FileTextIcon, value: data.pendingLeaves,   label: "Pending Leave Request",      description: "Awaiting approval"     },
//     ]

//     // Split into still-in and checked-out
//     const stillIn    = todayAttendance.filter((r) => !r.checkOut)
//     const checkedOut = todayAttendance.filter((r) =>  r.checkOut)

//     return (
//         <div className="animate-fade-in">
//             <div className="page-header">
//                 <h1 className="page-title">Dashboard</h1>
//                 <p className="page-subtitle">Welcome back, Admin — here's your overview</p>
//             </div>

//             {/* ── Stat Cards ── */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
//                 {stats.map((s) => (
//                     <div key={s.label} className="card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between">
//                         <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
//                         <div>
//                             <p className="text-sm text-slate-400">{s.label}</p>
//                             <p className="text-2xl font-bold text-slate-100 mt-0.5">{s.value ?? 0}</p>
//                             <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
//                         </div>
//                         <s.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0" />
//                     </div>
//                 ))}
//             </div>

//             {/* ── Today's Attendance ── */}
//             <div className="card overflow-hidden">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
//                     <div className="flex items-center gap-3">
//                         <div className="p-2 rounded-lg bg-indigo-500/10">
//                             <ClockIcon className="w-4 h-4 text-indigo-400" />
//                         </div>
//                         <div>
//                             <h2 className="text-sm font-semibold text-slate-100">Today's Attendance</h2>
//                             <p className="text-xs text-slate-500 mt-0.5">
//                                 {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">
//                             {stillIn.length} in office
//                         </span>
//                         <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-400 font-medium">
//                             {checkedOut.length} checked out
//                         </span>
//                     </div>
//                 </div>

//                 {attLoading ? (
//                     <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
//                         <Loader2Icon className="w-5 h-5 animate-spin" />
//                         <span className="text-sm">Loading attendance…</span>
//                     </div>
//                 ) : todayAttendance.length === 0 ? (
//                     <div className="text-center py-12">
//                         <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
//                         <p className="text-slate-400 text-sm">No employees have clocked in today</p>
//                     </div>
//                 ) : (
//                     <div className="overflow-x-auto">
//                         <table className="w-full text-sm">
//                             <thead>
//                                 <tr className="border-b border-slate-800">
//                                     <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
//                                     <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
//                                     <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
//                                     <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
//                                         <span className="flex items-center gap-1"><LogInIcon className="w-3.5 h-3.5 text-green-400" /> Clock In</span>
//                                     </th>
//                                     <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
//                                         <span className="flex items-center gap-1"><LogOutIcon className="w-3.5 h-3.5 text-rose-400" /> Clock Out</span>
//                                     </th>
//                                     <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-800/60">
//                                 {todayAttendance.map((record) => (
//                                     <tr key={record._id} className="hover:bg-slate-800/30 transition-colors">
//                                         {/* Employee */}
//                                         <td className="px-5 py-3.5">
//                                             <div className="flex items-center gap-3">
//                                                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
//                                                     <span className="text-xs font-bold text-indigo-400">
//                                                         {record.employee?.firstName?.[0]}{record.employee?.lastName?.[0]}
//                                                     </span>
//                                                 </div>
//                                                 <div>
//                                                     <p className="text-sm font-medium text-slate-200">
//                                                         {record.employee?.firstName} {record.employee?.lastName}
//                                                     </p>
//                                                     <p className="text-xs text-slate-500">{record.employee?.position}</p>
//                                                 </div>
//                                             </div>
//                                         </td>

//                                         {/* Department */}
//                                         <td className="px-4 py-3.5">
//                                             <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
//                                                 {record.employee?.department ?? "—"}
//                                             </span>
//                                         </td>

//                                         {/* Status */}
//                                         <td className="px-4 py-3.5">
//                                             <StatusBadge status={record.status} />
//                                         </td>

//                                         {/* Clock In */}
//                                         <td className="px-4 py-3.5">
//                                             <span className="text-green-400 font-medium font-mono text-xs">
//                                                 {fmt(record.checkIn)}
//                                             </span>
//                                         </td>

//                                         {/* Clock Out */}
//                                         <td className="px-4 py-3.5">
//                                             {record.checkOut ? (
//                                                 <span className="text-rose-400 font-medium font-mono text-xs">
//                                                     {fmt(record.checkOut)}
//                                                 </span>
//                                             ) : (
//                                                 <span className="inline-flex items-center gap-1 text-xs text-green-400">
//                                                     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
//                                                     In office
//                                                 </span>
//                                             )}
//                                         </td>

//                                         {/* Working Hours */}
//                                         <td className="px-4 py-3.5">
//                                             {record.workingHours != null ? (
//                                                 <span className="text-slate-300 text-xs font-medium">
//                                                     {record.workingHours.toFixed(1)}h
//                                                     {record.dayType && (
//                                                         <span className="ml-1.5 text-slate-500">· {record.dayType}</span>
//                                                     )}
//                                                 </span>
//                                             ) : (
//                                                 <span className="text-slate-600 text-xs">—</span>
//                                             )}
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }

// export default AdminDashboard




// client/src/components/AdminDashboard.jsx
// Replace your existing AdminDashboard.jsx with this file.

import {
  Building2Icon, CalendarIcon, FileTextIcon, UsersIcon,
  ClockIcon, LogInIcon, LogOutIcon, Loader2Icon,
  CheckCircleIcon, XCircleIcon, ClipboardListIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";

// ─── Time formatter ───────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    PRESENT:  "bg-green-500/15 text-green-400",
    LATE:     "bg-yellow-500/15 text-yellow-400",
    ABSENT:   "bg-rose-500/15 text-rose-400",
    PENDING:  "bg-yellow-500/15 text-yellow-400",
    APPROVED: "bg-green-500/15 text-green-400",
    REJECTED: "bg-rose-500/15 text-rose-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? map.ABSENT}`}>
      {status}
    </span>
  );
};

// ─── Regularization reason label ──────────────────────────────────────────────
const reasonLabel = (reason) => {
  const map = {
    FORGOT_TO_PUNCH: "Forgot to Punch",
    SYSTEM_ISSUE:    "System / Technical Issue",
  };
  return map[reason] || reason;
};

// ─── Regularization Review Section ───────────────────────────────────────────
const RegularizationSection = () => {
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [reviewing,     setReviewing]     = useState(null); // id of row being actioned
  const [adminRemarks,  setAdminRemarks]  = useState({});   // { [id]: string }
  const [filter,        setFilter]        = useState("PENDING");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/regularization/all");
      setRequests(res.data.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReview = async (id, action) => {
    setReviewing(id);
    try {
      await api.patch(`/regularization/${id}/review`, {
        action,
        adminRemarks: adminRemarks[id] || "",
      });
      await fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to review request");
    } finally {
      setReviewing(null);
    }
  };

  const filtered = requests.filter((r) => filter === "ALL" ? true : r.status === filter);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="card overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <ClipboardListIcon className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Attendance Regularization Requests
              {pendingCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                  {pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review employee attendance correction requests
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2Icon className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading requests…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardListIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No {filter.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {filtered.map((req) => {
            const emp = req.employeeId;
            const isActioning = reviewing === req._id;
            return (
              <div key={req._id} className="px-5 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Employee info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-400">
                        {emp?.firstName?.[0]}{emp?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200">
                        {emp?.firstName} {emp?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {emp?.position} · {emp?.department}
                      </p>
                    </div>
                  </div>

                  {/* Request info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Date</p>
                      <p className="text-xs font-semibold text-slate-200">{fmtDate(req.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Reason</p>
                      <p className="text-xs font-semibold text-slate-200">{reasonLabel(req.reason)}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                </div>

                {/* Remarks row */}
                {req.remarks && (
                  <p className="text-xs text-slate-400 mt-2 ml-12">
                    <span className="text-slate-500">Employee note: </span>{req.remarks}
                  </p>
                )}

                {/* Admin action (only for PENDING) */}
                {req.status === "PENDING" && (
                  <div className="mt-3 ml-12 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Admin remarks (optional)"
                      value={adminRemarks[req._id] || ""}
                      onChange={(e) =>
                        setAdminRemarks((prev) => ({ ...prev, [req._id]: e.target.value }))
                      }
                      className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 min-w-0"
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleReview(req._id, "APPROVED")}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                      >
                        {isActioning ? (
                          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(req._id, "REJECTED")}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 text-xs bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                      >
                        {isActioning ? (
                          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircleIcon className="w-3.5 h-3.5" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Show admin remarks for reviewed */}
                {req.status !== "PENDING" && req.adminRemarks && (
                  <p className="text-xs text-slate-400 mt-2 ml-12">
                    <span className="text-slate-500">Admin note: </span>{req.adminRemarks}
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
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attLoading,      setAttLoading]      = useState(true);

  useEffect(() => {
    api.get("/attendance/today")
      .then((res) => setTodayAttendance(res.data.data || []))
      .catch(() => setTodayAttendance([]))
      .finally(() => setAttLoading(false));
  }, []);

  const stats = [
    { icon: UsersIcon,    value: data.totalEmployees,   label: "Total Employees",       description: "Active workforce"    },
    { icon: Building2Icon,value: data.totalDepartments, label: "Departments",            description: "Organisation units"  },
    { icon: CalendarIcon, value: data.totalAttendance,  label: "Today's Attendance",    description: "Checked in today"    },
    { icon: FileTextIcon, value: data.pendingLeaves,    label: "Pending Leave Request", description: "Awaiting approval"   },
  ];

  const stillIn    = todayAttendance.filter((r) => !r.checkOut);
  const checkedOut = todayAttendance.filter((r) =>  r.checkOut);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, Admin — here's your overview</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
            <div>
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-slate-100 mt-0.5">{s.value ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
            </div>
            <s.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0" />
          </div>
        ))}
      </div>

      {/* ── Today's Attendance ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <ClockIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Today's Attendance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">
              {stillIn.length} in office
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-400 font-medium">
              {checkedOut.length} checked out
            </span>
          </div>
        </div>

        {attLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2Icon className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading attendance…</span>
          </div>
        ) : todayAttendance.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No employees have clocked in today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><LogInIcon className="w-3.5 h-3.5 text-green-400" /> Clock In</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><LogOutIcon className="w-3.5 h-3.5 text-rose-400" /> Clock Out</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {todayAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-400">
                            {record.employee?.firstName?.[0]}{record.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {record.employee?.firstName} {record.employee?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{record.employee?.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {record.employee?.department ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-green-400 font-medium font-mono text-xs">{fmt(record.checkIn)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {record.checkOut ? (
                        <span className="text-rose-400 font-medium font-mono text-xs">{fmt(record.checkOut)}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          In office
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {record.workingHours != null ? (
                        <span className="text-slate-300 text-xs font-medium">
                          {record.workingHours.toFixed(1)}h
                          {record.dayType && (
                            <span className="ml-1.5 text-slate-500">· {record.dayType}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Attendance Regularization Requests ── */}
      <RegularizationSection />
    </div>
  );
};

export default AdminDashboard;