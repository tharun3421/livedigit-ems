import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Loading from "../components/Loading"
import { format } from "date-fns"
import api from "../api/axios"

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

    const lopAmount   = payslip.lopAmount   ?? 0
    const lopDays     = payslip.lopDays     ?? 0
    const otherDeduct = Math.max(0, (payslip.deductions ?? 0) - lopAmount)

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white animate-fade-in">

            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png" alt="Company Logo"
                        className="h-12 w-auto object-contain"
                        onError={(e) => { e.target.style.display = "none" }}
                    />
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Payslip for</p>
                        <p className="text-slate-600 text-sm font-medium">
                            {format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PAYSLIP</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        #{payslip._id?.toString().slice(-8).toUpperCase()}
                    </p>
                </div>
            </div>

            {/* ── Employee Details ── */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <InfoCell label="Employee Name"  value={`${payslip.employee?.firstName} ${payslip.employee?.lastName}`} />
                <InfoCell label="Position"       value={payslip.employee?.position} />
                <InfoCell label="Email"          value={payslip.employee?.email} />
                <InfoCell label="Department"     value={payslip.employee?.department} />
                <InfoCell label="Date of Joining"
                    value={payslip.employee?.joinDate
                        ? format(new Date(payslip.employee.joinDate), "dd MMM yyyy")
                        : "—"}
                />
                <InfoCell label="Pay Period"
                    value={format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")}
                />
            </div>

            {/* ── Attendance / Working Days ── */}
            {(payslip.totalWorkDays || payslip.daysWorked !== undefined) && (
                <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Attendance Summary
                        </p>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                        <AttCell label="Total Work Days" value={payslip.totalWorkDays ?? "—"} />
                        <AttCell label="LOP Days"        value={lopDays} color={lopDays > 0 ? "rose" : null} />
                        <AttCell label="Days Worked"     value={payslip.daysWorked ?? "—"} color="green" />
                    </div>
                </div>
            )}

            {/* ── Salary Breakdown ── */}
            <div className="rounded-xl border border-slate-200 overflow-hidden mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="text-left py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="text-right py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Earnings */}
                        <tr className="border-t border-slate-100">
                            <td className="py-3 px-4 text-slate-700">Basic Salary</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-medium">
                                ₹ {payslip.basicSalary?.toLocaleString("en-IN")}
                            </td>
                        </tr>
                        <tr className="border-t border-slate-100">
                            <td className="py-3 px-4 text-slate-700">Allowances</td>
                            <td className="text-right py-3 px-4 text-green-600 font-medium">
                                + ₹ {payslip.allowances?.toLocaleString("en-IN")}
                            </td>
                        </tr>

                        {/* Deductions */}
                        {otherDeduct > 0 && (
                            <tr className="border-t border-slate-100">
                                <td className="py-3 px-4 text-slate-700">Other Deductions</td>
                                <td className="text-right py-3 px-4 text-rose-500 font-medium">
                                    – ₹ {otherDeduct.toLocaleString("en-IN")}
                                </td>
                            </tr>
                        )}
                        {lopDays > 0 && (
                            <tr className="border-t border-slate-100">
                                <td className="py-3 px-4 text-slate-700">
                                    Loss of Pay
                                    <span className="ml-2 text-xs text-slate-400">
                                        ({lopDays} day{lopDays > 1 ? "s" : ""} × ₹{
                                            payslip.basicSalary
                                                ? (payslip.basicSalary / 26).toFixed(2)
                                                : "—"
                                        }/day)
                                    </span>
                                </td>
                                <td className="text-right py-3 px-4 text-rose-500 font-medium">
                                    – ₹ {lopAmount.toLocaleString("en-IN")}
                                </td>
                            </tr>
                        )}
                        {payslip.deductions > 0 && (
                            <tr className="border-t border-slate-100 bg-rose-50/40">
                                <td className="py-2.5 px-4 text-slate-600 font-medium text-xs uppercase tracking-wide">
                                    Total Deductions
                                </td>
                                <td className="text-right py-2.5 px-4 text-rose-600 font-semibold">
                                    – ₹ {payslip.deductions?.toLocaleString("en-IN")}
                                </td>
                            </tr>
                        )}

                        {/* Net */}
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="py-4 px-4 text-slate-900 font-bold">Net Salary</td>
                            <td className="text-right py-4 px-4 font-bold text-slate-900 text-lg">
                                ₹ {payslip.netSalary?.toLocaleString("en-IN")}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ── Footer ── */}
            <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-6 mb-6">
                This is a system-generated payslip and does not require a signature.
            </div>
            <div className="text-center">
                <button className="btn-primary print:hidden" onClick={() => window.print()}>
                    Print Payslip
                </button>
            </div>
        </div>
    )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const InfoCell = ({ label, value }) => (
    <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="font-semibold text-slate-900">{value || "—"}</p>
    </div>
)

const AttCell = ({ label, value, color }) => (
    <div className="py-4 px-4 text-center">
        <p className={`text-2xl font-bold ${
            color === "rose"  ? "text-rose-500"  :
            color === "green" ? "text-green-600" : "text-slate-800"
        }`}>{value}</p>
        <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
)

export default PrintPayslip