import { format } from 'date-fns'
import { Download } from 'lucide-react'

const PayslipList = ({ payslips, isAdmin }) => {
    return (
        <div className='card overflow-hidden'>
            <div className='overflow-x-auto'>
                <table className='table-modern'>
                    <thead>
                        <tr>
                            {isAdmin && <th>Employee</th>}
                            <th>Period</th>
                            <th>Basic Salary</th>
                            <th>Allowances</th>
                            <th>Deductions</th>
                            <th>Working Days</th>
                            <th>Days Worked</th>
                            <th>Net Salary</th>
                            <th className='text-center'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payslips.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 9 : 8} className='text-center py-12 text-slate-400'>
                                    No payslips found
                                </td>
                            </tr>
                        ) : (
                            payslips.map((payslip) => (
                                <tr key={payslip._id || payslip.id}>
                                    {isAdmin && (
                                        <td className='text-slate-300 font-medium'>
                                            {payslip.employee?.firstName} {payslip.employee?.lastName}
                                        </td>
                                    )}
                                    <td className='text-slate-400'>
                                        {format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")}
                                    </td>
                                    <td className='text-slate-400'>
                                        ₹ {payslip.basicSalary?.toLocaleString("en-IN")}
                                    </td>
                                    <td className='text-green-500 font-medium'>
                                        + ₹ {payslip.allowances?.toLocaleString("en-IN")}
                                    </td>
                                    <td className='text-rose-400 font-medium'>
                                        – ₹ {payslip.deductions?.toLocaleString("en-IN")}
                                        {payslip.lopDays > 0 && (
                                            <span className='ml-1.5 text-xs bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full'>
                                                {payslip.lopDays}d LOP
                                            </span>
                                        )}
                                    </td>
                                    <td className='text-slate-400 text-center'>
                                        {payslip.totalWorkDays ?? '—'}
                                    </td>
                                    <td className='text-slate-400 text-center'>
                                        {payslip.daysWorked ?? '—'}
                                    </td>
                                    <td className='text-slate-100 font-semibold'>
                                        ₹ {payslip.netSalary?.toLocaleString("en-IN")}
                                    </td>
                                    <td className='text-center'>
                                        <button
                                            onClick={() => window.open(`/print/payslips/${payslip._id || payslip.id}`)}
                                            className='inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors ring-1 ring-blue-600/10'
                                        >
                                            <Download className='w-3 h-3 mr-1.5' /> Download
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PayslipList