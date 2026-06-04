import { useState, useEffect } from "react"
import {
  ClipboardListIcon, ChevronLeftIcon, ChevronRightIcon,
  ClockIcon, AlertCircleIcon, LoaderIcon, XIcon, CheckCircle2Icon,
} from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"

// ─── Constants ────────────────────────────────────────────────────────────────
const REASON_OPTIONS = [
  { value: "FORGOT_TO_CHECKIN", label: "Forgot to check in"   },
  { value: "SYSTEM_ERROR",      label: "System / device error" },
  { value: "WORKED_FROM_HOME",  label: "Worked from home"      },
  { value: "CLIENT_VISIT",      label: "Client / field visit"  },
  { value: "OTHER",             label: "Other"                 },
]

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

const DAY_STYLES = {
  PRESENT:  { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400",  label: "Present"  },
  LATE:     { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-300", dot: "bg-yellow-400", label: "Late"     },
  ABSENT:   { bg: "bg-red-500/20",    border: "border-red-500/40",    text: "text-red-300",    dot: "bg-red-400",   label: "Absent"   },
  WEEKEND:  { bg: "bg-slate-800/60",  border: "border-slate-700/30",  text: "text-slate-600",  dot: null,           label: "Weekend"  },
  FUTURE:   { bg: "bg-slate-800/30",  border: "border-slate-700/20",  text: "text-slate-700",  dot: null,           label: ""         },
  PENDING:  { bg: "bg-orange-500/15", border: "border-orange-500/35", text: "text-orange-300", dot: "bg-orange-400",label: "Pending"  },
  APPROVED: { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400", label: "Approved" },
  REJECTED: { bg: "bg-red-500/15",    border: "border-red-500/30",    text: "text-red-400",    dot: "bg-red-400",   label: "Rejected" },
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────
const ApplyModal = ({ dateStr, onClose, onSubmitted }) => {
  const [reason,  setReason]  = useState("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)

  const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-slate-100 font-semibold text-sm">Apply Attendance Regularization</h3>
            <p className="text-xs text-slate-400 mt-0.5">{displayDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {REASON_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setReason(o.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    reason === o.value
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {reason === o.value && <CheckCircle2Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Additional remarks <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide any supporting details…"
              className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <p className="text-xs text-slate-500 flex items-start gap-1.5">
            <AlertCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-400" />
            Your request will be reviewed by the admin. Once approved, the day will be marked as Present.
          </p>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={submit}
            disabled={loading || !reason}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
const Calendar = ({ year, month, data, loading, onDayClick }) => {
  const firstDay    = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const istNow      = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  const todayStr    = istNow.toISOString().slice(0, 10)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const mm      = String(month).padStart(2, "0")
    const dd      = String(d).padStart(2, "0")
    const dateStr = `${year}-${mm}-${dd}`
    const dow     = new Date(year, month - 1, d).getDay()

    const isWeekend = dow === 0
    const isFuture  = dateStr > todayStr
    const attRec    = data?.attendance?.[dateStr]
    const regRec    = data?.regularizations?.[dateStr]

    let status = "FUTURE"
    if      (isWeekend)                       status = "WEEKEND"
    else if (isFuture)                        status = "FUTURE"
    else if (attRec)                          status = attRec.status
    else if (regRec?.status === "PENDING")    status = "PENDING"
    else if (regRec?.status === "APPROVED")   status = "APPROVED"
    else if (regRec?.status === "REJECTED")   status = "REJECTED"
    else                                      status = "ABSENT"

    cells.push({ d, dateStr, status, attRec, regRec, isWeekend, isFuture })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
        <LoaderIcon className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading calendar…</span>
      </div>
    )
  }

  return (
    <>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`blank-${idx}`} />

          const s             = DAY_STYLES[cell.status] || DAY_STYLES.FUTURE
          const canApply      = cell.status === "ABSENT"
          const isPending     = cell.status === "PENDING"
          const isRejected    = cell.status === "REJECTED"

          return (
            <div
              key={cell.dateStr}
              onClick={() => canApply && onDayClick(cell.dateStr)}
              title={
                cell.regRec
                  ? `${cell.regRec.status}${cell.regRec.adminRemark ? " — " + cell.regRec.adminRemark : ""}`
                  : s.label
              }
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl border text-xs font-medium
                ${s.bg} ${s.border} ${s.text}
                ${canApply ? "cursor-pointer hover:brightness-125 transition-all" : ""}
              `}
            >
              <span>{cell.d}</span>

              {s.dot && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${s.dot}`} />}
              {isPending  && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
              {isRejected && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400" />}

              {canApply && (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl bg-indigo-600/30">
                  <ClockIcon className="w-3.5 h-3.5 text-indigo-300" />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── My Requests list ─────────────────────────────────────────────────────────
const MyRequests = ({ data, loading }) => {
  if (loading) return null

  const REASON_LABELS = {
    FORGOT_TO_CHECKIN: "Forgot to check in",
    SYSTEM_ERROR:      "System / device error",
    WORKED_FROM_HOME:  "Worked from home",
    CLIENT_VISIT:      "Client / field visit",
    OTHER:             "Other",
  }

  const allRegs = Object.values(data?.regularizations || {})
  if (!allRegs.length) return null

  const sorted = [...allRegs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  const statusStyle = {
    PENDING:  "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    APPROVED: "bg-green-500/15  text-green-400  border border-green-500/20",
    REJECTED: "bg-red-500/15    text-red-400    border border-red-500/20",
  }

  return (
    <div className="card overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200">My Requests This Month</h2>
        <p className="text-xs text-slate-500 mt-0.5">{sorted.length} request{sorted.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="divide-y divide-slate-800/60">
        {sorted.map((req) => {
          const dateLabel = req.date
            ? new Date(req.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "—"
          return (
            <div key={req._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{dateLabel}</p>
                <p className="text-xs text-slate-500 mt-0.5">{REASON_LABELS[req.reason] || req.reason}</p>
                {req.remarks && <p className="text-xs text-slate-600 mt-0.5 truncate">{req.remarks}</p>}
                {req.adminRemark && (
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="text-slate-500">Admin: </span>{req.adminRemark}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[req.status] || ""}`}>
                {req.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const EmployeeRegularization = () => {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  const [year,    setYear]    = useState(istNow.getUTCFullYear())
  const [month,   setMonth]   = useState(istNow.getUTCMonth() + 1)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [applyDate, setApplyDate] = useState(null)

  const load = async (y, m) => {
    setLoading(true)
    try {
      const res = await api.get(`/regularization/month-map?year=${y}&month=${m}`)
      setData(res.data.data)
    } catch {
      toast.error("Failed to load attendance calendar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(year, month) }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    if (year === now.getUTCFullYear() && month >= now.getUTCMonth() + 1) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const isAtMaxMonth = (() => {
    const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    return year === now.getUTCFullYear() && month >= now.getUTCMonth() + 1
  })()

  // Summary counts from data
  const regs        = Object.values(data?.regularizations || {})
  const pendingCount  = regs.filter(r => r.status === "PENDING").length
  const approvedCount = regs.filter(r => r.status === "APPROVED").length
  const rejectedCount = regs.filter(r => r.status === "REJECTED").length

  const legend = [
    { label: "Present",  dot: "bg-green-400"  },
    { label: "Late",     dot: "bg-yellow-400" },
    { label: "Absent",   dot: "bg-red-400"    },
    { label: "Pending",  dot: "bg-orange-400" },
    { label: "Approved", dot: "bg-green-400 ring-1 ring-green-300" },
    { label: "Weekend",  dot: "bg-slate-600"  },
  ]

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <ClipboardListIcon className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="page-title">Attendance Regularization</h1>
            <p className="page-subtitle">Select an absent day on the calendar to apply for regularization</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && regs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending",  count: pendingCount,  color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: "Approved", count: approvedCount, color: "text-green-400",  bg: "bg-green-500/10"  },
            { label: "Rejected", count: rejectedCount, color: "text-red-400",    bg: "bg-red-500/10"    },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`card p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label} this month</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar card */}
      <div className="card overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <h2 className="text-slate-100 font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button
            onClick={nextMonth}
            disabled={isAtMaxMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="p-4">
          <Calendar
            year={year}
            month={month}
            data={data}
            loading={loading}
            onDayClick={(dateStr) => setApplyDate(dateStr)}
          />

          {/* Legend */}
          {!loading && (
            <>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-800">
                {legend.map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                    {l.label}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Click on a <span className="text-red-400 font-medium mx-1">red (absent)</span> day to apply for regularization.
              </p>
            </>
          )}
        </div>
      </div>

      {/* My requests this month */}
      <MyRequests data={data} loading={loading} />

      {/* Apply modal */}
      {applyDate && (
        <ApplyModal
          dateStr={applyDate}
          onClose={() => setApplyDate(null)}
          onSubmitted={() => load(year, month)}
        />
      )}
    </div>
  )
}

export default EmployeeRegularization