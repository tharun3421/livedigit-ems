// import { useEffect, useState } from "react"
// import { useParams } from "react-router-dom"
// import { format } from "date-fns"
// import { PrinterIcon, BuildingIcon } from "lucide-react"
// import Loading from "../components/Loading"
// import api from "../api/axios"

// const COMPANY = {
//     name:    "LiveDigit.in",
//     address: "Visakhapatnam & Hyderabad",
//     email:   "hrsupport@livedigit.in",
// }

// const ATT_COLORS = {
//     green: { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
//     rose:  { bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-200"  },
//     slate: { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200" },
// }

// const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN")

// const SectionTitle = ({ children }) => (
//     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{children}</h3>
// )

// const InfoStrip = ({ label, value, highlight }) => (
//     <div>
//         <p className="text-xs text-indigo-400 uppercase tracking-wider mb-0.5">{label}</p>
//         <p className={`text-sm font-semibold truncate ${highlight ? "text-indigo-700" : "text-slate-800"}`}>
//             {value || "—"}
//         </p>
//     </div>
// )

// const AttBox = ({ label, value, sub, color = "slate" }) => {
//     const c = ATT_COLORS[color] ?? ATT_COLORS.slate
//     return (
//         <div className={`rounded-xl border ${c.bg} ${c.border} px-4 py-3 text-center`}>
//             <p className={`text-2xl font-bold ${c.text}`}>{value ?? 0}</p>
//             <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
//             {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
//         </div>
//     )
// }

// const EarningsRow = ({ earning, earningAmt, deduction, deductionAmt }) => (
//     <tr className="border-b border-slate-100">
//         <td className="px-5 py-3 text-slate-700">{earning}</td>
//         <td className="px-5 py-3 text-right font-medium text-slate-900">{earningAmt}</td>
//         <td className="px-5 py-3 text-slate-700 bg-rose-50/30">{deduction || "—"}</td>
//         <td className="px-5 py-3 text-right font-medium text-rose-600 bg-rose-50/30">
//             {deductionAmt || "—"}
//         </td>
//     </tr>
// )

// // Working days = calendar days − 4 Sundays − 2 Earned Leaves = calendar days − 6
// const getWorkingDays = (month, year) => {
//     return new Date(year, month, 0).getDate() - 6
// }

// const PrintPayslip = () => {
//     const { id } = useParams()
//     const [payslip, setPayslip] = useState(null)
//     const [loading, setLoading] = useState(true)

//     useEffect(() => {
//         api.get(`/payslips/${id}`)
//             .then((res) => setPayslip(res.data))
//             .catch(console.error)
//             .finally(() => setLoading(false))
//     }, [id])

//     if (loading)  return <Loading />
//     if (!payslip) return <p className="text-center py-12 text-slate-400">Payslip not found</p>

//     const emp         = payslip.employee || {}
//     const periodLabel = format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")
//     const employeeId  = emp.employeeId || `EMP-${payslip._id?.toString().slice(-5).toUpperCase()}`
//     const joinDate    = emp.joinDate ? format(new Date(emp.joinDate), "dd MMM yyyy") : "—"

//     // ── Working days: use stored value from API, fallback to recompute ──
//     const workingDays = payslip.workingDays ?? getWorkingDays(payslip.month, payslip.year)

//     // ── Always recompute from atomic fields using correct working days ──
//     const basicSalary   = payslip.basicSalary ?? 0
//     const allowances    = payslip.allowances  ?? 0
//     const lopDays       = payslip.lopDays     ?? 0
//     const lopAmount     = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
//     const grossEarnings = parseFloat((basicSalary + allowances).toFixed(2))
//     const netSalary     = parseFloat((grossEarnings - lopAmount).toFixed(2))
//     const perDaySalary  = parseFloat((basicSalary / workingDays).toFixed(2))

//     // ── Live leave counts injected by getPayslipById (scoped to this month) ──
//     const casualLeaves = emp.casualLeaves ?? 0
//     const sickLeaves   = emp.sickLeaves   ?? 0
//     const earnedLeaves = emp.earnedLeaves ?? 0
//     const lopLeaves    = emp.lopLeaves    ?? lopDays
//     const totalLeaves  = casualLeaves + sickLeaves + earnedLeaves

//     return (
//         <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
//             <div className="max-w-3xl mx-auto">

