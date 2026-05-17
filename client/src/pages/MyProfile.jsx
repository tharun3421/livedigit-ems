import { useEffect, useState } from "react"
import {
    UserIcon, MailIcon, PhoneIcon, BriefcaseIcon, BuildingIcon,
    CalendarIcon, ClockIcon, CoffeeIcon, UtensilsIcon, CalendarOffIcon,
    MapPinIcon, BadgeIndianRupeeIcon, Loader2Icon, ThermometerIcon,
    UmbrellaIcon, PalmtreeIcon, StarIcon, HashIcon, DropletIcon
} from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"
import Loading from "../components/Loading"

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt12 = (time24) => {
    if (!time24) return "—"
    const [h, m] = time24.split(":").map(Number)
    const ampm   = h >= 12 ? "PM" : "AM"
    const hour   = h % 12 || 12
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

// ─── sub-components ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
    <div className="card p-5 sm:p-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 pb-3 border-b border-slate-800">
            {title}
        </h3>
        {children}
    </div>
)

const Row = ({ icon: Icon, label, value, highlight }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
        <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-500/10 shrink-0">
            <Icon className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className={`text-sm font-medium truncate ${highlight ? "text-indigo-400" : "text-slate-200"}`}>
                {value || "—"}
            </p>
        </div>
    </div>
)

