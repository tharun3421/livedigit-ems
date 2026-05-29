import { useState } from "react"
import { Loader2, X, InfoIcon } from "lucide-react"
import api from "../../api/axios"
import toast from "react-hot-toast"

const inr = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

const getWorkingDays = (month, year) => new Date(year, month, 0).getDate() - 6

const EditPayslipModal = ({ payslip, onClose, onSuccess }) => {
    const [basicSalary,  setBasicSalary]  = useState(payslip.basicSalary  ?? 0)
    const [allowances,   setAllowances]   = useState(payslip.allowances   ?? 0)
    const [lopDays,      setLopDays]      = useState(payslip.lopDays      ?? 0)
    const [loading,      setLoading]      = useState(false)

    const workingDays = payslip.workingDays ?? getWorkingDays(payslip.month, payslip.year)
    const lopAmount   = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
    const netSalary   = parseFloat((Number(basicSalary) + Number(allowances) - lopAmount).toFixed(2))

    const handleSave = async () => {
        setLoading(true)
        try {
            await api.put(`/payslips/${payslip._id ?? payslip.id}`, {
                basicSalary: Number(basicSalary),
                allowances:  Number(allowances),
                lopDays:     Number(lopDays),
            })
            toast.success("Payslip updated")
            onSuccess()
            onClose()
        } catch (err) {
            toast.error(err?.response?.data?.error || "Update failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">

                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Edit Payslip</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {payslip.employee?.firstName} {payslip.employee?.lastName} ·{" "}
                            {new Date(payslip.year, payslip.month - 1)
                                .toLocaleString("en-IN", { month: "long", year: "numeric" })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Basic Salary */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Basic Salary (₹)</label>
                        <input
                            type="number" min="0" step="0.01"
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(e.target.value)}
                        />
                    </div>

                    {/* Allowances */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Allowances (₹)</label>
                        <input
                            type="number" min="0" step="0.01"
                            value={allowances}
                            onChange={(e) => setAllowances(e.target.value)}
                        />
                    </div>

                    {/* LOP Days */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            LOP Days Override
                            <span className="ml-2 text-xs font-normal text-slate-400">
                                (auto-pulled from leaves; override if needed)
                            </span>
                        </label>
                        <input
                            type="number" min="0" max={workingDays} step="1"
                            value={lopDays}
                            onChange={(e) => setLopDays(e.target.value)}
                        />
                    </div>

                    {/* Live preview */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-1.5">
                            <InfoIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Updated breakdown
                            </span>
                            <span className="ml-auto text-xs text-slate-400">{workingDays} working days</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            <Row label="Basic Salary"  value={inr(basicSalary)} />
                            <Row label="Allowances"    value={inr(allowances)} color="green" />
                            {lopDays > 0 && (
                                <Row
                                    label={`LOP (${lopDays}d × ₹${Number(basicSalary).toLocaleString("en-IN")} ÷ ${workingDays})`}
                                    value={`– ${inr(lopAmount)}`}
                                    color="rose"
                                />
                            )}
                            <div className="flex justify-between items-center px-4 py-3 bg-indigo-50">
                                <span className="font-bold text-slate-800">Net Salary</span>
                                <span className={`font-bold text-base ${netSalary < 0 ? "text-rose-600" : "text-indigo-600"}`}>
                                    {inr(netSalary)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-5">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    )
}

const Row = ({ label, value, color }) => (
    <div className="flex justify-between items-center px-4 py-2.5">
        <span className="text-slate-600">{label}</span>
        <span className={`font-medium ${color === "green" ? "text-green-600" : color === "rose" ? "text-rose-500" : "text-slate-800"}`}>
            {value}
        </span>
    </div>
)

export default EditPayslipModal