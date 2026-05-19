import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { format } from "date-fns"
import { PrinterIcon, BuildingIcon } from "lucide-react"
import Loading from "../components/Loading"
import api from "../api/axios"

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY = {
    name:    "LiveDigit",
    address: "Hyderabad, Telangana, India",
    email:   "hr@livedigit.com",
    website: "www.livedigit.com",
}

const ATT_COLORS = {
    green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200"  },
    rose:   { bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-200"   },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
    slate:  { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200"  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inr = (n) => Number(n ?? 0).toLocaleString("en-IN")

const derivePayslip = (p) => {
    const basicSalary   = p.basicSalary   ?? 0
    const allowances    = p.allowances    ?? 0
    const daysWorked    = p.daysWorked    ?? 0
    const deductions    = p.deductions    ?? 0
    const lopDays       = p.lopDays       ?? 0   // from backend (approved LOP leave only)
    const totalWorkDays = 26                      // always fixed

    const perDaySalary  = basicSalary / totalWorkDays
    const earnedBasic   = parseFloat((perDaySalary * daysWorked).toFixed(2))
    const lopAmount     = parseFloat((perDaySalary * lopDays).toFixed(2))
    const otherDeduct   = Math.max(0, deductions - lopAmount)
    const grossEarnings = parseFloat((earnedBasic + allowances).toFixed(2))
    const netSalary     = Math.max(0, parseFloat((grossEarnings - deductions).toFixed(2)))
    const absentDays    = Math.max(0, totalWorkDays - daysWorked - lopDays)

    return {
        basicSalary, allowances, totalWorkDays, daysWorked, deductions,
        perDaySalary, earnedBasic, lopDays, lopAmount,
        otherDeduct, grossEarnings, netSalary, absentDays,
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{children}</h3>
)

const InfoStrip = ({ label, value, highlight }) => (
    <div>
        <p className="text-xs text-indigo-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-semibold truncate ${highlight ? "text-indigo-700" : "text-slate-800"}`}>
            {value || "—"}
        </p>
    </div>
)

const AttBox = ({ label, value, color = "slate" }) => {
    const c = ATT_COLORS[color] ?? ATT_COLORS.slate
    return (
        <div className={`rounded-xl border ${c.bg} ${c.border} px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold ${c.text}`}>{value ?? 0}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
    )
}

const EarningsRow = ({ earning, earningAmt, deduction, deductionAmt }) => (
    <tr className="border-b border-slate-100">
        <td className="px-5 py-3 text-slate-700">{earning}</td>
        <td className="px-5 py-3 text-right font-medium text-slate-900">{earningAmt}</td>
        <td className="px-5 py-3 text-slate-700 bg-rose-50/30">{deduction || "—"}</td>
        <td className="px-5 py-3 text-right font-medium text-rose-600 bg-rose-50/30">
            {deductionAmt || "—"}
        </td>
    </tr>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const PrintPayslip = () => {
    const { id }                = useParams()
    const [payslip, setPayslip] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/payslips/${id}`)
            .then((res) => setPayslip(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading)  return <Loading />
    if (!payslip) return <p className="text-center py-12 text-slate-400">Payslip not found</p>

    const emp         = payslip.employee || {}
    const periodLabel = format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")
    const ref         = `#${payslip._id?.toString().slice(-8).toUpperCase()}`
    const employeeId  = emp.employeeId || `EMP-${payslip._id?.toString().slice(-5).toUpperCase()}`
    const joinDate    = emp.joinDate ? format(new Date(emp.joinDate), "dd MMM yyyy") : "—"

    const {
        basicSalary, allowances, totalWorkDays, daysWorked,
        deductions, perDaySalary, lopDays, lopAmount,
        otherDeduct, grossEarnings, netSalary, absentDays,
    } = derivePayslip(payslip)

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
            <div className="max-w-3xl mx-auto">

                {/* Print button */}
                <div className="flex justify-end mb-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow transition-colors"
                    >
                        <PrinterIcon className="w-4 h-4" /> Print / Download
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">

                    {/* ── Header ── */}
                    <div className="bg-indigo-700 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                                <img
                                    src="/logo.png" alt="Logo"
                                    className="h-8 w-auto object-contain"
                                    onError={(e) => {
                                        e.target.style.display = "none"
                                        e.target.nextSibling.style.display = "flex"
                                    }}
                                />
                                <BuildingIcon className="w-6 h-6 text-white hidden" />
                            </div>
                            <div>
                                <h1 className="text-white text-xl font-bold tracking-tight">{COMPANY.name}</h1>
                                <p className="text-indigo-200 text-xs mt-0.5">{COMPANY.address}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-indigo-200 text-xs uppercase tracking-widest font-medium">Payslip</p>
                            <p className="text-white text-2xl font-bold mt-0.5">{periodLabel}</p>
                            <p className="text-indigo-300 text-xs mt-1 font-mono">REF {ref}</p>
                        </div>
                    </div>

                    {/* ── Employee Info ── */}
                    <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <InfoStrip label="Employee Name"   value={`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()} />
                            <InfoStrip label="Employee ID"     value={employeeId} highlight />
                            <InfoStrip label="Department"      value={emp.department} />
                            <InfoStrip label="Designation"     value={emp.position} />
                            <InfoStrip label="Date of Joining" value={joinDate} />
                            <InfoStrip label="Pay Period"      value={periodLabel} />
                            <InfoStrip label="Email"           value={emp.email} />
                            <InfoStrip label="Payment Mode"    value="Bank Transfer" />
                        </div>
                    </div>

                    <div className="px-8 py-6 space-y-6">

                        {/* ── Attendance Summary ── */}
                        {payslip.totalWorkDays != null && (
                            <div>
                                <SectionTitle>Attendance Summary</SectionTitle>
                                <div className="grid grid-cols-4 gap-3 mt-3">
                                    <AttBox label="Scheduled Days" value={totalWorkDays} color="slate" />
                                    <AttBox label="Days Worked"    value={daysWorked}    color="green" />
                                    <AttBox label="LOP Days"       value={lopDays}       color={lopDays > 0 ? "rose" : "slate"} />
                                    <AttBox label="Absent"         value={absentDays}    color={absentDays > 0 ? "yellow" : "slate"} />
                                </div>
                            </div>
                        )}

                        {/* ── Earnings & Deductions ── */}
                        <div>
                            <SectionTitle>Earnings &amp; Deductions</SectionTitle>
                            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            {[
                                                ["Earnings",   "text-left",  "bg-slate-50"],
                                                ["Amount (₹)", "text-right", "bg-slate-50"],
                                                ["Deductions", "text-left",  "bg-rose-50" ],
                                                ["Amount (₹)", "text-right", "bg-rose-50" ],
                                            ].map(([label, align, bg], i) => (
                                                <th key={i} className={`${align} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${bg} border-b border-slate-200`}>
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <EarningsRow
                                            earning="Salary (Earned)"
                                            earningAmt={inr(basicSalary)}
                                            deduction={otherDeduct > 0 ? "Other Deductions" : null}
                                            deductionAmt={otherDeduct > 0 ? inr(otherDeduct) : null}
                                        />
                                        <EarningsRow
                                            earning="Allowances"
                                            earningAmt={inr(allowances)}
                                            deduction={lopDays > 0
                                                ? <>Loss of Pay <span className="text-xs text-slate-400">({lopDays}d)</span></>
                                                : null
                                            }
                                            deductionAmt={lopDays > 0 ? inr(lopAmount) : null}
                                        />
                                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700">Total Earnings</td>
                                            <td className="px-5 py-3 text-right font-bold text-green-600">{inr(grossEarnings)}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700 bg-rose-50">Total Deductions</td>
                                            <td className="px-5 py-3 text-right font-bold text-rose-600 bg-rose-50">{inr(deductions)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Net Salary Banner ── */}
                        <div className="rounded-xl bg-indigo-700 px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-indigo-200 text-xs uppercase tracking-widest font-medium">Net Salary Payable</p>
                                <p className="text-white text-3xl font-bold mt-1">
                                    ₹ {netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-indigo-300 text-xs mt-1">{periodLabel} · Paid via Bank Transfer</p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-indigo-300 text-xs">Gross Earnings</p>
                                <p className="text-white font-semibold">₹ {inr(grossEarnings)}</p>
                                <p className="text-indigo-300 text-xs mt-2">Total Deductions</p>
                                <p className="text-rose-300 font-semibold">– ₹ {inr(deductions)}</p>
                            </div>
                        </div>

                        {/* ── LOP Note ── */}
                        {lopDays > 0 && (
                            <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-3 text-xs text-rose-600">
                                <span className="font-semibold">Loss of Pay Note:</span>{" "}
                                {lopDays} LOP day{lopDays > 1 ? "s" : ""} deducted
                                @ ₹{perDaySalary.toFixed(2)}/day (Basic Salary ÷ {totalWorkDays} scheduled days)
                            </div>
                        )}

                        {/* ── Footer ── */}
                        <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
                            <p>This is a system-generated payslip and does not require a physical signature.</p>
                            <p className="font-mono">{COMPANY.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    )
}

export default PrintPayslip