import { useState } from "react"
import { ArrowRightIcon, CalendarIcon, FileTextIcon, IndianRupeeIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import AttendanceCalendarModal from "./attendance/Attendancecalendarmodal"
import NotificationBell from "./NotificationBell"

const StatCard = ({ icon: Icon, value, title, subtitle, hint, onClick }) => (
  <div
    onClick={onClick}
    className={`card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      {hint && (
        <p className="text-[10px] text-indigo-400 mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {hint}
        </p>
      )}
    </div>
    <Icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0" />
  </div>
)

const EmployeeDashboard = ({ data }) => {
  const emp      = data.employee
  const navigate = useNavigate()
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-100 text-3xl">Welcome, {emp?.firstName}!</h1>
          <p className="page-subtitle">
            {emp?.position} — {emp?.department || "No Department"}
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <StatCard
          icon={CalendarIcon}
          value={data.currentMonthAttendance}
          title="Days Present"
          subtitle="This month"
          hint="Click to view calendar →"
          onClick={() => setShowCalendar(true)}
        />
        <StatCard
          icon={FileTextIcon}
          value={data.pendingLeaves}
          title="Pending Leave Requests"
          subtitle="Awaiting approval"
          hint="Click to view leaves →"
          onClick={() => navigate("/leave")}
        />
        <StatCard
          icon={IndianRupeeIcon}
          value={data.latestPayslip ? `₹ ${data.latestPayslip.netSalary?.toLocaleString()}` : "N/A"}
          title="Latest Payslip"
          subtitle="Most recent payout"
          hint={data.latestPayslip ? "Click to view payslips →" : undefined}
          onClick={data.latestPayslip ? () => navigate("/payslips") : undefined}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/attendance" className="btn-primary text-center inline-flex items-center justify-center gap-2">
          Mark Attendance <ArrowRightIcon className="w-4 h-4" />
        </Link>
        <Link to="/leave" className="btn-secondary text-center">
          Apply for Leave
        </Link>
      </div>

      {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
    </div>
  )
}

export default EmployeeDashboard