//                 <div className="flex justify-end mb-4 print:hidden">
//                     <button
//                         onClick={() => window.print()}
//                         className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow transition-colors"
//                     >
//                         <PrinterIcon className="w-4 h-4" /> Print / Download
//                     </button>
//                 </div>

//                 <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">

//                     {/* ── Header ── */}
//                     <div className="bg-indigo-700 px-8 py-6 flex items-center justify-between">
//                         <div className="flex items-center gap-4">
//                             <div className="w-12 h-12 rounded-xl bg-white border border-white/30 flex items-center justify-center shrink-0">
//                                 <img
//                                     src="/logo.png" alt="Logo"
//                                     className="h-8 w-auto object-contain"
//                                     onError={(e) => {
//                                         e.target.style.display = "none"
//                                         e.target.nextSibling.style.display = "flex"
//                                     }}
//                                 />
//                                 <BuildingIcon className="w-6 h-6 text-white hidden" />
//                             </div>
//                             <div>
//                                 <h1 className="text-white text-xl font-bold tracking-tight">{COMPANY.name}</h1>
//                                 <p className="text-indigo-200 text-xs mt-0.5">{COMPANY.address}</p>
//                             </div>
//                         </div>
//                         <div className="text-right">
//                             <p className="text-indigo-200 text-xs uppercase tracking-widest font-medium">Payslip</p>
//                             <p className="text-white text-2xl font-bold mt-0.5">{periodLabel}</p>
//                         </div>
//                     </div>

//                     {/* ── Employee Info ── */}
//                     <div className="bg-indigo-50 border-b border-indigo-100 px-8 py-4">
//                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//                             <InfoStrip label="Employee Name"   value={`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()} />
//                             <InfoStrip label="Employee ID"     value={employeeId} highlight />
//                             <InfoStrip label="Department"      value={emp.department} />
//                             <InfoStrip label="Designation"     value={emp.position} />
//                             <InfoStrip label="Date of Joining" value={joinDate} />
//                             <InfoStrip label="Pay Period"      value={periodLabel} />
//                             <InfoStrip label="Email"           value={emp.email} />
//                             <InfoStrip label="Payment Mode"    value="Bank Transfer" />
//                         </div>
//                     </div>

//                     <div className="px-8 py-6 space-y-6">

//                         {/* ── Attendance Summary ── */}
//                         <div>
//                             <SectionTitle>Attendance Summary</SectionTitle>
//                             <div className="grid grid-cols-3 gap-3 mt-3">
//                                 <AttBox
//                                     label="Scheduled Days"
//                                     value={workingDays}
//                                     sub={`Cal days − 6 (4 Sun + 2 EL)`}
//                                     color="slate"
//                                 />
//                                 <AttBox
//                                     label="LOP Days"
//                                     value={lopLeaves}
//                                     color={lopLeaves > 0 ? "rose" : "slate"}
//                                 />
//                                 <AttBox
//                                     label="Leaves Taken"
//                                     value={totalLeaves}
//                                     sub={`Casual:${casualLeaves} · Sick:${sickLeaves} · Earn:${earnedLeaves}`}
//                                     color={totalLeaves > 0 ? "green" : "slate"}
//                                 />
//                             </div>
//                         </div>

//                         {/* ── Earnings & Deductions ── */}
//                         <div>
//                             <SectionTitle>Earnings &amp; Deductions</SectionTitle>
//                             <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
//                                 <table className="w-full text-sm">
//                                     <thead>
//                                         <tr>
//                                             {[
//                                                 ["Earnings",   "text-left",  "bg-slate-50"],
//                                                 ["Amount (₹)", "text-right", "bg-slate-50"],
//                                                 ["Deductions", "text-left",  "bg-rose-50" ],
//                                                 ["Amount (₹)", "text-right", "bg-rose-50" ],
//                                             ].map(([label, align, bg], i) => (
//                                                 <th key={i} className={`${align} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${bg} border-b border-slate-200`}>
//                                                     {label}
//                                                 </th>
//                                             ))}
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         <EarningsRow
//                                             earning="Basic Salary"
//                                             earningAmt={fmt(basicSalary)}
//                                             deduction={lopDays > 0
//                                                 ? <span>Loss of Pay <span className="text-xs text-slate-400">({lopDays}d)</span></span>
//                                                 : null
//                                             }
//                                             deductionAmt={lopDays > 0 ? fmt(lopAmount) : null}
//                                         />
//                                         <EarningsRow
//                                             earning="Allowances"
//                                             earningAmt={allowances > 0 ? fmt(allowances) : "—"}
//                                             deduction={null}
//                                             deductionAmt={null}
//                                         />
//                                         <tr className="bg-slate-50 border-t-2 border-slate-200">
//                                             <td className="px-5 py-3 text-sm font-semibold text-slate-700">Total Earnings</td>
//                                             <td className="px-5 py-3 text-right font-bold text-green-600">{fmt(grossEarnings)}</td>
//                                             <td className="px-5 py-3 text-sm font-semibold text-slate-700 bg-rose-50">Total Deductions</td>
//                                             <td className="px-5 py-3 text-right font-bold text-rose-600 bg-rose-50">{fmt(lopAmount)}</td>
//                                         </tr>
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>