const StatCard = ({ label, value, sub, icon: Icon, color }) => {
    const colors = {
        green:  "bg-green-500/10  text-green-400",
        blue:   "bg-blue-500/10   text-blue-400",
        purple: "bg-purple-500/10 text-purple-400",
        rose:   "bg-rose-500/10   text-rose-400",
        yellow: "bg-yellow-500/10 text-yellow-400",
        indigo: "bg-indigo-500/10 text-indigo-400",
    }
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className={`p-2 rounded-lg shrink-0 ${colors[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-xl font-bold text-slate-100">{value ?? 0}</p>
                <p className="text-xs text-slate-500 truncate">{label}</p>
                {sub && <p className="text-xs text-slate-600">{sub}</p>}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyProfile = () => {
    const [profile,  setProfile]  = useState(null)
    const [empDetail, setEmpDetail] = useState(null)  // attendance + leave summaries
    const [loading,  setLoading]  = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Step 1: get basic profile (logged-in employee)
                const res = await api.get("/profile")
                setProfile(res.data)

                // Step 2: get full detail (attendance + leave summary)
                // profile returns _id or id
                const empId = res.data._id || res.data.id
                if (empId) {
                    try {
                        const detailRes = await api.get(`/employees/${empId}`)
                        setEmpDetail(detailRes.data)
                    } catch {
                        // non-critical — attendance/leave summaries just won't show
                    }
                }
            } catch (err) {
                toast.error(err?.response?.data?.error || err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    if (loading) return <Loading />
    if (!profile) return (
        <div className="flex items-center justify-center h-64 text-slate-400">
            Could not load profile.
        </div>
    )

    const ws  = profile.workSchedule     || {}
    const loc = profile.assignedLocation  || {}
    const bd  = profile.bankDetails       || {}
    const att = empDetail?.attendanceSummary || {}
    const lv  = empDetail?.leaveSummary     || {}

    const netSalary =
        (profile.basicSalary || 0) +
        (profile.allowances  || 0) -
        (profile.deductions  || 0)

    return (
        <div className="animate-fade-in max-w-3xl mx-auto space-y-5 pb-10">

            {/* ── Hero card ── */}
            <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="text-3xl font-bold text-indigo-400">
                        {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                </div>

                <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <h1 className="text-2xl font-bold text-slate-100">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        {/* Employee ID */}
                        {profile.employeeId && (
                            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                {profile.employeeId}
                            </span>
                        )}
                    </div>

                    <p className="text-slate-400 text-sm mt-1">{profile.position} · {profile.department}</p>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            profile.employmentStatus === "ACTIVE"
                                ? "bg-green-500/15 text-green-400"
                                : "bg-rose-500/15 text-rose-400"
                        }`}>
                            {profile.employmentStatus}
                        </span>
                        {profile.user?.role && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-500/15 text-indigo-400">
                                {profile.user.role}
                            </span>
                        )}
                        {/* Blood group */}
                        {profile.bloodGroup && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-rose-500/15 text-rose-400 flex items-center gap-1">
                                <DropletIcon className="w-3 h-3" /> {profile.bloodGroup}
                            </span>
                        )}
                    </div>

                    {profile.bio && (
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed">{profile.bio}</p>
                    )}
                </div>
            </div>

            {/* ── Personal Info ── */}
            <Section title="Personal Information">
                {profile.employeeId && (
                    <Row icon={HashIcon}      label="Employee ID"  value={profile.employeeId} />
                )}
                <Row icon={MailIcon}          label="Email"        value={profile.email} />
                <Row icon={PhoneIcon}         label="Phone"        value={profile.phone} />
                <Row icon={BriefcaseIcon}     label="Position"     value={profile.position} />
                <Row icon={BuildingIcon}      label="Department"   value={profile.department} />
                <Row icon={CalendarIcon}      label="Join Date"
                    value={profile.joinDate
                        ? new Date(profile.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : null}
                />
                {profile.bloodGroup && (
                    <Row icon={DropletIcon}   label="Blood Group"  value={profile.bloodGroup} />
                )}
            </Section>

            {/* ── Work Schedule ── */}
            {(ws.shiftStart || ws.weekOff?.length > 0) && (
                <Section title="Work Schedule">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {ws.shiftStart && ws.shiftEnd && (
                            <Row icon={ClockIcon}       label="Shift Timings"
                                value={`${fmt12(ws.shiftStart)} – ${fmt12(ws.shiftEnd)}`} />
                        )}
                        {ws.breakStart && ws.breakEnd && (
                            <Row icon={CoffeeIcon}      label="Break Timings"
                                value={`${fmt12(ws.breakStart)} – ${fmt12(ws.breakEnd)}`} />
                        )}
                        {ws.lunchStart && ws.lunchEnd && (
                            <Row icon={UtensilsIcon}    label="Lunch Timings"
                                value={`${fmt12(ws.lunchStart)} – ${fmt12(ws.lunchEnd)}`} />
                        )}
                        {ws.weekOff?.length > 0 && (
                            <Row icon={CalendarOffIcon} label="Week Off"
                                value={ws.weekOff.join(", ")} />
                        )}
                    </div>
                </Section>
            )}

            {/* ── Assigned Location ── */}
            {loc.latitude && (
                <Section title="Assigned Work Location">
                    <Row icon={MapPinIcon} label="Office Location"
                        value={loc.label || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`} />
                    <Row icon={MapPinIcon} label="Allowed Radius" value={`${loc.radiusMeters}m`} />
                </Section>
            )}

            {/* ── Attendance Summary ── */}
            <Section title="Attendance Summary (All Time)">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="Present" value={att.PRESENT} icon={CalendarIcon}    color="green"  />
                    <StatCard label="Late"    value={att.LATE}    icon={ClockIcon}       color="yellow" />
                    <StatCard label="Absent"  value={att.ABSENT}  icon={CalendarOffIcon} color="rose"   />
                </div>
            </Section>

            {/* ── Leave Summary ── */}
            <Section title="Approved Leaves (All Time)">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Sick Leave"   value={lv.SICK}        icon={ThermometerIcon} color="blue"   />
                    <StatCard label="Casual Leave" value={lv.CASUAL}      icon={UmbrellaIcon}    color="purple" />
                    <StatCard label="Earned Leave" value={lv.EARNED}      icon={StarIcon}        color="green"  />
                    <StatCard label="Loss of Pay"  value={lv.LOSS_OF_PAY} icon={PalmtreeIcon}    color="rose"   />
                </div>
            </Section>

            {/* ── Salary ── */}
            <Section title="Salary Details">
                <Row icon={BadgeIndianRupeeIcon} label="Basic Salary"
                    value={`₹${(profile.basicSalary ?? 0).toLocaleString("en-IN")}`} />
                <Row icon={BadgeIndianRupeeIcon} label="Allowances"
                    value={`₹${(profile.allowances ?? 0).toLocaleString("en-IN")}`} />
                <Row icon={BadgeIndianRupeeIcon} label="Deductions"
                    value={`₹${(profile.deductions ?? 0).toLocaleString("en-IN")}`} />
                <Row icon={BadgeIndianRupeeIcon} label="Net Salary"
                    value={`₹${netSalary.toLocaleString("en-IN")}`} highlight />
            </Section>

            {/* ── Bank Details ── */}
            {bd.accountNumber && (
                <Section title="Bank Details">
                    <Row icon={UserIcon}             label="Account Holder" value={bd.accountHolderName} />
                    <Row icon={BuildingIcon}          label="Bank Name"      value={bd.bankName} />
                    <Row icon={BadgeIndianRupeeIcon}  label="Account Number" value={bd.accountNumber} />
                    <Row icon={BadgeIndianRupeeIcon}  label="IFSC Code"      value={bd.ifscCode} />
                    <Row icon={BadgeIndianRupeeIcon}  label="Account Type"   value={bd.accountType} />
                </Section>
            )}
        </div>
    )
}

export default MyProfile