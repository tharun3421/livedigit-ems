import { useEffect, useState } from "react"
import {
    UserIcon, MailIcon, PhoneIcon, BriefcaseIcon, BuildingIcon,
    CalendarIcon, ClockIcon, CoffeeIcon, UtensilsIcon, CalendarOffIcon,
    MapPinIcon, BadgeIndianRupeeIcon, ThermometerIcon,
    UmbrellaIcon, PalmtreeIcon, StarIcon, HashIcon, DropletIcon,
} from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"
import Loading from "../components/Loading"

const fmt12 = (time24) => {
    if (!time24) return "—"
    const [h, m] = time24.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

const DAY_INDEX_MAP = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
}

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

const StatCard = ({ label, value, icon: Icon, color }) => {
    const colors = {
        green:  "bg-green-500/10  text-green-400",
        blue:   "bg-blue-500/10   text-blue-400",
        purple: "bg-purple-500/10 text-purple-400",
        rose:   "bg-rose-500/10   text-rose-400",
        yellow: "bg-yellow-500/10 text-yellow-400",
        teal:   "bg-teal-500/10   text-teal-400",
    }
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className={`p-2 rounded-lg shrink-0 ${colors[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-xl font-bold text-slate-100">{value ?? 0}</p>
                <p className="text-xs text-slate-500 truncate">{label}</p>
            </div>
        </div>
    )
}

const inr = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

// ─── Calculate absent days for current month ──────────────────────────────────
const calcAbsentDays = (attendanceRecords, profile) => {
    const now        = new Date()
    const istNow     = new Date(now.getTime() + IST_OFFSET_MS)
    const todayStr   = istNow.toISOString().slice(0, 10)
    const year       = istNow.getUTCFullYear()
    const month      = istNow.getUTCMonth() // 0-indexed
    const weekOff    = profile?.workSchedule?.weekOff ?? []
    const offIndices = weekOff.length
        ? new Set(weekOff.map(d => DAY_INDEX_MAP[d?.toLowerCase()]).filter(n => n !== undefined))
        : new Set([0]) // default Sunday off

    // Dates with any clock-in this month
    const clockedThisMonth = new Set(
        attendanceRecords.map(r => {
            const d = new Date(new Date(r.date).getTime() + IST_OFFSET_MS)
            return d.toISOString().slice(0, 10)
        })
    )

    // Count working days this month up to today
    let workingDayCount = 0
    const monthStart = new Date(Date.UTC(year, month, 1))
    for (let d = new Date(monthStart); d.toISOString().slice(0, 10) <= todayStr; d.setUTCDate(d.getUTCDate() + 1)) {
        const istD = new Date(d.getTime() + IST_OFFSET_MS)
        if (!offIndices.has(istD.getUTCDay())) workingDayCount++
    }

    return Math.max(0, workingDayCount - clockedThisMonth.size)
}

// ─── Monthly leave counts ─────────────────────────────────────────────────────
const calcMonthlyLeaves = (leaves) => {
    const now      = new Date()
    const mthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const mthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const approved = (leaves || []).filter(l => l.status === "APPROVED")

    const countDays = (start, end) =>
        Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

    const sumThisMonth = (type) =>
        approved
            .filter(l => l.type === type)
            .reduce((sum, l) => {
                const start = new Date(Math.max(new Date(l.startDate), mthStart))
                const end   = new Date(Math.min(new Date(l.endDate),   mthEnd))
                if (end < start) return sum
                return sum + countDays(start, end)
            }, 0)

    return {
        SICK:        sumThisMonth("SICK"),
        CASUAL:      sumThisMonth("CASUAL"),
        EARNED:      sumThisMonth("EARNED"),
        LOSS_OF_PAY: sumThisMonth("LOSS_OF_PAY"),
    }
}

// ─── Monthly regularization counts ───────────────────────────────────────────
const calcMonthlyRegularizations = (regMap, lateRegMap) => {
    const absRegs  = Object.values(regMap     || {})
    const lateRegs = Object.values(lateRegMap || {})
    return {
        absentPending:  absRegs.filter(r => r.status === "PENDING").length,
        absentApproved: absRegs.filter(r => r.status === "APPROVED").length,
        latePending:    lateRegs.filter(r => r.status === "PENDING").length,
        lateApproved:   lateRegs.filter(r => r.status === "APPROVED").length,
    }
}

const MyProfile = () => {
    const [profile, setProfile] = useState(null)
    const [att,     setAtt]     = useState({ PRESENT: 0, LATE: 0, ABSENT: 0 })
    const [lv,      setLv]      = useState({ SICK: 0, CASUAL: 0,  LOSS_OF_PAY: 0 })
    const [regs,    setRegs]    = useState({ absentPending: 0, absentApproved: 0, latePending: 0, lateApproved: 0 })
    const [lopInfo, setLopInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // 1. Profile
                const profileRes = await api.get("/profile")
                const prof = profileRes.data
                setProfile(prof)

                // 2. Attendance — current month (API already filters by month)
                try {
                    const attRes   = await api.get("/attendance")
                    const records  = attRes.data.data || []
                    const absent   = calcAbsentDays(records, prof)
                    setAtt({
                        PRESENT: records.filter(r => r.status === "PRESENT").length,
                        LATE:    records.filter(r => r.status === "LATE").length,
                        ABSENT:  absent,
                    })
                } catch { /* show zeros */ }

                // 3. Leaves — monthly counts
                try {
                    const leaveRes = await api.get("/leave")
                    setLv(calcMonthlyLeaves(leaveRes.data.data || []))
                } catch { /* show zeros */ }

                // 4. Regularization counts for this month
                try {
                    const istNow = new Date(Date.now() + IST_OFFSET_MS)
                    const y = istNow.getUTCFullYear()
                    const m = istNow.getUTCMonth() + 1
                    const regRes  = await api.get(`/regularization/month-map?year=${y}&month=${m}`)
                    const regData = regRes.data.data || {}
                    setRegs(calcMonthlyRegularizations(regData.regularizations, regData.lateRegularizations))
                } catch { /* show zeros */ }

                // 5. LOP summary for salary
                try {
                    if (prof._id || prof.id) {
                        const now    = new Date()
                        const lopRes = await api.get(
                            `/leave/lop-summary?employeeId=${prof._id ?? prof.id}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
                        )
                        setLopInfo(lopRes.data)
                    }
                } catch { /* silent */ }

            } catch (err) {
                toast.error(err?.response?.data?.error || err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    if (loading) return <Loading />
    if (!profile) return (
        <div className="flex items-center justify-center h-64 text-slate-400">
            Could not load profile.
        </div>
    )

    const ws  = profile.workSchedule     || {}
    const loc = profile.assignedLocation || {}
    const bd  = profile.bankDetails      || {}

    const now         = new Date()
    const istNow      = new Date(now.getTime() + IST_OFFSET_MS)
    const monthName   = istNow.toLocaleString("en-IN", { month: "long", year: "numeric" })
    const basicSalary = profile.basicSalary ?? 0
    const allowances  = profile.allowances  ?? 0
    const workingDays = lopInfo?.workingDays ?? 26
    const lopDays     = lopInfo?.days        ?? 0
    const lopAmount   = lopInfo?.amount      ?? 0
    const netSalary   = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

    return (
        <div className="animate-fade-in max-w-3xl mx-auto space-y-5 pb-10">

            {/* Hero */}
            <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    {profile.avatar ? (
                        <img src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none" }} />
                    ) : (
                        <span className="text-3xl font-bold text-indigo-400">
                            {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </span>
                    )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <h1 className="text-2xl font-bold text-slate-100">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        {profile.employeeId && (
                            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                {profile.employeeId}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{profile.position} · {profile.department}</p>
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

            {/* Personal Info */}
            <Section title="Personal Information">
                {profile.employeeId && <Row icon={HashIcon}      label="Employee ID"  value={profile.employeeId} />}
                <Row icon={MailIcon}          label="Email"        value={profile.email} />
                <Row icon={PhoneIcon}         label="Phone"        value={profile.phone} />
                <Row icon={BriefcaseIcon}     label="Position"     value={profile.position} />
                <Row icon={BuildingIcon}      label="Department"   value={profile.department} />
                <Row icon={CalendarIcon}      label="Join Date"
                    value={profile.joinDate
                        ? new Date(profile.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : null}
                />
                {profile.bloodGroup && <Row icon={DropletIcon} label="Blood Group" value={profile.bloodGroup} />}
            </Section>

            {/* Work Schedule */}
            {(ws.shiftStart || ws.weekOff?.length > 0) && (
                <Section title="Work Schedule">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {ws.shiftStart && ws.shiftEnd && (
                            <Row icon={ClockIcon}       label="Shift Timings" value={`${fmt12(ws.shiftStart)} – ${fmt12(ws.shiftEnd)}`} />
                        )}
                        {ws.breakStart && ws.breakEnd && (
                            <Row icon={CoffeeIcon}      label="Break Timings" value={`${fmt12(ws.breakStart)} – ${fmt12(ws.breakEnd)}`} />
                        )}
                        {ws.lunchStart && ws.lunchEnd && (
                            <Row icon={UtensilsIcon}    label="Lunch Timings" value={`${fmt12(ws.lunchStart)} – ${fmt12(ws.lunchEnd)}`} />
                        )}
                        {ws.weekOff?.length > 0 && (
                            <Row icon={CalendarOffIcon} label="Week Off"       value={ws.weekOff.join(", ")} />
                        )}
                    </div>
                </Section>
            )}

            {/* Assigned Location */}
            {loc.latitude && (
                <Section title="Assigned Work Location">
                    <Row icon={MapPinIcon} label="Office Location"
                        value={loc.label || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`} />
                    <Row icon={MapPinIcon} label="Allowed Radius" value={`${loc.radiusMeters}m`} />
                </Section>
            )}

            {/* Attendance Summary */}
            <Section title={`Attendance Summary — ${monthName}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="Present" value={att.PRESENT} icon={CalendarIcon}    color="green"  />
                    <StatCard label="Late"    value={att.LATE}    icon={ClockIcon}       color="yellow" />
                    <StatCard label="Absent"  value={att.ABSENT}  icon={CalendarOffIcon} color="rose"   />
                </div>
            </Section>

            {/* Leave Summary */}
            <Section title={`Leave Summary — ${monthName}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="Sick Leave"   value={lv.SICK}        icon={ThermometerIcon} color="blue"   />
                    <StatCard label="Casual Leave" value={lv.CASUAL}      icon={UmbrellaIcon}    color="purple" />
                    {/* <StatCard label="Earned Leave" value={lv.EARNED}      icon={StarIcon}        color="green"  /> */}
                    <StatCard label="Loss of Pay"  value={lv.LOSS_OF_PAY} icon={PalmtreeIcon}    color="rose"   />
                </div>
            </Section>

            {/* Regularization Summary */}
            {(regs.absentPending + regs.absentApproved + regs.latePending + regs.lateApproved > 0) && (
                <Section title={`Regularization — ${monthName}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {regs.absentPending  > 0 && <StatCard label="Absent Pending"  value={regs.absentPending}  icon={ClockIcon}       color="yellow" />}
                        {regs.absentApproved > 0 && <StatCard label="Absent Approved" value={regs.absentApproved} icon={CalendarIcon}    color="green"  />}
                        {regs.latePending    > 0 && <StatCard label="Late Pending"    value={regs.latePending}    icon={ClockIcon}       color="yellow" />}
                        {regs.lateApproved   > 0 && <StatCard label="Late Approved"   value={regs.lateApproved}   icon={CalendarIcon}    color="teal"   />}
                    </div>
                </Section>
            )}

            {/* Salary */}
            <Section title={`Salary Details — ${monthName}`}>
                <Row icon={BadgeIndianRupeeIcon} label="Salary"            value={inr(basicSalary)} />
                {/* <Row icon={BadgeIndianRupeeIcon} label="Allowances"              value={`+ ${inr(allowances)}`} />
                <Row icon={CalendarIcon}         label="Working Days This Month" value={`${workingDays} days`} /> */}
                {/* {lopDays > 0 ? (
                    <Row icon={BadgeIndianRupeeIcon}
                        label={`LOP Deduction (${lopDays} day${lopDays > 1 ? "s" : ""} × ${inr(basicSalary / workingDays)}/day)`}
                        value={`– ${inr(lopAmount)}`} />
                ) : (
                    <Row icon={BadgeIndianRupeeIcon} label="LOP Deduction" value="None" />
                )} */}
            </Section>

            {/* Bank Details */}
            {bd.accountNumber && (
                <Section title="Bank Details">
                    <Row icon={UserIcon}            label="Account Holder" value={bd.accountHolderName} />
                    <Row icon={BuildingIcon}         label="Bank Name"      value={bd.bankName} />
                    <Row icon={BadgeIndianRupeeIcon} label="Account Number" value={bd.accountNumber} />
                    <Row icon={BadgeIndianRupeeIcon} label="IFSC Code"      value={bd.ifscCode} />
                    <Row icon={BadgeIndianRupeeIcon} label="Account Type"   value={bd.accountType} />
                </Section>
            )}
        </div>
    )
}

export default MyProfile