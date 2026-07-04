import { useEffect, useState } from "react"
import {
    ClipboardListIcon, CheckCircleIcon, XCircleIcon,
    Loader2Icon, SearchIcon, ClockIcon,
} from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"

const fmtDate = (iso) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

const REASON_LABELS = {
    FORGOT_TO_CHECKIN: "Forgot to check in",
    SYSTEM_ERROR:      "System / device error",
    WORKED_FROM_HOME:  "Worked from home",
    CLIENT_VISIT:      "Client / field visit",
    OTHER:             "Other",
}

const FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"]

const StatusBadge = ({ status }) => {
    const map = {
        PENDING:  "bg-orange-500/15 text-orange-400 border border-orange-500/20",
        APPROVED: "bg-green-500/15  text-green-400  border border-green-500/20",
        REJECTED: "bg-rose-500/15   text-rose-400   border border-rose-500/20",
    }
    return (
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${map[status] ?? "bg-slate-700 text-slate-400"}`}>
            {status}
        </span>
    )
}

const Avatar = ({ firstName, lastName }) => (
    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-indigo-400">{firstName?.[0]}{lastName?.[0]}</span>
    </div>
)

const RequestCard = ({ req, isLate, reviewing, adminRemarks, setAdminRemarks, handleAction }) => {
    const emp         = req.employee
    const isActioning = reviewing === req._id

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-slate-800/20 transition-colors">
            <div className="flex items-start gap-3">
                <Avatar firstName={emp?.firstName} lastName={emp?.lastName} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200">
                            {emp?.firstName} {emp?.lastName}
                        </p>
                        <div className="flex items-center gap-2">
                            {isLate && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                                    LATE REG
                                </span>
                            )}
                            <StatusBadge status={req.status} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {emp?.position} · {emp?.department}
                    </p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2.5">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Date</span>
                            <span className="text-xs font-medium text-slate-200">{fmtDate(req.date)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Reason</span>
                            <span className="text-xs font-medium text-slate-200">
                                {isLate ? req.reason : (REASON_LABELS[req.reason] || req.reason)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Requested</span>
                            <span className="text-xs font-medium text-slate-200">{fmtDate(req.createdAt)}</span>
                        </div>
                    </div>

                    {isLate && req.status === "APPROVED" && (
                        <p className="text-xs text-teal-400 mt-2 bg-teal-500/5 border border-teal-500/15 rounded-lg px-3 py-1.5">
                            ✓ Counted as <strong>Present</strong> for salary calculations
                        </p>
                    )}

                    {req.remarks && (
                        <p className="text-xs text-slate-400 mt-2 bg-slate-800/50 rounded-lg px-3 py-2">
                            <span className="text-slate-500 font-medium">Employee note: </span>{req.remarks}
                        </p>
                    )}
                </div>
            </div>

            {req.status === "PENDING" && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-12">
                    <input
                        type="text"
                        placeholder="Add admin remark (optional)"
                        value={adminRemarks[req._id] || ""}
                        onChange={(e) => setAdminRemarks((p) => ({ ...p, [req._id]: e.target.value }))}
                        className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => handleAction(req._id, "APPROVED", isLate)}
                            disabled={isActioning}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isActioning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                            Approve
                        </button>
                        <button
                            onClick={() => handleAction(req._id, "REJECTED", isLate)}
                            disabled={isActioning}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isActioning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                            Reject
                        </button>
                    </div>
                </div>
            )}

            {req.status !== "PENDING" && req.adminRemark && (
                <p className="text-xs text-slate-400 mt-2 sm:ml-12 bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-500 font-medium">Admin note: </span>{req.adminRemark}
                </p>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const AttendanceRegularization = () => {
    const [requests,     setRequests]     = useState([])
    const [lateRequests, setLateRequests] = useState([])
    const [loading,      setLoading]      = useState(true)
    const [reviewing,    setReviewing]    = useState(null)
    const [adminRemarks, setAdminRemarks] = useState({})
    const [filter,       setFilter]       = useState("PENDING")
    const [search,       setSearch]       = useState("")
    const [tab,          setTab]          = useState("absent")

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const [absRes, lateRes] = await Promise.all([
                api.get("/regularization"),
                api.get("/regularization?type=LATE"),
            ])
            setRequests(absRes.data.data || [])
            setLateRequests(lateRes.data.data || [])
        } catch {
            setRequests([])
            setLateRequests([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchRequests() }, [])

    const handleAction = async (id, status, isLate = false) => {
        setReviewing(id)
        try {
            const endpoint = isLate ? `/regularization/late/${id}` : `/regularization/${id}`
            await api.patch(endpoint, { status, adminRemark: adminRemarks[id] || "" })
            toast.success(`Request ${status.toLowerCase()} successfully`)
            await fetchRequests()
        } catch (err) {
            toast.error(err?.response?.data?.error || "Failed to update request")
        } finally {
            setReviewing(null)
        }
    }

    const activeList = tab === "absent" ? requests : lateRequests

    const counts = {
        PENDING:  activeList.filter((r) => r.status === "PENDING").length,
        APPROVED: activeList.filter((r) => r.status === "APPROVED").length,
        REJECTED: activeList.filter((r) => r.status === "REJECTED").length,
        ALL:      activeList.length,
    }

    const absentPending = requests.filter((r) => r.status === "PENDING").length
    const latePending   = lateRequests.filter((r) => r.status === "PENDING").length

    const filtered = activeList
        .filter((r) => filter === "ALL" || r.status === filter)
        .filter((r) => {
            if (!search.trim()) return true
            const q = search.toLowerCase()
            return (
                r.employee?.firstName?.toLowerCase().includes(q) ||
                r.employee?.lastName?.toLowerCase().includes(q)  ||
                r.employee?.department?.toLowerCase().includes(q) ||
                (tab === "absent"
                    ? (REASON_LABELS[r.reason] || r.reason).toLowerCase().includes(q)
                    : r.reason?.toLowerCase().includes(q))
            )
        })

    return (
        <div className="animate-fade-in">

            <div className="page-header">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <ClipboardListIcon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="page-title">Attendance Regularization</h1>
                        <p className="page-subtitle">Review and action employee attendance correction requests</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit mb-6">
                <button
                    onClick={() => { setTab("absent"); setFilter("PENDING"); setSearch("") }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tab === "absent"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <ClipboardListIcon className="w-4 h-4" />
                    Absent Regularization
                    {absentPending > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            tab === "absent" ? "bg-white/20 text-white" : "bg-orange-500 text-white"
                        }`}>
                            {absentPending}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => { setTab("late"); setFilter("PENDING"); setSearch("") }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tab === "late"
                            ? "bg-amber-600 text-white shadow"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <ClockIcon className="w-4 h-4" />
                    Late Regularization
                    {latePending > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            tab === "late" ? "bg-white/20 text-white" : "bg-amber-500 text-white"
                        }`}>
                            {latePending}
                        </span>
                    )}
                </button>
            </div>

            {tab === "late" && (
                <div className="mb-5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5">
                    <ClockIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-300/80">
                        If <strong>approved</strong>, attendance stays marked as <strong className="text-amber-300">Late</strong> in the calendar but is counted as <strong className="text-teal-400">Present</strong> for salary calculations.
                    </p>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                    { label: "Pending",  key: "PENDING",  color: "text-orange-400", bg: "bg-orange-500/10" },
                    { label: "Approved", key: "APPROVED", color: "text-green-400",  bg: "bg-green-500/10"  },
                    { label: "Rejected", key: "REJECTED", color: "text-rose-400",   bg: "bg-rose-500/10"   },
                    { label: "Total",    key: "ALL",      color: "text-slate-300",  bg: "bg-slate-700/40"  },
                ].map(({ label, key, color }) => (
                    <button key={key} onClick={() => setFilter(key)}
                        className={`card p-4 text-left transition-all hover:brightness-110 ${filter === key ? "ring-1 ring-indigo-500/50" : ""}`}>
                        <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </button>
                ))}
            </div>

            {/* Filter + Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg self-start">
                    {FILTERS.map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                                filter === f ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                            }`}>
                            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                            <span className={`ml-1.5 text-[10px] ${filter === f ? "text-indigo-200" : "text-slate-600"}`}>
                                {counts[f]}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input type="text" placeholder="Search by name, department…"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                </div>
            </div>

            {/* List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading requests…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <ClipboardListIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                            No {filter !== "ALL" ? filter.toLowerCase() + " " : ""}
                            {tab === "late" ? "late regularization" : "regularization"} requests found
                        </p>
                        {search && <p className="text-slate-600 text-xs mt-1">Try clearing your search</p>}
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-800/60">
                        {filtered.map((req) => (
                            <RequestCard
                                key={req._id}
                                req={req}
                                isLate={tab === "late"}
                                reviewing={reviewing}
                                adminRemarks={adminRemarks}
                                setAdminRemarks={setAdminRemarks}
                                handleAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AttendanceRegularization