import { CalendarDays, FileText, Loader2, Send, X, AlertTriangleIcon, InfoIcon, StarIcon } from 'lucide-react';
import { useState } from 'react'
import api from '../../api/axios';
import toast from 'react-hot-toast';

const countDays = (start, end) => {
    if (!start || !end) return 0
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1
}

const LEAVE_TYPES = [
    { value: "SICK",        label: "Sick Leave",    note: "Medical / illness"          },
    { value: "CASUAL",      label: "Casual Leave",  note: "Personal / short notice"    },
    { value: "EARNED",      label: "Earned Leave",  note: "Accrued 2 days/month · no salary deduction" },
    { value: "LOSS_OF_PAY", label: "Loss of Pay",   note: "Salary deducted per day"    },
]

const ApplyLeaveModel = ({ open, onClose, onSuccess, leaveBalance }) => {
    const [loading,   setLoading]   = useState(false)
    const [type,      setType]      = useState("SICK")
    const [startDate, setStartDate] = useState("")
    const [endDate,   setEndDate]   = useState("")

    const today    = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const minDate = tomorrow.toISOString().split("T")[0]

    const selectedBalance = leaveBalance?.[type]
    const isLOP           = type === "LOSS_OF_PAY"
    const isEarned        = type === "EARNED"
    const requestedDays   = countDays(startDate, endDate)

    // Exhaustion checks
    const isExhausted = type === "SICK" || type === "CASUAL"
        ? selectedBalance && selectedBalance.remaining === 0
        : isEarned
            ? selectedBalance && selectedBalance.remaining === 0
            : false

    const willExceed = (type === "SICK" || type === "CASUAL")
        ? selectedBalance && requestedDays > selectedBalance.remaining
        : isEarned
            ? selectedBalance && requestedDays > selectedBalance.remaining
            : false

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isExhausted) return toast.error("You have no remaining days for this leave type.")
        if (willExceed)  return toast.error(`You only have ${selectedBalance.remaining} day(s) remaining.`)

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const data     = Object.fromEntries(formData.entries())

        try {
            await api.post("/leave", data)
            onSuccess()
            onClose()
            setType("SICK"); setStartDate(""); setEndDate("")
        } catch (err) {
            toast.error(err.response?.data?.error || err?.message)
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="card relative rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-0">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">Apply for Leave</h2>
                        <p className="text-sm text-slate-400 mt-0.5">Submit your leave request for approval</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Leave Type */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-100 mb-2">
                            <FileText className="w-4 h-4" /> Leave Type
                        </label>
                        <select
                            name="type" required
                            value={type}
                            onChange={(e) => { setType(e.target.value); setStartDate(""); setEndDate("") }}
                            className="text-slate-600"
                        >
                            {LEAVE_TYPES.map(({ value, label }) => {
                                const bal       = leaveBalance?.[value]
                                const exhausted = (value === "SICK" || value === "CASUAL" || value === "EARNED")
                                    && bal && bal.remaining === 0

                                let suffix = ""
                                if (value === "LOSS_OF_PAY") suffix = " (salary deducted)"
                                else if (value === "EARNED" && bal)
                                    suffix = ` — ${bal.remaining ?? 0} of ${bal.accumulated ?? 0} days available`
                                else if (bal && bal.remaining !== null)
                                    suffix = ` — ${bal.remaining}/${bal.limit} days left`

                                return (
                                    <option key={value} value={value} disabled={exhausted}>
                                        {label}{suffix}{exhausted ? " (exhausted)" : ""}
                                    </option>
                                )
                            })}
                        </select>

                        {/* Balance / info pill */}
                        <div className="mt-2">
                            {isLOP && (
                                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                                    <AlertTriangleIcon className="w-3.5 h-3.5" />
                                    Each day is deducted from your salary (basic ÷ 26 × days)
                                </span>
                            )}
                            {isEarned && selectedBalance && (
                                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                                    isExhausted
                                        ? "bg-rose-500/15 text-rose-400"
                                        : "bg-green-500/15 text-green-400"
                                }`}>
                                    <StarIcon className="w-3.5 h-3.5" />
                                    {isExhausted
                                        ? "No earned leaves available"
                                        : `${selectedBalance.remaining} day${selectedBalance.remaining !== 1 ? "s" : ""} available · accumulated ${selectedBalance.accumulated} · +2/month · no salary deduction`
                                    }
                                </span>
                            )}
                            {(type === "SICK" || type === "CASUAL") && selectedBalance && (
                                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                                    isExhausted
                                        ? "bg-rose-500/15 text-rose-400"
                                        : "bg-green-500/15 text-green-400"
                                }`}>
                                    <InfoIcon className="w-3.5 h-3.5" />
                                    {isExhausted
                                        ? "No days remaining"
                                        : `${selectedBalance.remaining} of ${selectedBalance.limit} days remaining`
                                    }
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-100 mb-2">
                            <CalendarDays className="w-4 h-4" /> Duration
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs text-slate-400 mb-1">From</span>
                                <input
                                    type="date" name="startDate" required
                                    min={minDate} value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value)
                                        if (endDate && e.target.value > endDate) setEndDate("")
                                    }}
                                    className="bg-cyan-500/5 text-slate-100"
                                />
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400 mb-1">To</span>
                                <input
                                    type="date" name="endDate" required
                                    min={startDate || minDate} value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-cyan-500/5 text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Day count + warnings */}
                        {requestedDays > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-slate-400">
                                    Requesting{" "}
                                    <span className="font-semibold text-slate-200">
                                        {requestedDays} day{requestedDays > 1 ? "s" : ""}
                                    </span>
                                    {isLOP && (
                                        <span className="ml-1 text-amber-400">— deduction calculated on approval</span>
                                    )}
                                    {isEarned && (
                                        <span className="ml-1 text-green-400">— no salary deduction</span>
                                    )}
                                </p>
                                {willExceed && (
                                    <p className="text-xs text-rose-400 flex items-center gap-1">
                                        <AlertTriangleIcon className="w-3.5 h-3.5" />
                                        Exceeds your remaining {selectedBalance?.remaining} day(s)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="text-sm font-medium text-slate-100 mb-2 block">Reason</label>
                        <textarea
                            name="reason" required rows={3}
                            className="resize-none bg-cyan-500/5"
                            placeholder="Briefly describe why you need this leave…"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading || isExhausted}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                : <><Send className="w-4 h-4" /> Submit</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ApplyLeaveModel