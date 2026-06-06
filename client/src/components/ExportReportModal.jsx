import { useState, useEffect } from "react"
import { XIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon, Loader2Icon, UsersIcon, UserIcon } from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

const ExportReportModal = ({ onClose }) => {
    const now = new Date()
    const [month,       setMonth]       = useState(now.getMonth() + 1)
    const [year,        setYear]        = useState(now.getFullYear())
    const [scope,       setScope]       = useState("all")
    const [employees,   setEmployees]   = useState([])
    const [selectedEmp, setSelectedEmp] = useState("")
    const [loading,     setLoading]     = useState(false)
    const [loadingEmps, setLoadingEmps] = useState(false)

    useEffect(() => {
        const fetchEmps = async () => {
            setLoadingEmps(true)
            try {
                const { data } = await api.get("/employees")
                setEmployees(data.employees || data || [])
            } catch { /* silent */ }
            finally { setLoadingEmps(false) }
        }
        fetchEmps()
    }, [])

    const download = async (format) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ month, year, format })
            if (scope === "specific" && selectedEmp) params.set("employeeId", selectedEmp)

            const token   = localStorage.getItem("token")
            const baseURL = (import.meta.env.VITE_BASE_URL || "http://localhost:4000") + "/api"
            const res     = await fetch(`${baseURL}/export?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: `Server error ${res.status}` }))
                toast.error(errData.error || "Export failed")
                return
            }

            const blob      = await res.blob()
            const url       = URL.createObjectURL(blob)
            const link      = document.createElement("a")
            const monthName = MONTHS[month - 1]
            const empLabel  = scope === "specific" && selectedEmp
                ? (employees.find(e => (e._id || e.id) === selectedEmp)?.employeeId || "employee")
                : "all_employees"

            link.href     = url
            link.download = `${empLabel}_${monthName}_${year}.${format === "csv" ? "csv" : "json"}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success("Report downloaded!")
        } catch (err) {
            console.error("Export failed:", err)
            toast.error("Export failed. Please try again.")
        } finally { setLoading(false) }
    }

    const years = []
    for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                            <DownloadIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-slate-100 font-semibold">Export Report</h2>
                            <p className="text-xs text-slate-500">Download employee attendance & salary data</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Month</label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))}
                                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:border-cyan-500">
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Year</label>
                            <select value={year} onChange={e => setYear(Number(e.target.value))}
                                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:border-cyan-500">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">Export Scope</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setScope("all")}
                                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                                    scope === "all"
                                        ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                                }`}>
                                <UsersIcon className="w-4 h-4" /> All Employees
                            </button>
                            <button onClick={() => setScope("specific")}
                                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                                    scope === "specific"
                                        ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                                }`}>
                                <UserIcon className="w-4 h-4" /> Specific Employee
                            </button>
                        </div>
                    </div>

                    {scope === "specific" && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Employee</label>
                            {loadingEmps ? (
                                <div className="flex items-center gap-2 text-slate-500 py-2">
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading…</span>
                                </div>
                            ) : (
                                <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:border-cyan-500">
                                    <option value="">Select an employee…</option>
                                    {employees.map(emp => {
                                        const id = emp._id || emp.id
                                        return (
                                            <option key={id} value={id}>
                                                {emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ""}
                                            </option>
                                        )
                                    })}
                                </select>
                            )}
                        </div>
                    )}

                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 mb-2">Report includes:</p>
                        <div className="grid grid-cols-2 gap-1">
                            {[
                                "Employee Name & ID","Office Location",
                                "Present / Absent / Late Days","Loss of Pay (LOP)",
                                "Sick / Casual / Earned Leaves","Monthly Salary",
                                "Bank Details","Net Pay",
                            ].map(item => (
                                <div key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="w-1 h-1 rounded-full bg-cyan-500 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 px-6 pb-6">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => download("csv")}
                        disabled={loading || (scope === "specific" && !selectedEmp)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <FileSpreadsheetIcon className="w-4 h-4" />}
                        CSV / Excel
                    </button>
                    <button onClick={() => download("json")}
                        disabled={loading || (scope === "specific" && !selectedEmp)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <FileTextIcon className="w-4 h-4" />}
                        JSON
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ExportReportModal