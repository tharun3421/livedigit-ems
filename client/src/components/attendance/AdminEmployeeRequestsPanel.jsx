import { useState, useEffect, useCallback } from "react"
import {
  ClipboardListIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
  Loader2Icon, ChevronDownIcon,
} from "lucide-react"
import api from "../../api/axios"
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

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:  "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    APPROVED: "bg-green-500/15  text-green-400  border border-green-500/20",
    REJECTED: "bg-rose-500/15   text-rose-400   border border-rose-500/20",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  )
}

const RequestRow = ({ req, isLate, reviewing, remark, setRemark, onAction }) => {
  const isActioning = reviewing === req._id

  return (
    <div className="px-3 py-3 rounded-xl bg-slate-800/40 border border-slate-800">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-200">{fmtDate(req.date)}</span>
        <StatusBadge status={req.status} />
      </div>

      <p className="text-xs text-slate-400 mt-1.5">
        <span className="text-slate-500">Reason: </span>
        {isLate ? req.reason : (REASON_LABELS[req.reason] || req.reason)}
      </p>

      {req.remarks && (
        <p className="text-xs text-slate-400 mt-1.5 bg-slate-900/60 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-500 font-medium">Employee note: </span>{req.remarks}
        </p>
      )}

      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Add admin remark (optional)"
          value={remark || ""}
          onChange={(e) => setRemark(req._id, e.target.value)}
          className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onAction(req._id, "APPROVED", isLate)}
            disabled={isActioning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {isActioning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            onClick={() => onAction(req._id, "REJECTED", isLate)}
            disabled={isActioning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {isActioning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <XCircleIcon className="w-3.5 h-3.5" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

const Section = ({ title, icon: Icon, accent, requests, isLate, reviewing, remarks, setRemark, onAction, open, toggle }) => {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent}`} />
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          {requests.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-orange-500 text-white">
              {requests.length} pending
            </span>
          )}
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-3 space-y-2.5 bg-slate-900/40">
          {requests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No pending {title.toLowerCase()} for this employee</p>
          ) : (
            requests.map((req) => (
              <RequestRow
                key={req._id}
                req={req}
                isLate={isLate}
                reviewing={reviewing}
                remark={remarks[req._id]}
                setRemark={setRemark}
                onAction={onAction}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Panel ──────────────────────────────────────────────────────────────────
// Sits right after the read-only attendance calendar in the admin modal. Lets
// the admin review and action this specific employee's PENDING Absent
// (attendance) regularization requests and PENDING Late regularization
// requests, without needing to leave the calendar view. Already-decided
// (approved/rejected) requests are left out here — they're still visible on
// the full Regularization page for history/audit purposes.
const AdminEmployeeRequestsPanel = ({ employeeId, onActioned }) => {
  const [absentRequests, setAbsentRequests] = useState([])
  const [lateRequests,   setLateRequests]   = useState([])
  const [loading,        setLoading]        = useState(true)
  const [reviewing,      setReviewing]      = useState(null)
  const [remarks,        setRemarks]        = useState({})
  const [openSection,    setOpenSection]    = useState("absent")

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const [absRes, lateRes] = await Promise.all([
        api.get(`/regularization?employeeId=${employeeId}&status=PENDING`),
        api.get(`/regularization?type=LATE&employeeId=${employeeId}&status=PENDING`),
      ])
      setAbsentRequests(absRes.data.data || [])
      setLateRequests(lateRes.data.data || [])
    } catch {
      setAbsentRequests([])
      setLateRequests([])
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const setRemark = (id, value) => setRemarks((p) => ({ ...p, [id]: value }))

  const handleAction = async (id, status, isLate) => {
    setReviewing(id)
    try {
      const endpoint = isLate ? `/regularization/late/${id}` : `/regularization/${id}`
      await api.patch(endpoint, { status, adminRemark: remarks[id] || "" })
      toast.success(`Request ${status.toLowerCase()} successfully`)
      await fetchRequests()
      onActioned?.()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update request")
    } finally {
      setReviewing(null)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Pending Requests</p>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading requests…</span>
        </div>
      ) : (
        <div className="space-y-3">
          <Section
            title="Absent Requests"
            icon={ClipboardListIcon}
            accent="text-orange-400"
            requests={absentRequests}
            isLate={false}
            reviewing={reviewing}
            remarks={remarks}
            setRemark={setRemark}
            onAction={handleAction}
            open={openSection === "absent"}
            toggle={() => setOpenSection((s) => (s === "absent" ? null : "absent"))}
          />
          <Section
            title="Late Requests"
            icon={ClockIcon}
            accent="text-amber-400"
            requests={lateRequests}
            isLate={true}
            reviewing={reviewing}
            remarks={remarks}
            setRemark={setRemark}
            onAction={handleAction}
            open={openSection === "late"}
            toggle={() => setOpenSection((s) => (s === "late" ? null : "late"))}
          />
        </div>
      )}
    </div>
  )
}

export default AdminEmployeeRequestsPanel