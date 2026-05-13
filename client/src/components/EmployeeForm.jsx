import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2Icon } from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { DEPARTMENTS } from "../assets/assets.js"

const EmployeeForm = ({ initialData, onSuccess, onCancel, isAdmin = false }) => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const isEditMode = !!initialData

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const body = Object.fromEntries(formData.entries())

        if (body.date) {
            body.joinDate = body.date
            delete body.date
        }
        if (isEditMode && !body.password) delete body.password

        try {
            const url    = isEditMode ? `/employees/${initialData._id || initialData.id}` : "/employees"
            const method = isEditMode ? "put" : "post"
            await api[method](url, body)
            toast.success(isEditMode ? "Employee updated" : "Employee created")
            onSuccess ? onSuccess() : navigate("/employees")
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-fade-in">

            {/* Personal Information */}
            <div className="card p-5 sm:p-6">
                <h3 className="font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">
                    <div>
                        <label className="block mb-2">First Name</label>
                        <input name="firstName" required defaultValue={initialData?.firstName} />
                    </div>
                    <div>
                        <label className="block mb-2">Last Name</label>
                        <input name="lastName" required defaultValue={initialData?.lastName} />
                    </div>
                    <div>
                        <label className="block mb-2">Phone Number</label>
                        <input name="phone" required defaultValue={initialData?.phone} />
                    </div>
                    <div>
                        <label className="block mb-2">Join Date</label>
                        <input
                            type="date" name="date" required
                            defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block mb-2">Bio (Optional)</label>
                        <textarea name="bio" defaultValue={initialData?.bio} rows={3} className="resize-none" placeholder="Brief description.." />
                    </div>
                </div>
            </div>

            {/* Employee Details */}
            <div className="card p-5 sm:p-6">
                <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">Employee Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">
                    <div>
                        <label className="block mb-2">Department</label>
                        <select name="department" defaultValue={initialData?.department || ""}>
                            <option value="">Select Department</option>
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Position</label>
                        <input name="position" required defaultValue={initialData?.position} />
                    </div>
                    <div>
                        <label className="block mb-2">Basic Salary</label>
                        <input type="number" name="basicSalary" required min="0" step="0.01" defaultValue={initialData?.basicSalary || 0} />
                    </div>
                    <div>
                        <label className="block mb-2">Allowances</label>
                        <input type="number" name="allowances" required min="0" step="0.01" defaultValue={initialData?.allowances || 0} />
                    </div>
                    <div>
                        <label className="block mb-2">Deductions</label>
                        <input type="number" name="deductions" required min="0" step="0.01" defaultValue={initialData?.deductions || 0} />
                    </div>
                    {isEditMode && (
                        <div>
                            <label className="block mb-2">Status</label>
                            <select name="employmentStatus" defaultValue={initialData?.employmentStatus}>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Setup */}
            <div className="card p-5 sm:p-6">
                <h3 className="text-base font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Account Setup</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                    <div className="sm:col-span-2 text-slate-900">
                        <label className="block mb-2">Work Email</label>
                        <input type="email" name="email" required defaultValue={initialData?.email} />
                    </div>
                    {!isEditMode && (
                        <div>
                            <label className="block mb-2 text-slate-900">Temporary Password</label>
                            <input type="password" name="password" required />
                        </div>
                    )}
                    {isEditMode && (
                        <div>
                            <label className="block mb-2 text-slate-900">Change Password (Optional)</label>
                            <input type="password" name="password" placeholder="Leave blank to keep current" />
                        </div>
                    )}
                    <div>
                        <label className="block mb-2 text-slate-900">System Role</label>
                        <select name="role" defaultValue={initialData?.user?.role || "EMPLOYEE"}>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bank Details — Admin only */}
            {isAdmin && (
                <div className="card p-5 sm:p-6">
                    <h3 className="text-base font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Bank Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">
                        <div className="sm:col-span-2">
                            <label className="block mb-2">Account Holder Name</label>
                            <input name="accountHolderName" placeholder="As per bank records" defaultValue={initialData?.bankDetails?.accountHolderName} />
                        </div>
                        <div>
                            <label className="block mb-2">Bank Name</label>
                            <input name="bankName" placeholder="e.g. State Bank of India" defaultValue={initialData?.bankDetails?.bankName} />
                        </div>
                        <div>
                            <label className="block mb-2">Account Type</label>
                            <select name="accountType" defaultValue={initialData?.bankDetails?.accountType || ""}>
                                <option value="">Select Type</option>
                                <option value="SAVINGS">Savings</option>
                                <option value="CURRENT">Current</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2">Account Number</label>
                            <input name="accountNumber" placeholder="Enter account number" defaultValue={initialData?.bankDetails?.accountNumber} />
                        </div>
                        <div>
                            <label className="block mb-2">IFSC Code</label>
                            <input name="ifscCode" placeholder="e.g. SBIN0001234" defaultValue={initialData?.bankDetails?.ifscCode} />
                        </div>
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => onCancel ? onCancel() : navigate(-1)}>
                    Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center justify-center" disabled={loading}>
                    {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditMode ? "Update Employee" : "Create Employee"}
                </button>
            </div>
        </form>
    )
}

export default EmployeeForm