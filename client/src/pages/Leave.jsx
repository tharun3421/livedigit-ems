import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading"
import { PalmtreeIcon, PlusIcon, ThermometerIcon, UmbrellaIcon } from "lucide-react"
import LeaveHistory from "../components/leave/LeaveHistory"
import ApplyLeaveModel from "../components/leave/ApplyLeaveModel"
import { useAuth } from "../context/authContext"
import api from "../api/axios.js"
import toast from "react-hot-toast"

// Leave limits — keep in sync with leaveController.js
const LEAVE_LIMITS = { SICK: 6, CASUAL: 6, LOSS_OF_PAY: 6 }

const Leave = () => {
    const { user } = useAuth()

    const [leaves,       setLeaves]       = useState([])
    const [leaveBalance, setLeaveBalance] = useState(null)   // { SICK, CASUAL, LOSS_OF_PAY }
    const [loading,      setLoading]      = useState(true)
    const [showModel,    setShowModel]    = useState(false)
    const [isDeleted,    setIsDeleted]    = useState(false)

    const isAdmin = user?.role === "ADMIN"

    const fetchLeaves = useCallback(async () => {
        try {
            const res = await api.get("/leave")
            setLeaves(res.data.data || [])
            if (res.data.leaveBalance) setLeaveBalance(res.data.leaveBalance)
            if (res.data.employee?.isDeleted) setIsDeleted(true)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchLeaves() }, [fetchLeaves])

    if (loading) return <Loading />

    // ── Stats (used for admin view — count approved only) ─────────────────────
    const approvedLeaves = leaves.filter((l) => l.status === "APPROVED")
    const sickUsed       = approvedLeaves.filter((l) => l.type === "SICK").length
    const casualUsed     = approvedLeaves.filter((l) => l.type === "CASUAL").length
    const lopUsed        = approvedLeaves.filter((l) => l.type === "LOSS_OF_PAY").length

    // ── Leave stat cards for employee ─────────────────────────────────────────
    const leaveStats = [
        {
            label:     "Sick Leave",
            type:      "SICK",
            icon:      ThermometerIcon,
            used:      leaveBalance?.SICK?.used      ?? sickUsed,
            remaining: leaveBalance?.SICK?.remaining ?? (LEAVE_LIMITS.SICK - sickUsed),
            limit:     LEAVE_LIMITS.SICK,
            color:     "blue",
        },
        {
            label:     "Casual Leave",
            type:      "CASUAL",
            icon:      UmbrellaIcon,
            used:      leaveBalance?.CASUAL?.used      ?? casualUsed,
            remaining: leaveBalance?.CASUAL?.remaining ?? (LEAVE_LIMITS.CASUAL - casualUsed),
            limit:     LEAVE_LIMITS.CASUAL,
            color:     "indigo",
        },
        {
            label:     "Loss of Pay",
            type:      "LOSS_OF_PAY",
            icon:      PalmtreeIcon,
            used:      leaveBalance?.LOSS_OF_PAY?.used      ?? lopUsed,
            remaining: leaveBalance?.LOSS_OF_PAY?.remaining ?? (LEAVE_LIMITS.LOSS_OF_PAY - lopUsed),
            limit:     LEAVE_LIMITS.LOSS_OF_PAY,
            color:     "rose",
        },
    ]

    const colorMap = {
        blue:  { bar: "bg-blue-500",   text: "text-blue-600",   bg: "bg-blue-50"   },
        indigo: { bar: "bg-indigo-500", text: "text-indigo-600", bg: "bg-indigo-50" },
        rose:  { bar: "bg-rose-500",   text: "text-rose-600",   bg: "bg-rose-50"   },
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-100 text-3xl">Leave Management</h1>
                    <p className="page-subtitle">
                        {isAdmin ? "Manage leave applications" : "Your leave history and requests"}
                    </p>
                </div>
                {!isAdmin && !isDeleted && (
                    <button
                        onClick={() => setShowModel(true)}
                        className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <PlusIcon className="w-4 h-4" /> Apply for Leave
                    </button>
                )}
            </div>

            {/* Leave Balance Cards — employee only */}
            {!isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
                    {leaveStats.map((s) => {
                        const c          = colorMap[s.color]
                        const pct        = Math.round((s.used / s.limit) * 100)
                        const isExhausted = s.remaining === 0

                        return (
                            <div
                                key={s.label}
                                className="card p-5 sm:p-6 relative overflow-hidden group"
                            >
                                {/* Left accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${c.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-lg ${c.bg}`}>
                                            <s.icon className={`w-4 h-4 ${c.text}`} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-400">{s.label}</p>
                                    </div>
                                    {isExhausted && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">
                                            Exhausted
                                        </span>
                                    )}
                                </div>

                                {/* Numbers */}
                                <div className="flex items-end justify-between mb-3">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-100">
                                            {s.remaining}
                                            <span className="text-sm font-normal text-slate-400 ml-1">remaining</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {s.used} of {s.limit} days used
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            isExhausted ? "bg-rose-500" : c.bar
                                        }`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <LeaveHistory leaves={leaves} isAdmin={isAdmin} onUpdate={fetchLeaves} />

            <ApplyLeaveModel
                open={showModel}
                onClose={() => setShowModel(false)}
                onSuccess={fetchLeaves}
                leaveBalance={leaveBalance}   // ← pass balance so modal can disable exhausted types
            />
        </div>
    )
}

export default Leave