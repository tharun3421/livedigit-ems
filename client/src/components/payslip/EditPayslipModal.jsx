import { useState, useEffect } from "react"
import { Loader2, X, InfoIcon } from "lucide-react"
import api from "../../api/axios"
import toast from "react-hot-toast"

const inr = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
        </label>
        {children}
    </div>
)

const SalaryRow = ({ label, value, color, bold }) => (
    <div className="flex justify-between items-center px-4 py-2.5">
        <span className={`text-sm ${bold ? "font-semibold text-slate-700" : "text-slate-600"}`}>
            {label}
        </span>
        <span className={`text-sm ${bold ? "font-semibold" : "font-medium"} ${
            color === "green" ? "text-green-600" :
            color === "rose"  ? "text-rose-500"  : "text-slate-800"
        }`}>
            {value}
        </span>
    </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const EditPayslipModal = ({ payslip, onClose, onSuccess }) => {
    const [basicSalary, setBasicSalary] = useState(payslip.basicSalary ?? 0)
    const [allowances,  setAllowances]  = useState(payslip.allowances  ?? 0)
    const [lopDays,     setLopDays]     = useState(payslip.lopDays     ?? 0)
    const [loading,     setLoading]     = useState(false)

    // Live attendance counts fetched from the payslip detail endpoint
    const [counts, setCounts] = useState({
        workingDays: payslip.workingDays ?? 0,
        presentDays: payslip.presentDays ?? 0,
        absentDays:  payslip.absentDays  ?? 0,
        lopWorkedDays: payslip.lopDays   ?? 0,
    })
    const [countsLoading, setCountsLoading] = useState(true)

    // Fetch live counts from the existing getPayslipById endpoint
    // which always recomputes from live attendance data
    useEffect(() => {
        const fetchLiveCounts = async () => {
            try {
                const id = payslip._id ?? payslip.id
                const { data } = await api.get(`/payslips/${id}`)
                setCounts({
                    workingDays:   data.workingDays              ?? 0,
                    presentDays:   data.employee?.presentDays    ?? 0,
                    absentDays:    data.employee?.absentDays     ?? 0,
                    lopWorkedDays: data.employee?.lopLeaves      ?? 0,
                })
            } catch {
                // Fall back to stored values — not ideal but better than crashing
            } finally {
                setCountsLoading(false)
            }
        }
        fetchLiveCounts()
    }, [payslip._id, payslip.id])

    const { workingDays, presentDays, absentDays, lopWorkedDays } = counts

    // ── Correct salary formula (mirrors payslipController.js exactly) ──
    // perDaySalary = basicSalary / workingDays
    // earnedBasic  = perDaySalary × presentDays      ← prorated for attendance
    // lopAmount    = perDaySalary × lopWorkedDays
    // netSalary    = earnedBasic + allowances
    const perDaySalary = workingDays > 0
        ? parseFloat((Number(basicSalary) / workingDays).toFixed(2))
        : 0
    const earnedBasic  = parseFloat((perDaySalary * presentDays).toFixed(2))
    const lopAmount    = parseFloat((perDaySalary * Number(lopDays)).toFixed(2))
    const netSalary    = parseFloat((earnedBasic + Number(allowances)).toFixed(2))

    const periodLabel = new Date(payslip.year, payslip.month - 1)
        .toLocaleString("en-IN", { month: "long", year: "numeric" })

    const empName = [payslip.employee?.firstName, payslip.employee?.lastName]
        .filter(Boolean).join(" ")

    const handleSave = async () => {
        if (loading) return
        setLoading(true)
        try {
            await api.put(`/payslips/${payslip._id ?? payslip.id}`, {
                basicSalary: Number(basicSalary),
                allowances:  Number(allowances),
                lopDays:     Number(lopDays),
            })
            toast.success("Payslip updated successfully")
            onClose()
            onSuccess()
        } catch (err) {
            toast.error(err?.response?.data?.error || "Failed to update payslip")
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">

                {/* ── Header ── */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Edit Payslip</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {empName && <>{empName} · </>}{periodLabel}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">

                    {/* ── Basic Salary ── */}
                    <Field label="Basic Salary (₹)">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(e.target.value)}
                        />
                    </Field>

                    {/* ── Allowances ── */}
                    <Field label="Allowances (₹)">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={allowances}
                            onChange={(e) => setAllowances(e.target.value)}
                        />
                    </Field>

                    {/* ── LOP Days ── */}
                    <Field
                        label="LOP Days"
                        hint="(auto-pulled from leaves; override if needed)"
                    >
                        <input
                            type="number"
                            min="0"
                            max={workingDays}
                            step="1"
                            value={lopDays}
                            onChange={(e) => setLopDays(e.target.value)}
                        />
                    </Field>

                    {/* ── Live Breakdown Preview ── */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-1.5">
                            <InfoIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Updated breakdown
                            </span>
                            <span className="ml-auto text-xs text-slate-400">
                                {countsLoading ? "Loading…" : `${workingDays} working days`}
                            </span>
                        </div>

                        {countsLoading ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Fetching attendance data…
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">

                                {/* Attendance summary row */}
                                <div className="flex justify-between items-center px-4 py-2 bg-slate-50/60">
                                    <span className="text-xs text-slate-400">
                                        Present {presentDays}d · Absent {absentDays}d · LOP {lopWorkedDays}d
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        ₹{perDaySalary.toLocaleString("en-IN")}/day
                                    </span>
                                </div>

                                {/* Earned basic = prorated for days present */}
                                <SalaryRow
                                    label={`Earned Basic (${presentDays}d × ₹${perDaySalary.toLocaleString("en-IN")})`}
                                    value={inr(earnedBasic)}
                                />

                                <SalaryRow label="Allowances" value={inr(allowances)} color="green" />

                                {Number(lopDays) > 0 && (
                                    <SalaryRow
                                        label={`LOP (${lopDays}d × ₹${perDaySalary.toLocaleString("en-IN")})`}
                                        value={`– ${inr(lopAmount)}`}
                                        color="rose"
                                        bold
                                    />
                                )}

                                <div className="flex justify-between items-center px-4 py-3 bg-indigo-50">
                                    <span className="text-sm font-bold text-slate-800">Net Salary</span>
                                    <span className={`text-base font-bold ${netSalary < 0 ? "text-rose-600" : "text-indigo-600"}`}>
                                        {inr(netSalary)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || countsLoading}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditPayslipModal