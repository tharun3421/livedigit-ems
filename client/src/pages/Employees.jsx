import { useCallback, useEffect, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import EmployeeCard from "../components/EmployeeCard"
import EmployeeForm from "../components/EmployeeForm"
import api from "../api/axios"
import { DEPARTMENTS } from "../assets/assets.js"

const Employees = () => {
    const [employees, setEmployees]         = useState([])
    const [loading, setLoading]             = useState(true)
    const [search, setSearch]               = useState("")
    const [selectedDept, setSelectedDept]   = useState("")
    const [editEmployee, setEditEmployee]   = useState(null)
    const [showCreateModel, setShowCreateModel] = useState(false)

    const fetchEmployees = useCallback(async () => {
        try {
            const url = selectedDept ? `/employees?department=${selectedDept}` : "/employees"
            const res = await api.get(url)
            setEmployees(res.data)
        } catch (error) {
            console.error("Failed to fetch employees")
        } finally {
            setLoading(false)
        }
    }, [selectedDept])

    useEffect(() => { fetchEmployees() }, [fetchEmployees])

    const filtered = employees.filter((emp) =>
        `${emp.firstName} ${emp.lastName} ${emp.position}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl text-slate-100">Employees</h1>
                    <p className="text-slate-500">Manage your team members</p>
                </div>
                <button onClick={() => setShowCreateModel(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Plus size={16} /> Add Employee
                </button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input placeholder="Search employee..." className="w-full pl-10 text-slate-100" onChange={(e) => setSearch(e.target.value)} value={search} />
                </div>
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="max-w-40 text-slate-400">
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d} className="text-slate-800">{d}</option>)}
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {filtered.length === 0 ? (
                        <p className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            No employees found
                        </p>
                    ) : (
                        filtered.map((emp) => (
                            <EmployeeCard
                                key={emp.id}
                                employee={emp}
                                isAdmin={true}
                                onDelete={fetchEmployees}
                                onEdit={(e) => setEditEmployee(e)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModel && (
                <div className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowCreateModel(false)}>
                    <div className="relative bg-white border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 pb-0">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Add New Employee</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Create a user account and employee profile</p>
                            </div>
                            <button onClick={() => setShowCreateModel(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <EmployeeForm
                                isAdmin={true}
                                onSuccess={() => { setShowCreateModel(false); fetchEmployees() }}
                                onCancel={() => setShowCreateModel(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editEmployee && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setEditEmployee(null)}>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 pb-0">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Edit Employee</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Update employee details</p>
                            </div>
                            <button onClick={() => setEditEmployee(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <EmployeeForm
                                isAdmin={true}
                                initialData={editEmployee}
                                onSuccess={() => { setEditEmployee(null); fetchEmployees() }}
                                onCancel={() => setEditEmployee(null)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Employees