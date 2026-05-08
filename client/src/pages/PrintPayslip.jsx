
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Loading from "../components/Loading";
import { format } from "date-fns";
import api from "../api/axios";

const PrintPayslip = () => {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payslips/${id}`)
      .then((res) => setPayslip(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);  // ← also fixed: was missing [] dependency array wrapping

  if (loading) return <Loading />;
  if (!payslip) return <p className="text-center py-12 text-slate-400">Payslip not found</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white animate-fade-in">

      {/* ── Header with logo ── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-12 w-auto object-contain"
            onError={(e) => { e.target.style.display = "none"; }}
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

      {/* ── Employee details ── */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Employee Name</p>
          <p className="font-semibold text-slate-900">
            {payslip.employee?.firstName} {payslip.employee?.lastName}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Position</p>
          <p className="font-semibold text-slate-900">{payslip.employee?.position}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email</p>
          <p className="font-semibold text-slate-900">{payslip.employee?.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Department</p>
          <p className="font-semibold text-slate-900">{payslip.employee?.department}</p>
        </div>

        {/* ── Joining date ── */}
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date of Joining</p>
          <p className="font-semibold text-slate-900">
            {payslip.employee?.joinDate
              ? format(new Date(payslip.employee.joinDate), "dd MMM yyyy")
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pay Period</p>
          <p className="font-semibold text-slate-900">
            {format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")}
          </p>
        </div>
      </div>

      {/* ── Salary breakdown ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Description</th>
              <th className="text-right py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-3 px-4 text-slate-700">Basic Salary</td>
              <td className="text-right py-3 px-4 text-slate-900 font-medium">
                ₹ {payslip.basicSalary?.toLocaleString()}
              </td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-3 px-4 text-slate-700">Allowances</td>
              <td className="text-right py-3 px-4 text-slate-900 font-medium">
                + ₹ {payslip.allowances?.toLocaleString()}
              </td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-3 px-4 text-slate-700">Deductions</td>
              <td className="text-right py-3 px-4 text-slate-900 font-medium">
                - ₹ {payslip.deductions?.toLocaleString()}
              </td>
            </tr>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="py-3 px-4 text-slate-900 font-bold">Net Salary</td>
              <td className="text-right py-3 px-4 font-bold text-slate-900 text-lg">
                ₹ {payslip.netSalary?.toLocaleString()}
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
  );
};

export default PrintPayslip;