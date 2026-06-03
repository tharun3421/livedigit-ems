import { useState, useEffect } from "react"
import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  LoaderIcon,
} from "lucide-react"
import api from "../../api/axios"
import toast from "react-hot-toast"

// ─── Reason labels ────────────────────────────────────────────────────────────
const REASON_OPTIONS = [
  { value: "FORGOT_TO_CHECKIN",  label: "Forgot to check in" },
  { value: "SYSTEM_ERROR",       label: "System / device error" },
  { value: "WORKED_FROM_HOME",   label: "Worked from home" },
  { value: "CLIENT_VISIT",       label: "Client / field visit" },
  { value: "OTHER",              label: "Other" },
]

// ─── Day status colours ───────────────────────────────────────────────────────
const DAY_STYLES = {
  PRESENT:  { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400"  },
  LATE:     { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-300", dot: "bg-yellow-400" },
  ABSENT:   { bg: "bg-red-500/20",    border: "border-red-500/40",    text: "text-red-300",    dot: "bg-red-400"    },
  WEEKEND:  { bg: "bg-slate-800/60",  border: "border-slate-700/30",  text: "text-slate-600",  dot: null            },
  FUTURE:   { bg: "bg-slate-800/30",  border: "border-slate-700/20",  text: "text-slate-700",  dot: null            },
  PENDING:  { bg: "bg-orange-500/15", border: "border-orange-500/35", text: "text-orange-300", dot: "bg-orange-400" },
  APPROVED: { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400"  },
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

// ─── Regularization Apply Modal ───────────────────────────────────────────────
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
    } finally {
      setLoading(false)
    }
  }

  const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-slate-100 font-semibold">Apply Attendance Regularization</h3>
            <p className="text-xs text-slate-400 mt-0.5">{displayDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-200 rounded-lg"
            >
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
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide any supporting details…"
              className="bg-slate-800 border-slate-700 text-slate-200 rounded-lg resize-none"
            />
          </div>

          <p className="text-xs text-slate-500 flex items-start gap-1.5">
            <AlertCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-400" />
            Your request will be reviewed by the admin. Once approved, the day will be marked as Present.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={submit}
            disabled={loading}
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

// ─── Main Calendar Modal ──────────────────────────────────────────────────────
const AttendanceCalendarModal = ({ onClose }) => {
  const now       = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-based
  const [data,  setData]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [regDate, setRegDate] = useState(null) // ISO date string when applying reg

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
    const istNow = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
    const curY = istNow.getUTCFullYear(), curM = istNow.getUTCMonth() + 1
    if (year > curY || (year === curY && month >= curM)) return // no future months
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // Build calendar grid
  const buildGrid = () => {
    const firstDay  = new Date(year, month - 1, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate()
    const istNow    = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
    const todayStr  = istNow.toISOString().slice(0, 10)
    const cells     = []

    // leading blanks
    for (let i = 0; i < firstDay; i++) cells.push(null)

    for (let d = 1; d <= daysInMonth; d++) {
      const mm      = String(month).padStart(2, "0")
      const dd      = String(d).padStart(2, "0")
      const dateStr = `${year}-${mm}-${dd}`
      const dow     = new Date(year, month - 1, d).getDay() // 0=Sun,6=Sat

      const isWeekend = dow === 0
      const isFuture  = dateStr > todayStr
      const attRec    = data?.attendance?.[dateStr]
      const regRec    = data?.regularizations?.[dateStr]

      let status = null
      if      (isWeekend)        status = "WEEKEND"
      else if (isFuture)         status = "FUTURE"
      else if (attRec)           status = attRec.status        // PRESENT | LATE
      else if (regRec?.status === "PENDING")  status = "PENDING"
      else if (regRec?.status === "APPROVED") status = "APPROVED"
      else                       status = "ABSENT"

      cells.push({ d, dateStr, status, attRec, regRec, isWeekend, isFuture })
    }
    return cells
  }

  const cells = data ? buildGrid() : []
  const istNow = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
  const isCurrentMonth = year === istNow.getUTCFullYear() && month === (istNow.getUTCMonth() + 1)
  const isAtMaxMonth   = isCurrentMonth

  // Legend
  const legend = [
    { label: "Present",   dot: "bg-green-400"  },
    { label: "Late",      dot: "bg-yellow-400" },
    { label: "Absent",    dot: "bg-red-400"    },
    { label: "Pending",   dot: "bg-orange-400" },
    { label: "Weekend",   dot: "bg-slate-600"  },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <h2 className="text-slate-100 font-semibold min-w-[160px] text-center">
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
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* ── Calendar ── */}
          <div className="overflow-y-auto flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <LoaderIcon className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell, idx) => {
                    if (!cell) return <div key={`blank-${idx}`} />

                    const s = DAY_STYLES[cell.status] || DAY_STYLES.FUTURE
                    const canRegularize = cell.status === "ABSENT"
                    const hasPending    = cell.status === "PENDING"

                    return (
                      <div
                        key={cell.dateStr}
                        title={
                          cell.regRec
                            ? `Regularization: ${cell.regRec.status}${cell.regRec.adminRemark ? " — " + cell.regRec.adminRemark : ""}`
                            : cell.attRec
                              ? `${cell.attRec.status}${cell.attRec.workingHours ? ` · ${cell.attRec.workingHours.toFixed(1)}h` : ""}`
                              : cell.isWeekend ? "Weekend" : cell.isFuture ? "" : "Absent"
                        }
                        className={`
                          relative aspect-square flex flex-col items-center justify-center rounded-xl border text-xs font-medium
                          ${s.bg} ${s.border} ${s.text}
                          ${canRegularize ? "cursor-pointer hover:brightness-125 transition-all" : ""}
                        `}
                        onClick={() => canRegularize && setRegDate(cell.dateStr)}
                      >
                        <span>{cell.d}</span>

                        {/* Status dot */}
                        {s.dot && (
                          <span className={`absolute bottom-1 w-1 h-1 rounded-full ${s.dot}`} />
                        )}

                        {/* Pending spinner dot */}
                        {hasPending && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        )}

                        {/* Regularize hint on absent */}
                        {canRegularize && (
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl bg-indigo-600/30">
                            <ClockIcon className="w-3.5 h-3.5 text-indigo-300" />
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* ── Legend ── */}
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-800">
                  {legend.map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                      {l.label}
                    </span>
                  ))}
                </div>

                {/* ── Hint ── */}
                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                  <AlertCircleIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Click on a red (absent) day to apply attendance regularization.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Regularization apply sub-modal */}
      {regDate && (
        <RegularizationModal
          dateStr={regDate}
          onClose={() => setRegDate(null)}
          onSubmitted={() => load(year, month)}
        />
      )}
    </>
  )
}

export default AttendanceCalendarModal