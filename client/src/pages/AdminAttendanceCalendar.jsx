import { useEffect, useState } from "react"
import { SearchIcon, CalendarDaysIcon, Loader2Icon } from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"
import AdminAttendanceCalendarModal from "../components/attendance/AdminAttendanceCalendarModal"

const EmployeeAvatar = ({ firstName, lastName }) => (
    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-indigo-400">{firstName?.[0]}{lastName?.[0]}</span>
    </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
// Lets an admin search any employee and open a read-only view of their
// attendance calendar, identical to what the employee sees in their own portal.
const AdminAttendanceCalendar = () => {
    const [employees, setEmployees] = useState([])
    const [loading,   setLoading]   = useState(true)
    const [search,    setSearch]    = useState("")
    const [selected,  setSelected]  = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/employees")
                setEmployees(res.data || [])
            } catch {
                toast.error("Failed to load employees")
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const filtered = employees.filter((emp) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            emp.firstName?.toLowerCase().includes(q) ||
            emp.lastName?.toLowerCase().includes(q) ||
            emp.department?.toLowerCase().includes(q) ||
            emp.position?.toLowerCase().includes(q)
        )
    })

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <CalendarDaysIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="page-title">Attendance Calendar</h1>
                        <p className="page-subtitle">Search an employee to view their attendance calendar, exactly as they see it</p>
                    </div>
                </div>
            </div>

            <div className="relative max-w-sm mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="text" placeholder="Search employees by name, department…"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading employees…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <CalendarDaysIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No employees found</p>
                        {search && <p className="text-slate-600 text-xs mt-1">Try clearing your search</p>}
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-800/60">
                        {filtered.map((emp) => (
                            <button
                                key={emp.id}
                                onClick={() => setSelected(emp)}
                                className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-800/30 transition-colors text-left"
                            >
                                <EmployeeAvatar firstName={emp.firstName} lastName={emp.lastName} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-200 truncate">
                                        {emp.firstName} {emp.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {emp.position} · {emp.department}
                                    </p>
                                </div>
                                <CalendarDaysIcon className="w-4 h-4 text-slate-600 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selected && (
                <AdminAttendanceCalendarModal
                    employeeId={selected.id}
                    employeeName={`${selected.firstName} ${selected.lastName}`}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    )
}

export default AdminAttendanceCalendar