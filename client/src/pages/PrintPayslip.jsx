import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Loading from "../components/Loading"
import { format } from "date-fns"
import { PrinterIcon, BuildingIcon } from "lucide-react"
import api from "../api/axios"

const COMPANY = {
    name:    "LiveDigit",
    address: "Hyderabad, Telangana, India",
    email:   "hr@livedigit.com",
    website: "www.livedigit.com",
}

const PrintPayslip = () => {
    const { id } = useParams()
    const [payslip, setPayslip] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/payslips/${id}`)
            .then((res) => setPayslip(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <Loading />
    if (!payslip) return <p className="text-center py-12 text-slate-400">Payslip not found</p>

    const emp         = payslip.employee || {}
    const lopAmount   = payslip.lopAmount  ?? 0
    const lopDays     = payslip.lopDays    ?? 0
    const otherDeduct = Math.max(0, (payslip.deductions ?? 0) - lopAmount)
    const grossEarnings = (payslip.basicSalary ?? 0) + (payslip.allowances ?? 0)
    const netSalary     = payslip.netSalary ?? 0
    const periodLabel   = format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
            <div className="max-w-3xl mx-auto">

                {/* Print button — hidden when printing */}
                <div className="flex justify-end mb-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow transition-colors"
                    >
                        <PrinterIcon className="w-4 h-4" /> Print / Download
                    </button>
                </div>

                {/* ── Payslip Document ── */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">

                    {/* ── Top Header Band ── */}
                    <div className="bg-indigo-700 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Logo / Company initial */}
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
                            <p className="text-indigo-300 text-xs mt-1 font-mono">
                                REF #{payslip._id?.toString().slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* ── Employee Info Strip ── */}
                    <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <InfoStrip label="Employee Name"  value={`${emp.firstName ?? ""} ${emp.lastName ?? ""}`} />
                            <InfoStrip label="Employee ID"    value={emp.employeeId || `EMP-${payslip._id?.toString().slice(-5).toUpperCase()}`} highlight />
                            <InfoStrip label="Department"     value={emp.department} />
                            <InfoStrip label="Designation"    value={emp.position} />
                            <InfoStrip label="Date of Joining"
                                value={emp.joinDate ? format(new Date(emp.joinDate), "dd MMM yyyy") : "—"} />
                            <InfoStrip label="Pay Period"     value={periodLabel} />
                            <InfoStrip label="Email"          value={emp.email} />
                            <InfoStrip label="Payment Mode"   value="Bank Transfer" />
                        </div>
                    </div>

                    <div className="px-8 py-6 space-y-6">

                        {/* ── Attendance Summary ── */}
                        {(payslip.totalWorkDays != null) && (
                            <div>
                                <SectionTitle>Attendance Summary</SectionTitle>
                                <div className="grid grid-cols-4 gap-3 mt-3">
                                    <AttBox label="Scheduled Days" value={payslip.totalWorkDays}  color="slate"  />
                                    <AttBox label="Days Worked"    value={payslip.daysWorked}     color="green"  />
                                    <AttBox label="LOP Days"       value={lopDays}                color={lopDays > 0 ? "rose" : "slate"} />
                                    <AttBox label="Absent"
                                        value={Math.max(0, (payslip.totalWorkDays ?? 0) - (payslip.daysWorked ?? 0) - lopDays)}
                                        color="yellow"
                                    />
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
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 w-1/2">
                                                Earnings
                                            </th>
                                            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                                                Amount (₹)
                                            </th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-rose-50 border-b border-slate-200 w-1/2">
                                                Deductions
                                            </th>
                                            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-rose-50 border-b border-slate-200">
                                                Amount (₹)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-100">
                                            <td className="px-5 py-3 text-slate-700">Basic Salary</td>
                                            <td className="px-5 py-3 text-right font-medium text-slate-900">
                                                {(payslip.basicSalary ?? 0).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-5 py-3 text-slate-700 bg-rose-50/30">
                                                {otherDeduct > 0 ? "Other Deductions" : "—"}
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-rose-600 bg-rose-50/30">
                                                {otherDeduct > 0 ? otherDeduct.toLocaleString("en-IN") : "—"}
                                            </td>
                                        </tr>
                                        <tr className="border-b border-slate-100">
                                            <td className="px-5 py-3 text-slate-700">Allowances</td>
                                            <td className="px-5 py-3 text-right font-medium text-slate-900">
                                                {(payslip.allowances ?? 0).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-5 py-3 text-slate-700 bg-rose-50/30">
                                                {lopDays > 0
                                                    ? <>Loss of Pay <span className="text-xs text-slate-400">({lopDays}d)</span></>
                                                    : "—"
                                                }
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-rose-600 bg-rose-50/30">
                                                {lopDays > 0 ? lopAmount.toLocaleString("en-IN") : "—"}
                                            </td>
                                        </tr>
                                        {/* Totals row */}
                                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700">Total Earnings</td>
                                            <td className="px-5 py-3 text-right font-bold text-green-600">
                                                {grossEarnings.toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700 bg-rose-50">Total Deductions</td>
                                            <td className="px-5 py-3 text-right font-bold text-rose-600 bg-rose-50">
                                                {(payslip.deductions ?? 0).toLocaleString("en-IN")}
                                            </td>
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
                                <p className="text-indigo-300 text-xs mt-1">
                                    {periodLabel} · Paid via Bank Transfer
                                </p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-indigo-300 text-xs">Gross Earnings</p>
                                <p className="text-white font-semibold">₹ {grossEarnings.toLocaleString("en-IN")}</p>
                                <p className="text-indigo-300 text-xs mt-2">Total Deductions</p>
                                <p className="text-rose-300 font-semibold">– ₹ {(payslip.deductions ?? 0).toLocaleString("en-IN")}</p>
                            </div>
                        </div>

                        {/* ── LOP note ── */}
                        {lopDays > 0 && (
                            <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-3 text-xs text-rose-600">
                                <span className="font-semibold">Loss of Pay Note:</span>{" "}
                                {lopDays} LOP day{lopDays > 1 ? "s" : ""} deducted @ ₹{(payslip.basicSalary / 26).toFixed(2)}/day
                                (Basic Salary ÷ 26 working days)
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

            {/* Print styles */}
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const attColors = {
    green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200"  },
    rose:   { bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-200"   },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
    slate:  { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200"  },
}

const AttBox = ({ label, value, color = "slate" }) => {
    const c = attColors[color] ?? attColors.slate
    return (
        <div className={`rounded-xl border ${c.bg} ${c.border} px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold ${c.text}`}>{value ?? 0}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
    )
}

export default PrintPayslip