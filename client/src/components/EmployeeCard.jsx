import { PencilIcon, Trash2Icon, X, Loader2Icon, EyeIcon, ClockIcon, CoffeeIcon, UtensilsIcon, CalendarOffIcon, MapPinIcon } from "lucide-react"
import { useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"

const fmt12 = (time24) => {
    if (!time24) return "—"
    const [h, m] = time24.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

const EmployeeCard = ({ employee, onDelete, onEdit, isAdmin = false }) => {
    const [showDetail,    setShowDetail]    = useState(false)
    const [detail,        setDetail]        = useState(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [detailError,   setDetailError]   = useState(null)

    // Support both id and _id
    const empId = employee.id || employee._id

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this employee?")) return
        try {
            await api.delete(`/employees/${empId}`)
            onDelete()
        } catch (err) {
            toast.error(err.response?.data?.error || err.message)
        }
    }

    const handleViewDetail = async (e) => {
        e.stopPropagation()
        setDetailError(null)
        setDetail(null)
        setShowDetail(true)
        setLoadingDetail(true)
        try {
            const res = await api.get(`/employees/${empId}`)
            setDetail(res.data)
        } catch (err) {
            setDetailError(err.response?.data?.error || "Failed to load employee details")
        } finally {
            setLoadingDetail(false)
        }
    }

    return (
        <>
            <div className="group relative card card-hover overflow-hidden">
                <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 to-slate-50">
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
                            <span className="text-2xl font-medium text-indigo-400">
                                {employee.firstName?.[0]}{employee.lastName?.[0]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm">
                        {employee.department || "Remote"}
                    </span>
                </div>

                {/* Desktop hover actions */}
                <div className="absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent transition-opacity items-end justify-center pb-6 gap-3 hidden sm:flex opacity-0 group-hover:opacity-100">
                    <button onClick={handleViewDetail} className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105" title="View Details">
                        <EyeIcon className="w-4 h-4" />
                    </button>
                    {!employee.isDeleted && isAdmin && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(employee) }} className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105" title="Edit Employee">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105" title="Delete Employee">
                                <Trash2Icon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile actions */}
                <div className="absolute top-3 right-3 flex gap-2 sm:hidden">
                    <button onClick={handleViewDetail} className="p-2 bg-white/90 text-indigo-600 rounded-xl shadow-lg" title="View Details">
                        <EyeIcon className="w-4 h-4" />
                    </button>
                    {!employee.isDeleted && isAdmin && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(employee) }} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="p-2 bg-rose-500 text-white rounded-xl shadow-lg">
                                <Trash2Icon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-slate-100 truncate">{employee.firstName} {employee.lastName}</h3>
                        {employee.employeeId && (
                            <span className="text-xs text-slate-500 font-mono shrink-0">{employee.employeeId}</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{employee.position}</p>
                </div>
            </div>

            {/* ── Detail Modal ── */}
            {showDetail && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-0">
                            <h2 className="text-lg font-semibold text-slate-900">Employee Details</h2>
                            <button onClick={() => setShowDetail(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Loading */}
                        {loadingDetail && (
                            <div className="flex items-center justify-center py-16">
                                <Loader2Icon className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        )}

                        {/* Error */}
                        {!loadingDetail && detailError && (
                            <div className="p-6">
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                                    <p className="text-sm text-rose-600">{detailError}</p>
                                    <button onClick={handleViewDetail} className="mt-3 text-xs text-rose-500 underline">
                                        Try again
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        {!loadingDetail && !detailError && detail && (
                            <div className="p-6 space-y-6">

                                {/* Avatar + Basic Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-xl font-semibold text-indigo-500">
                                            {detail.firstName?.[0]}{detail.lastName?.[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-semibold text-slate-900">{detail.firstName} {detail.lastName}</h3>
                                            {detail.employeeId && (
                                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {detail.employeeId}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{detail.position} · {detail.department}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                detail.employmentStatus === "ACTIVE"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-600"
                                            }`}>
                                                {detail.employmentStatus}
                                            </span>
                                            {detail.bloodGroup && (
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-600">
                                                    🩸 {detail.bloodGroup}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <Section title="Personal Information">
                                    <Detail label="Email"     value={detail.email} />
                                    <Detail label="Phone"     value={detail.phone} />
                                    <Detail label="Join Date" value={new Date(detail.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                                    <Detail label="Role"      value={detail.user?.role} />
                                    {detail.bio && <div className="col-span-2"><Detail label="Bio" value={detail.bio} /></div>}
                                </Section>

                                {/* Work Schedule */}
                                {detail.workSchedule?.shiftStart && (
                                    <Section title="Work Schedule">
                                        <Detail label={<Row icon={ClockIcon} text="Shift" />}       value={`${fmt12(detail.workSchedule.shiftStart)} – ${fmt12(detail.workSchedule.shiftEnd)}`} />
                                        {detail.workSchedule.breakStart && <Detail label={<Row icon={CoffeeIcon} text="Break" />}    value={`${fmt12(detail.workSchedule.breakStart)} – ${fmt12(detail.workSchedule.breakEnd)}`} />}
                                        {detail.workSchedule.lunchStart && <Detail label={<Row icon={UtensilsIcon} text="Lunch" />}  value={`${fmt12(detail.workSchedule.lunchStart)} – ${fmt12(detail.workSchedule.lunchEnd)}`} />}
                                        {detail.workSchedule.weekOff?.length > 0 && (
                                            <div className="col-span-2">
                                                <Detail label={<Row icon={CalendarOffIcon} text="Week Off" />} value={detail.workSchedule.weekOff.join(", ")} />
                                            </div>
                                        )}
                                    </Section>
                                )}

                                {/* Assigned Location */}
                                {detail.assignedLocation?.latitude && (
                                    <Section title="Assigned Location">
                                        <div className="col-span-2">
                                            <Detail label={<Row icon={MapPinIcon} text="Office" />} value={`${detail.assignedLocation.label || "Custom"} (±${detail.assignedLocation.radiusMeters}m)`} />
                                        </div>
                                    </Section>
                                )}

                                {/* Salary */}
                                <Section title="Salary Details">
                                    <Detail label="Basic Salary" value={`₹${detail.basicSalary?.toLocaleString("en-IN")}`} />
                                    <Detail label="Allowances"   value={`₹${detail.allowances?.toLocaleString("en-IN")}`} />
                                    <Detail label="Deductions"   value={`₹${detail.deductions?.toLocaleString("en-IN")}`} />
                                    <Detail label="Net Salary"   value={`₹${((detail.basicSalary || 0) + (detail.allowances || 0) - (detail.deductions || 0)).toLocaleString("en-IN")}`} highlight />
                                </Section>

                                {/* Attendance */}
                                <Section title="Attendance Summary">
                                    <StatBox label="Present" value={detail.attendanceSummary?.PRESENT} color="green"  />
                                    <StatBox label="Late"    value={detail.attendanceSummary?.LATE}    color="yellow" />
                                    <StatBox label="Absent"  value={detail.attendanceSummary?.ABSENT}  color="red"    />
                                </Section>

                                {/* Leaves */}
                                <Section title="Leave Summary">
                                    <StatBox label="Sick"        value={detail.leaveSummary?.SICK}        color="blue"   />
                                    <StatBox label="Casual"      value={detail.leaveSummary?.CASUAL}      color="purple" />
                                    <StatBox label="Earned"      value={detail.leaveSummary?.EARNED}      color="green"  />
                                    <StatBox label="Loss of Pay" value={detail.leaveSummary?.LOSS_OF_PAY} color="red"    />
                                </Section>

                                {/* Bank Details */}
                                {detail.bankDetails?.accountNumber && (
                                    <Section title="Bank Details">
                                        <Detail label="Account Holder" value={detail.bankDetails.accountHolderName} />
                                        <Detail label="Bank Name"      value={detail.bankDetails.bankName} />
                                        <Detail label="Account Number" value={detail.bankDetails.accountNumber} />
                                        <Detail label="IFSC Code"      value={detail.bankDetails.ifscCode} />
                                        <Detail label="Account Type"   value={detail.bankDetails.accountType} />
                                    </Section>
                                )}

                                {/* Admin actions */}
                                {isAdmin && !employee.isDeleted && (
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => { setShowDetail(false); onEdit(employee) }} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                                            <PencilIcon className="w-4 h-4" /> Edit Employee
                                        </button>
                                        <button onClick={() => { setShowDetail(false); handleDelete() }} className="btn-secondary flex items-center gap-2 flex-1 justify-center text-rose-500 hover:text-rose-600">
                                            <Trash2Icon className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Row = ({ icon: Icon, text }) => (
    <span className="flex items-center gap-1"><Icon className="w-3 h-3" />{text}</span>
)

const Section = ({ title, children }) => (
    <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
        <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
)

const Detail = ({ label, value, highlight }) => (
    <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${highlight ? "text-indigo-600" : "text-slate-800"}`}>{value || "—"}</p>
    </div>
)

const colorMap = {
    green:  "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red:    "bg-red-50 text-red-700",
    blue:   "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
}

const StatBox = ({ label, value, color }) => (
    <div className={`rounded-xl p-3 ${colorMap[color]}`}>
        <p className="text-2xl font-bold">{value ?? 0}</p>
        <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
)

export default EmployeeCard