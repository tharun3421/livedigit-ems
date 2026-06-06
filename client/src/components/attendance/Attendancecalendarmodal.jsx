import { useState, useEffect } from "react"
import {
    XIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon,
    AlertCircleIcon, LoaderIcon, FileTextIcon,
} from "lucide-react"
import api from "../../api/axios"
import toast from "react-hot-toast"
import ApplyLeaveModel from "../leave/ApplyLeaveModel"

const REASON_OPTIONS = [
    { value: "FORGOT_TO_CHECKIN", label: "Forgot to check in"    },
    { value: "SYSTEM_ERROR",      label: "System / device error" },
    { value: "WORKED_FROM_HOME",  label: "Worked from home"      },
    { value: "CLIENT_VISIT",      label: "Client / field visit"  },
    { value: "OTHER",             label: "Other"                 },
]

const DAY_STYLES = {
    PRESENT:       { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400"   },
    LATE:          { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-300", dot: "bg-yellow-400"  },
    LATE_APPROVED: { bg: "bg-teal-500/20",   border: "border-teal-500/40",   text: "text-teal-300",   dot: "bg-teal-400"    },
    LATE_PENDING:  { bg: "bg-amber-500/15",  border: "border-amber-500/35",  text: "text-amber-300",  dot: "bg-amber-400"   },
    ABSENT:        { bg: "bg-red-500/20",    border: "border-red-500/40",    text: "text-red-300",    dot: "bg-red-400"     },
    LEAVE_APPROVED:{ bg: "bg-blue-500/20",   border: "border-blue-500/40",   text: "text-blue-300",   dot: "bg-blue-400"    },
    PENDING:       { bg: "bg-orange-500/15", border: "border-orange-500/35", text: "text-orange-300", dot: "bg-orange-400"  },
    APPROVED:      { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400"   },
    WEEKEND:       { bg: "bg-slate-800/60",  border: "border-slate-700/30",  text: "text-slate-600",  dot: null             },
    FUTURE:        { bg: "bg-slate-800/30",  border: "border-slate-700/20",  text: "text-slate-700",  dot: null             },
}

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
]

// ─── Absent Action Modal ──────────────────────────────────────────────────────
const AbsentActionModal = ({ dateStr, onClose, onRegularize, onLeave }) => {
    const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-slate-100 font-semibold">Absent Day</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{displayDate}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-sm text-slate-400 mb-4">What would you like to do for this absent day?</p>
                    <button onClick={onRegularize}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors text-left">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <ClockIcon className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-indigo-300">Apply for Regularization</p>
                            <p className="text-xs text-slate-500 mt-0.5">Justify attendance (WFH, client visit…)</p>
                        </div>
                    </button>
                    <button onClick={onLeave}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-left">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <FileTextIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-300">Apply for Leave</p>
                            <p className="text-xs text-slate-500 mt-0.5">Apply sick, casual, earned, or LOP leave</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Absent Regularization Modal ─────────────────────────────────────────────
const RegularizationModal = ({ dateStr, onClose, onSubmitted }) => {
    const [reason,  setReason]  = useState("")
    const [remarks, setRemarks] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!reason) { toast.error("Please select a reason"); return }
        setLoading(true)
        try {
            await api.post("/regularization", { date: dateStr, reason, remarks })
            toast.success("Regularization request submitted!")
            onSubmitted()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to submit")
        } finally { setLoading(false) }
    }

    const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    })

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-slate-100 font-semibold">Apply Attendance Regularization</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{displayDate}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Reason <span className="text-red-400">*</span>
                        </label>
                        <select value={reason} onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Select a reason…</option>
                            {REASON_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Additional remarks <span className="text-slate-600">(optional)</span>
                        </label>
                        <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Provide any supporting details…"
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500" />
                    </div>
                    <p className="text-xs text-slate-500 flex items-start gap-1.5">
                        <AlertCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-400" />
                        Your request will be reviewed by the admin. Once approved, the day will be marked as Present.
                    </p>
                </div>
                <div className="flex gap-3 px-5 pb-5">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                        {loading && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Late Regularization Modal ────────────────────────────────────────────────
const LateRegularizationModal = ({ dateStr, onClose, onSubmitted }) => {
    const [reason,  setReason]  = useState("")
    const [remarks, setRemarks] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!reason.trim()) { toast.error("Please provide a reason"); return }
        setLoading(true)
        try {
            await api.post("/regularization/late", { date: dateStr, reason, remarks })
            toast.success("Late regularization request submitted!")
            onSubmitted()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to submit")
        } finally { setLoading(false) }
    }

    const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    })

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-slate-100 font-semibold">Late Regularization Request</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{displayDate}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-300">
                            You were marked <strong>Late</strong> on this day. If approved, it will be counted as <strong>Present</strong> for salary calculations.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Reason <span className="text-red-400">*</span>
                        </label>
                        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you arrived late…"
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Additional remarks <span className="text-slate-600">(optional)</span>
                        </label>
                        <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Any supporting information…"
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500" />
                    </div>
                </div>
                <div className="flex gap-3 px-5 pb-5">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                        {loading && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Calendar Modal ──────────────────────────────────────────────────────
const AttendanceCalendarModal = ({ onClose }) => {
    const now = new Date()
    const [year,  setYear]  = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [data,  setData]  = useState(null)
    const [loading, setLoading]      = useState(true)
    const [leaveBalance, setLeaveBalance] = useState(null)

    const [absentActionDate, setAbsentActionDate] = useState(null)
    const [regDate,          setRegDate]          = useState(null)
    const [lateRegDate,      setLateRegDate]      = useState(null)
    const [leaveDate,        setLeaveDate]        = useState(null)
    const [leaveModalOpen,   setLeaveModalOpen]   = useState(false)

    const load = async (y, m) => {
        setLoading(true)
        try {
            const [calRes, leaveRes] = await Promise.all([
                api.get(`/regularization/month-map?year=${y}&month=${m}`),
                api.get("/leave"),
            ])
            setData(calRes.data.data)
            setLeaveBalance(leaveRes.data.leaveBalance)
        } catch {
            toast.error("Failed to load attendance calendar")
        } finally { setLoading(false) }
    }

    useEffect(() => { load(year, month) }, [year, month])

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
        if (year === istNow.getUTCFullYear() && month >= istNow.getUTCMonth() + 1) return
        if (month === 12) { setYear(y => y + 1); setMonth(1) }
        else setMonth(m => m + 1)
    }

    const buildGrid = () => {
        const firstDay    = new Date(year, month - 1, 1).getDay()
        const daysInMonth = new Date(year, month, 0).getDate()
        const istNow      = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
        const todayStr    = istNow.toISOString().slice(0, 10)
        const cells       = []

        for (let i = 0; i < firstDay; i++) cells.push(null)

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr   = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`
            const dow       = new Date(year, month - 1, d).getDay()
            const isWeekend = dow === 0
            const isFuture  = dateStr > todayStr
            const attRec    = data?.attendance?.[dateStr]
            const regRec    = data?.regularizations?.[dateStr]
            const lateReg   = data?.lateRegularizations?.[dateStr]

            let status = null
            if      (isWeekend)                        status = "WEEKEND"
            else if (isFuture)                         status = "FUTURE"
            else if (attRec?.status === "PRESENT")     status = "PRESENT"
            else if (attRec?.status === "LATE") {
                if      (lateReg?.status === "APPROVED") status = "LATE_APPROVED"
                else if (lateReg?.status === "PENDING")  status = "LATE_PENDING"
                else                                     status = "LATE"
            }
            else if (regRec?.status === "PENDING")     status = "PENDING"
            else if (regRec?.status === "APPROVED")    status = "APPROVED"
            else                                       status = "ABSENT"

            cells.push({ d, dateStr, status, attRec, regRec, lateReg, isWeekend, isFuture })
        }
        return cells
    }

    const cells = data ? buildGrid() : []
    const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    const isAtMaxMonth = year === istNow.getUTCFullYear() && month === (istNow.getUTCMonth() + 1)

    const legend = [
        { label: "Present",         dot: "bg-green-400"  },
        { label: "Late",            dot: "bg-yellow-400" },
        { label: "Late (Approved)", dot: "bg-teal-400"   },
        { label: "Absent",          dot: "bg-red-400"    },
        { label: "Leave Approved",  dot: "bg-blue-400"   },
        { label: "Reg. Pending",    dot: "bg-orange-400" },
        { label: "Weekend",         dot: "bg-slate-600"  },
    ]

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <h2 className="text-slate-100 font-semibold min-w-[160px] text-center">
                                {MONTH_NAMES[month - 1]} {year}
                            </h2>
                            <button onClick={nextMonth} disabled={isAtMaxMonth}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                                <LoaderIcon className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-7 mb-2">
                                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                                        <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {cells.map((cell, idx) => {
                                        if (!cell) return <div key={`blank-${idx}`} />
                                        const s              = DAY_STYLES[cell.status] || DAY_STYLES.FUTURE
                                        const canAbsentAction = cell.status === "ABSENT"
                                        const canLateReg      = cell.status === "LATE"

                                        return (
                                            <div key={cell.dateStr}
                                                onClick={() => {
                                                    if (canAbsentAction) setAbsentActionDate(cell.dateStr)
                                                    else if (canLateReg) setLateRegDate(cell.dateStr)
                                                }}
                                                className={`
                                                    relative aspect-square flex flex-col items-center justify-center rounded-xl border text-xs font-medium
                                                    ${s.bg} ${s.border} ${s.text}
                                                    ${(canAbsentAction || canLateReg) ? "cursor-pointer hover:brightness-125 transition-all" : ""}
                                                `}
                                            >
                                                <span>{cell.d}</span>
                                                {s.dot && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${s.dot}`} />}
                                                {(cell.status === "PENDING" || cell.status === "LATE_PENDING") && (
                                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-800">
                                    {legend.map((l) => (
                                        <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                                            {l.label}
                                        </span>
                                    ))}
                                </div>

                                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                                    <AlertCircleIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    Click a red (absent) day to regularize or apply leave. Click yellow (late) to regularize.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {absentActionDate && (
                <AbsentActionModal
                    dateStr={absentActionDate}
                    onClose={() => setAbsentActionDate(null)}
                    onRegularize={() => { setRegDate(absentActionDate); setAbsentActionDate(null) }}
                    onLeave={() => { setLeaveDate(absentActionDate); setLeaveModalOpen(true); setAbsentActionDate(null) }}
                />
            )}

            {regDate && (
                <RegularizationModal
                    dateStr={regDate}
                    onClose={() => setRegDate(null)}
                    onSubmitted={() => load(year, month)}
                />
            )}

            {lateRegDate && (
                <LateRegularizationModal
                    dateStr={lateRegDate}
                    onClose={() => setLateRegDate(null)}
                    onSubmitted={() => load(year, month)}
                />
            )}

            {leaveModalOpen && (
                <ApplyLeaveModel
                    open={leaveModalOpen}
                    onClose={() => { setLeaveModalOpen(false); setLeaveDate(null) }}
                    onSuccess={() => load(year, month)}
                    leaveBalance={leaveBalance}
                    defaultDate={leaveDate}
                />
            )}
        </>
    )
}

export default AttendanceCalendarModal