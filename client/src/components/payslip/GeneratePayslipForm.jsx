import { Loader2, Plus, X, UserIcon, AlertCircleIcon, InfoIcon, PencilIcon, SearchIcon, ChevronDownIcon } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

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
    const [customAllowances, setCustomAllowances] = useState("")
    const [editAllowances,   setEditAllowances]   = useState(false)

    // ── Employee search combobox ────────────────────────────────────────────
    const [empSearchTerm,   setEmpSearchTerm]   = useState("")
    const [empDropdownOpen, setEmpDropdownOpen] = useState(false)
    const empComboRef = useRef(null)

    const empLabel = (e) => `${e.firstName} ${e.lastName} — ${e.position}`

    // Keep the search box showing the selected employee's name whenever
    // the dropdown isn't actively being used to search
    useEffect(() => {
        if (empDropdownOpen) return
        const selected = employees.find((e) => (e._id ?? e.id) === selectedEmpId)
        setEmpSearchTerm(selected ? empLabel(selected) : "")
    }, [selectedEmpId, employees, empDropdownOpen])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (empComboRef.current && !empComboRef.current.contains(e.target)) {
                setEmpDropdownOpen(false)
            }
        }
        if (empDropdownOpen) document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [empDropdownOpen])

    const filteredEmployees = employees.filter((e) => {
        const q = empSearchTerm.trim().toLowerCase()
        if (!q) return true
        return (
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
            e.position?.toLowerCase().includes(q) ||
            e.department?.toLowerCase().includes(q) ||
            e.employeeId?.toLowerCase().includes(q)
        )
    })

    const selectEmployee = (e) => {
        setSelectedEmpId(e._id ?? e.id)
        setEmpSearchTerm(empLabel(e))
        setEmpDropdownOpen(false)
    }

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
    const emp               = empDetail || employees.find((e) => (e._id ?? e.id) === selectedEmpId)
    const basicSalary       = emp?.basicSalary ?? 0
    const allowances        = editAllowances ? Number(customAllowances) : (emp?.allowances ?? 0)
    const lopDays           = lopInfo?.days             ?? 0
    const workingDays       = lopInfo?.workingDays      ?? 0
    const presentDays       = lopInfo?.presentDays      ?? 0
    const weekOffLabel      = lopInfo?.weekOffLabel     ?? "Sunday"
    const lateCount         = lopInfo?.lateCount        ?? 0
    const lateDeductionDays = lopInfo?.lateDeductionDays ?? 0

    // Mirror payslipController calcSalary:
    //   earnedBasic = perDay × presentDays
    //   lateAmount  = perDay × lateDeductionDays  (separate deduction)
    //   LOP is already absent — no extra deduction
    //   netSalary   = earnedBasic − lateAmount + allowances
    //
    // Use the full-precision rate for the math; only round for display —
    // rounding perDay first before multiplying compounds into paise/rupee
    // errors (e.g. a perfect-attendance month showing ₹14,999.92 instead of
    // exactly ₹15,000.00).
    const rawPerDaySalary = workingDays > 0 ? basicSalary / workingDays : 0
    const perDaySalary    = parseFloat(rawPerDaySalary.toFixed(2)) // display only
    const earnedBasic     = parseFloat((rawPerDaySalary * presentDays).toFixed(2))
    const lateAmount      = parseFloat((rawPerDaySalary * lateDeductionDays).toFixed(2))
    const netSalary       = parseFloat((earnedBasic - lateAmount + allowances).toFixed(2))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post("/payslips", {
                employeeId: selectedEmpId,
                month,
                year,
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
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up my-8 shadow-2xl mt-80">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Generate Monthly Payslip</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Employee */}
                    <div ref={empComboRef} className="relative">
                        <label className="block text-sm font-medium text-slate-800 mb-2">Employee</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={empSearchTerm}
                                onFocus={(e) => { setEmpDropdownOpen(true); e.target.select() }}
                                onChange={(e) => { setEmpSearchTerm(e.target.value); setEmpDropdownOpen(true) }}
                                placeholder="Search by name, position, department…"
                                className="w-full pl-9 pr-9"
                                autoComplete="off"
                            />
                            <ChevronDownIcon className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${empDropdownOpen ? "rotate-180" : ""}`} />
                        </div>

                        {empDropdownOpen && (
                            <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                                {filteredEmployees.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No employees found</p>
                                ) : (
                                    filteredEmployees.map((e) => (
                                        <button
                                            type="button"
                                            key={e._id ?? e.id}
                                            onClick={() => selectEmployee(e)}
                                            className={`w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 transition-colors ${
                                                (e._id ?? e.id) === selectedEmpId ? "bg-indigo-50" : ""
                                            }`}
                                        >
                                            <p className="text-sm font-medium text-slate-800">{e.firstName} {e.lastName}</p>
                                            <p className="text-xs text-slate-400">{e.position} · {e.department}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
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
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading…</span>
                        </div>
                    ) : emp ? (
                        <>
                            {/* ── LOP Banner ── */}
                            {lopDays > 0 && (
                                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
                                    <AlertCircleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-rose-700">Loss of Pay</p>
                                        <p className="text-xs text-rose-500 mt-0.5">
                                            {lopDays} LOP day{lopDays > 1 ? "s" : ""} — counted as absent, no extra deduction
                                            <span className="block text-rose-400 mt-0.5">
                                                Already excluded from present days ({presentDays}/{workingDays} days)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Late Banner ── */}
                            {lateCount > 0 && (
                                <div className={`rounded-xl p-4 flex items-start gap-3 ${
                                    lateDeductionDays > 0
                                        ? "bg-amber-50 border border-amber-200"
                                        : "bg-yellow-50 border border-yellow-200"
                                }`}>
                                    <AlertCircleIcon className={`w-4 h-4 shrink-0 mt-0.5 ${
                                        lateDeductionDays > 0 ? "text-amber-500" : "text-yellow-500"
                                    }`} />
                                    <div>
                                        <p className={`text-sm font-semibold ${
                                            lateDeductionDays > 0 ? "text-amber-700" : "text-yellow-700"
                                        }`}>
                                            Late Check-ins
                                        </p>
                                        <p className={`text-xs mt-0.5 ${
                                            lateDeductionDays > 0 ? "text-amber-500" : "text-yellow-500"
                                        }`}>
                                            {lateCount} late check-in{lateCount > 1 ? "s" : ""} this month
                                            {lateDeductionDays > 0
                                                ? ` → ${lateDeductionDays} day${lateDeductionDays > 1 ? "s" : ""} deducted (${inr(lateAmount)})`
                                                : ` → ${3 - (lateCount % 3)} more = 1 day deducted`
                                            }
                                            <span className="block mt-0.5 opacity-75">
                                                Every 3 late check-ins = 1 day salary deducted
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Salary Breakdown ── */}
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-1.5">
                                    <InfoIcon className="w-3.5 h-3.5 text-slate-400" />
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Salary Breakdown
                                    </p>
                                    <span className="ml-auto text-xs text-slate-400">
                                        {workingDays > 0 ? `${presentDays}/${workingDays} days present` : "Loading…"}
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100">

                                    {/* Earned Basic */}
                                    <SalaryRow
                                        label={`Earned Basic (₹${basicSalary.toLocaleString("en-IN")} ÷ ${workingDays} × ${presentDays} days)`}
                                        value={inr(earnedBasic)}
                                    />

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
                                                <span className="text-sm font-medium text-green-600">
                                                    + {inr(allowances)}
                                                </span>
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

                                    {/* LOP — info only, no deduction */}
                                    {lopDays > 0 && (
                                        <SalaryRow
                                            label={`LOP (${lopDays} day${lopDays > 1 ? "s" : ""}) — counted as absent`}
                                            value="—"
                                            color="rose"
                                        />
                                    )}

                                    {/* Late Deduction */}
                                    {lateDeductionDays > 0 && (
                                        <SalaryRow
                                            label={`Late Deduction (${lateCount} lates ÷ 3 = ${lateDeductionDays} day${lateDeductionDays > 1 ? "s" : ""})`}
                                            value={`– ${inr(lateAmount)}`}
                                            color="rose"
                                            bold
                                        />
                                    )}

                                    {/* Net Salary */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-indigo-50">
                                        <span className="text-sm font-bold text-slate-800">Net Salary</span>
                                        <span className={`text-base font-bold ${netSalary < 0 ? "text-rose-600" : "text-indigo-600"}`}>
                                            {inr(netSalary)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Employee pill */}
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{emp.firstName} {emp.lastName} · {emp.department} · {emp.position}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4">Select an employee to see details</p>
                    )}

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

// ── Helper ────────────────────────────────────────────────────────────────────
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