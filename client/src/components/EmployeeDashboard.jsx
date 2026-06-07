import { useState } from "react"
import { ArrowRightIcon, CalendarIcon, FileTextIcon, IndianRupeeIcon, ClockIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import AttendanceCalendarModal from "./attendance/Attendancecalendarmodal"


const StatCard = ({ icon: Icon, value, title, subtitle, hint, onClick }) => (
  <div
    onClick={onClick}
    className={`card card-hover p-4 sm:p-5 relative overflow-hidden group flex items-center justify-between ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
    <div className="min-w-0 flex-1 pr-3">
      <p className="text-xs sm:text-sm text-slate-400 leading-tight">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5 truncate">{value ?? "—"}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>
      {hint && (
        <p className="text-[10px] text-indigo-400 mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
          {hint}
        </p>
      )}
    </div>
    <Icon className="size-8 sm:size-10 p-1.5 sm:p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0" />
  </div>
)

const EmployeeDashboard = ({ data }) => {
  const emp      = data.employee
  const navigate = useNavigate()
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="page-header flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-slate-100 text-2xl sm:text-3xl font-bold truncate">
            Welcome, {emp?.firstName}!
          </h1>
          <p className="page-subtitle text-xs sm:text-sm mt-0.5 truncate">
            {emp?.position} — {emp?.department || "No Department"}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
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
          title="Pending Leaves"
          subtitle="Awaiting approval"
          hint="Click to view leaves →"
          onClick={() => navigate("/leave")}
        />
        <StatCard
          icon={IndianRupeeIcon}
          value={data.latestPayslip ? `₹${data.latestPayslip.netSalary?.toLocaleString("en-IN")}` : "N/A"}
          title="Latest Payslip"
          subtitle="Most recent payout"
          hint={data.latestPayslip ? "Click to view payslips →" : undefined}
          onClick={data.latestPayslip ? () => navigate("/payslips") : undefined}
        />
      </div>

      {/* Late Attendance Policy Banner */}
      <div className="mb-4 flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <ClockIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-300">Late Attendance Policy</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Every{" "}
            <strong className="text-amber-300">3 late check-ins</strong>{" "}
            in a month results in{" "}
            <strong className="text-amber-300">1 day salary deduction</strong>.
            Please ensure timely check-in to avoid deductions.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/attendance"
          className="btn-primary text-center inline-flex items-center justify-center gap-2 text-sm"
        >
          Mark Attendance <ArrowRightIcon className="w-4 h-4" />
        </Link>
        <Link to="/leave" className="btn-secondary text-center text-sm">
          Apply for Leave
        </Link>
      </div>

      {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
    </div>
  )
}

export default EmployeeDashboard