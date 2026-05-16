import { Loader2, Plus, X, UserIcon, CalendarIcon, AlertCircleIcon, InfoIcon, PencilIcon } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

const getWorkingDays = (year, month, weekOffDays = []) => {
    const totalDays = new Date(year, month, 0).getDate()
    let working = 0
    for (let d = 1; d <= totalDays; d++) {
        const dayName = DAYS[new Date(year, month - 1, d).getDay()]
        if (!weekOffDays.includes(dayName)) working++
    }
    return working
}

const inr = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

// ─── Component ────────────────────────────────────────────────────────────────
const GeneratePayslipForm = ({ employees, onSuccess }) => {
    const [isOpen,  setIsOpen]  = useState(false)
    const [loading, setLoading] = useState(false)

    const currentMonth = new Date().getMonth() + 1
    const currentYear  = new Date().getFullYear()

    const [selectedEmpId,    setSelectedEmpId]    = useState(employees[0]?._id ?? "")
    const [month,            setMonth]            = useState(currentMonth)
    const [year,             setYear]             = useState(currentYear)
    const [empDetail,        setEmpDetail]        = useState(null)
    const [lopInfo,          setLopInfo]          = useState(null)
    const [fetchingEmp,      setFetchingEmp]      = useState(false)
    // Admin-editable allowances override
    const [customAllowances, setCustomAllowances] = useState("")
    const [editAllowances,   setEditAllowances]   = useState(false)

    const fetchEmployeeDetail = useCallback(async (empId) => {
        if (!empId) return
        setFetchingEmp(true)
        try {
            const res = await api.get(`/employees/${empId}`)
            setEmpDetail(res.data)
            setCustomAllowances(res.data.allowances ?? 0)
            setEditAllowances(false)
        } catch {
            setEmpDetail(null)
        } finally {
            setFetchingEmp(false)
        }
    }, [])

    const fetchLopInfo = useCallback(async (empId, m, y) => {
        if (!empId) return
        try {
            const res = await api.get(`/leave/lop-summary?employeeId=${empId}&month=${m}&year=${y}`)
            setLopInfo(res.data)
        } catch {
            setLopInfo(null)
        }
    }, [])

    useEffect(() => {
        if (isOpen && selectedEmpId) {
            fetchEmployeeDetail(selectedEmpId)
            fetchLopInfo(selectedEmpId, month, year)
        }
    }, [isOpen, selectedEmpId, month, year, fetchEmployeeDetail, fetchLopInfo])

    // ── Derived values ────────────────────────────────────────────────────────
    const emp          = empDetail || employees.find((e) => (e._id ?? e.id) === selectedEmpId)
    const basicSalary  = emp?.basicSalary  ?? 0
    const allowances   = editAllowances ? Number(customAllowances) : (emp?.allowances ?? 0)
    const baseDeduct   = emp?.deductions   ?? 0

    const weekOffDays   = emp?.workSchedule?.weekOff ?? ["Saturday", "Sunday"]
    const totalWorkDays = getWorkingDays(year, month, weekOffDays)
    const lopDays       = lopInfo?.days   ?? 0
    const lopAmount     = lopInfo?.amount ?? parseFloat(((basicSalary / 26) * lopDays).toFixed(2))
    const otherDeduct   = Math.max(0, baseDeduct - (emp?.deductions === baseDeduct ? 0 : lopAmount))
    const totalDeduct   = parseFloat((baseDeduct + lopAmount).toFixed(2))
    const daysWorked    = totalWorkDays - lopDays
    const netSalary     = parseFloat((basicSalary + allowances - totalDeduct).toFixed(2))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post("/payslips", {
                employeeId: selectedEmpId,
                month,
                year,
                // send custom allowances only if admin changed it
                ...(editAllowances && { allowances: customAllowances }),
            })
            toast.success("Payslip generated successfully")
            setIsOpen(false)
            onSuccess()
        } catch (error) {
            toast.error(error?.response?.data?.error || error?.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return (
        <button onClick={() => setIsOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate Payslip
        </button>
    )

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up my-8 shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Generate Monthly Payslip</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Employee */}
                    <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Employee</label>
                        <select
                            name="employeeId" required
                            value={selectedEmpId}
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                        >
                            {employees.map((e) => (
                                <option key={e._id ?? e.id} value={e._id ?? e.id}>
                                    {e.firstName} {e.lastName} — {e.position}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month & Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-800 mb-2">Month</label>
                            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                                {MONTH_NAMES.map((name, i) => (
                                    <option key={i + 1} value={i + 1}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-800 mb-2">Year</label>
                            <input
                                type="number" value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                min={2020} max={currentYear + 1}
                            />
                        </div>
                    </div>

                    {fetchingEmp ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span>
                        </div>
                    ) : emp ? (
                        <>
                            {/* ── Working Days ──────────────────────────── */}
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    Working Days — {MONTH_NAMES[month - 1]} {year}
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-800">{totalWorkDays}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Total work days</p>
                                    </div>
                                    <div className="text-center border-x border-slate-200">
                                        <p className="text-2xl font-bold text-rose-500">{lopDays}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">LOP days</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{daysWorked}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Days worked</p>
                                    </div>
                                </div>
                                {weekOffDays.length > 0 && (
                                    <p className="text-xs text-slate-400">Week off: {weekOffDays.join(", ")}</p>
                                )}
                            </div>

                            {/* ── LOP Banner ────────────────────────────── */}
                            {lopDays > 0 && (
                                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
                                    <AlertCircleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-rose-700">Loss of Pay Deduction</p>
                                        <p className="text-xs text-rose-500 mt-0.5">
                                            {lopDays} LOP day{lopDays > 1 ? "s" : ""} approved
                                            → <span className="font-semibold">{inr(lopAmount)}</span> deducted
                                            <span className="block text-rose-400 mt-0.5">
                                                (₹{basicSalary.toLocaleString("en-IN")} ÷ 26 × {lopDays} days)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Salary Breakdown ──────────────────────── */}
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-1.5">
                                    <InfoIcon className="w-3.5 h-3.5 text-slate-400" />
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary Breakdown</p>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {/* Basic */}
                                    <SalaryRow label="Basic Salary" value={inr(basicSalary)} />

                                    {/* Allowances — editable */}
                                    <div className="flex justify-between items-center px-4 py-2.5">
                                        <span className="text-sm text-slate-600">Allowances</span>
                                        <div className="flex items-center gap-2">
                                            {editAllowances ? (
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    value={customAllowances}
                                                    onChange={(e) => setCustomAllowances(e.target.value)}
                                                    className="w-28 text-right text-sm border border-indigo-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-green-600">+ {inr(allowances)}</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setEditAllowances((v) => !v)}
                                                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title={editAllowances ? "Lock allowances" : "Override allowances"}
                                            >
                                                <PencilIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Base deductions */}
                                    {baseDeduct > 0 && (
                                        <SalaryRow
                                            label="Other Deductions"
                                            value={`– ${inr(baseDeduct)}`}
                                            color="rose"
                                        />
                                    )}

                                    {/* LOP deduction line */}
                                    {lopDays > 0 && (
                                        <SalaryRow
                                            label={`Loss of Pay (${lopDays} day${lopDays > 1 ? "s" : ""})`}
                                            value={`– ${inr(lopAmount)}`}
                                            color="rose"
                                        />
                                    )}

                                    {/* Total deductions summary */}
                                    {totalDeduct > 0 && (
                                        <SalaryRow
                                            label="Total Deductions"
                                            value={`– ${inr(totalDeduct)}`}
                                            color="rose"
                                            bold
                                        />
                                    )}

                                    {/* Net */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-indigo-50">
                                        <span className="text-sm font-bold text-slate-800">Net Salary</span>
                                        <span className={`text-base font-bold ${netSalary < 0 ? "text-rose-600" : "text-indigo-600"}`}>
                                            {inr(netSalary)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Employee info pill */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{emp.firstName} {emp.lastName} · {emp.department} · {emp.position}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4">Select an employee to see details</p>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading || !emp} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? "Generating…" : "Generate Payslip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const SalaryRow = ({ label, value, color, bold }) => (
    <div className="flex justify-between items-center px-4 py-2.5">
        <span className={`text-sm ${bold ? "font-semibold text-slate-700" : "text-slate-600"}`}>{label}</span>
        <span className={`text-sm ${bold ? "font-semibold" : "font-medium"} ${
            color === "green" ? "text-green-600" :
            color === "rose"  ? "text-rose-500"  : "text-slate-800"
        }`}>{value}</span>
    </div>
)

export default GeneratePayslipForm