//                         {/* ── Net Salary Banner ── */}
//                         <div className="rounded-xl bg-indigo-700 px-6 py-5 flex items-center justify-between">
//                             <div>
//                                 <p className="text-indigo-200 text-xs uppercase tracking-widest font-medium">Net Salary Payable</p>
//                                 <p className="text-white text-3xl font-bold mt-1">
//                                     ₹ {netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                                 </p>
//                                 <p className="text-indigo-300 text-xs mt-1">{periodLabel} · Paid via Bank Transfer</p>
//                             </div>
//                             <div className="text-right hidden sm:block">
//                                 <p className="text-indigo-300 text-xs">Gross Earnings</p>
//                                 <p className="text-white font-semibold">₹ {fmt(grossEarnings)}</p>
//                                 <p className="text-indigo-300 text-xs mt-2">Total Deductions</p>
//                                 <p className="text-rose-300 font-semibold">– ₹ {fmt(lopAmount)}</p>
//                             </div>
//                         </div>

//                         {/* ── LOP Note ── */}
//                         {lopDays > 0 && (
//                             <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-3 text-xs text-rose-600">
//                                 <span className="font-semibold">Loss of Pay Note:</span>{" "}
//                                 {lopDays} LOP day{lopDays > 1 ? "s" : ""} deducted
//                                 @ ₹{perDaySalary.toFixed(2)}/day (Basic ÷ {workingDays} working days)
//                                 <span className="block text-rose-400 mt-0.5">
//                                     Working days = calendar days − 6 (4 Sundays + 2 EL)
//                                     ({workingDays} days for {periodLabel})
//                                 </span>
//                             </div>
//                         )}

//                         {/* ── Footer ── */}
//                         <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
//                             <p>This is a system-generated payslip and does not require a physical signature.</p>
//                             <p className="font-mono">{COMPANY.email}</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <style>{`
//                 @media print {
//                     body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
//                     .print\\:hidden { display: none !important; }
//                 }
//             `}</style>
//         </div>
//     )
// }

// export default PrintPayslip


import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { format } from "date-fns"
import { PrinterIcon, BuildingIcon } from "lucide-react"
import Loading from "../components/Loading"
import api from "../api/axios"

const COMPANY = {
    name:    "LiveDigit.in",
    address: "Visakhapatnam & Hyderabad",
    email:   "hrsupport@livedigit.in",
}

