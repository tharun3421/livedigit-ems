import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import api from "../api/axios";
import toast from "react-hot-toast";

const EmployeeCard = ({ employee, onDelete, onEdit }) => {
    const [showActions, setShowActions] = useState(false)

    const handleDelete = async () => {
        if (!confirm("Are you sure want to delete this employee?")) return;
        try {
            await api.delete(`/employees/${employee.id}`)
            onDelete()
        } catch (err) {
            toast.error(err.response?.data?.error || err.message)
        }
    }

    return (
        <div className="group relative card card-hover overflow-hidden">
            <div
                className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 to-slate-50 cursor-pointer"
                onClick={() => setShowActions((prev) => !prev)}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
                        <span className="text-2xl font-medium text-indigo-400">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                        </span>
                    </div>
                </div>

                {/* Desktop hover overlay — hidden on mobile */}
                {!employee.isDeleted && (
                    <div className="absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent transition-opacity flex items-end justify-center pb-6 gap-3 opacity-0 group-hover:opacity-100 hidden sm:flex">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
                            className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                            className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105"
                        >
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm">
                    {employee.department || "Remote"}
                </span>
                {employee.isDeleted && (
                    <span className="bg-red-500/60 font-medium text-white px-2.5 py-1 text-xs rounded">
                        DELETED
                    </span>
                )}
            </div>

            <div className="p-5">
                <h3 className="text-slate-900">{employee.firstName} {employee.lastName}</h3>
                <p className="text-xs text-slate-500">{employee.position}</p>
            </div>

            {/* Mobile action buttons — shown on tap, hidden on desktop */}
            {!employee.isDeleted && (
                <div className={`sm:hidden flex border-t border-slate-100 divide-x divide-slate-100 transition-all duration-200 overflow-hidden ${showActions ? "max-h-14 opacity-100" : "max-h-0 opacity-0"}`}>
                    <button
                        onClick={() => onEdit(employee)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                        <Trash2Icon className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}

export default EmployeeCard