const ATT_COLORS = {
    green:  { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200"  },
    rose:   { bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-200"   },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200"  },
    slate:  { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200"  },
}

const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN")

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

const AttBox = ({ label, value, sub, color = "slate" }) => {
    const c = ATT_COLORS[color] ?? ATT_COLORS.slate
    return (
        <div className={`rounded-xl border ${c.bg} ${c.border} px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold ${c.text}`}>{value ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
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

    if (loading)  return <Loading />
    if (!payslip) return <p className="text-center py-12 text-slate-400">Payslip not found</p>

    const emp         = payslip.employee || {}
    const periodLabel = format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")
    const employeeId  = emp.employeeId || `EMP-${payslip._id?.toString().slice(-5).toUpperCase()}`
    const joinDate    = emp.joinDate ? format(new Date(emp.joinDate), "dd MMM yyyy") : "—"

    // ── Trust API-computed values — reflect any admin edits ──
    const basicSalary   = payslip.basicSalary ?? 0
    const allowances    = payslip.allowances  ?? 0
    const lopDays       = payslip.lopDays     ?? 0
    const workingDays   = payslip.workingDays ?? 0
    const lopAmount     = payslip.lopAmount   ?? 0
    const grossEarnings = parseFloat((basicSalary + allowances).toFixed(2))
    const netSalary     = payslip.netSalary   ?? parseFloat((grossEarnings - lopAmount).toFixed(2))
    const perDaySalary  = workingDays > 0 ? parseFloat((basicSalary / workingDays).toFixed(2)) : 0

    // ── Attendance & leave counts from API (real-time) ──
    const casualLeaves = emp.casualLeaves ?? 0
    const sickLeaves   = emp.sickLeaves   ?? 0
    const earnedLeaves = emp.earnedLeaves ?? 0
    const lopLeaves    = emp.lopLeaves    ?? lopDays
    const absentDays   = emp.absentDays   ?? 0
    const weekOff      = emp.weekOff      ?? []
    const weekOffLabel = weekOff.length ? weekOff.join(", ") + " off" : "Sun off"
    const totalLeaves  = casualLeaves + sickLeaves + earnedLeaves

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
            <div className="max-w-3xl mx-auto">

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
                            <div className="w-12 h-12 rounded-xl bg-white border border-white/30 flex items-center justify-center shrink-0">
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
                        <div>
                            <SectionTitle>Attendance Summary</SectionTitle>
                            {/* 4-column grid: Scheduled · Present · Absent · Leaves */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                <AttBox
                                    label="Scheduled Days"
                                    value={workingDays}
                                    sub={`${weekOffLabel} · −2 EL`}
                                    color="slate"
                                />
                                <AttBox
                                    label="Present Days"
                                    value={workingDays - absentDays - totalLeaves - lopLeaves}
                                    sub="Clock-in recorded"
                                    color="green"
                                />
                                <AttBox
                                    label="Absent Days"
                                    value={absentDays}
                                    sub="No clock-in, no leave"
                                    color={absentDays > 0 ? "amber" : "slate"}
                                />
                                <AttBox
                                    label="Leaves Taken"
                                    value={totalLeaves + lopLeaves}
                                    sub={`CL:${casualLeaves} · SL:${sickLeaves} · EL:${earnedLeaves} · LOP:${lopLeaves}`}
                                    color={totalLeaves + lopLeaves > 0 ? "rose" : "slate"}
                                />
                            </div>
                        </div>

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
                                            earning="Basic Salary"
                                            earningAmt={fmt(basicSalary)}
                                            deduction={lopDays > 0
                                                ? <span>Loss of Pay <span className="text-xs text-slate-400">({lopDays}d)</span></span>
                                                : null
                                            }
                                            deductionAmt={lopDays > 0 ? fmt(lopAmount) : null}
                                        />
                                        <EarningsRow
                                            earning="Allowances"
                                            earningAmt={allowances > 0 ? fmt(allowances) : "—"}
                                            deduction={null}
                                            deductionAmt={null}
                                        />
                                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700">Total Earnings</td>
                                            <td className="px-5 py-3 text-right font-bold text-green-600">{fmt(grossEarnings)}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700 bg-rose-50">Total Deductions</td>
                                            <td className="px-5 py-3 text-right font-bold text-rose-600 bg-rose-50">{fmt(lopAmount)}</td>
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
                                <p className="text-white font-semibold">₹ {fmt(grossEarnings)}</p>
                                <p className="text-indigo-300 text-xs mt-2">Total Deductions</p>
                                <p className="text-rose-300 font-semibold">– ₹ {fmt(lopAmount)}</p>
                            </div>
                        </div>

                        {/* ── LOP Note ── */}
                        {lopDays > 0 && (
                            <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-3 text-xs text-rose-600">
                                <span className="font-semibold">Loss of Pay Note:</span>{" "}
                                {lopDays} LOP day{lopDays > 1 ? "s" : ""} deducted
                                @ ₹{perDaySalary.toFixed(2)}/day (Basic ÷ {workingDays} working days)
                                <span className="block text-rose-400 mt-0.5">
                                    {`Working days = calendar days − ${weekOffLabel} − 2 EL`}
                                    ({workingDays} days for {periodLabel})
                                </span>
                            </div>
                        )}

                        {/* ── Absent Note ── */}
                        {absentDays > 0 && (
                            <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-3 text-xs text-amber-700">
                                <span className="font-semibold">Absent Note:</span>{" "}
                                {absentDays} day{absentDays > 1 ? "s" : ""} with no clock-in and no approved leave recorded for {periodLabel}.
                                <span className="block text-amber-500 mt-0.5">
                                    Absent = Scheduled days − Clock-in days − Approved leave days
                                </span>
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