// import { Loader2, Save, User } from "lucide-react"
// import { useState } from "react"
// import api from "../api/axios"


// const ProfileForm = ({initialData,onSuccess}) => {
//     const [loading,setLoading] = useState(false)
//     const [error,setError] = useState("")
//     const [message,setMessage] = useState("")

//     const handleSubmit = async(e)=>{
//         e.preventDefault()
//         setLoading(true)
//         setError("")
//         setMessage("")

//         const formData = new FormData(e.currentTarget)
//         try {
//             await api.post("/profile",formData)
//             setMessage("Profile update successfully")
//             onSuccess?.()
//         } catch (err) {
//             setError(err.response?.data?.error || err.message)
//         }finally{
//             setLoading(false)
//         }
//     }
//   return (
//     <form  onSubmit={handleSubmit} className="rounded-2xl p-5 sm:p-6 mb-6 bg-indigo-500/8 border border-indigo-500/15">
//         <h2 className="text-base font-medium text-slate-100 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
//             <User className="w-5 h-5 text-slate-100"/>
//             Public Profile
//         </h2>
//         {error && (
//             <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm border border-rose-200 mb-6 flex items-start gap-3">
//                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"/>{error}
//             </div>
//         )}
//         {message && (
//             <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-200 mb-6 flex items-start gap-3">
//                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"/>{message}
//             </div>
//         )}
//         <div className="space-y-5">
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div >
//                     <label className="block text-sm font-medium text-slate-100 mb-2">Name</label>
//                     <input disabled value={`${initialData.firstName} ${initialData.lastName} `} className="bg-white/[0.07] text-slate-400 cursor-not-allowed" />
//                 </div>
//                 <div >
//                     <label className="block text-sm font-medium text-slate-100 mb-2">Email</label>
//                     <input disabled value={initialData.email} className="bg-white/[0.07] text-slate-400 cursor-not-allowed" />
//                 </div>
//                 <div className="sm:col-span-2" >
//                     <label className="block text-sm font-medium text-slate-100 mb-2">Position</label>
//                     <input disabled value={initialData.position} className="bg-white/[0.07] text-slate-400 cursor-not-allowed" />
//                 </div>
//             </div>
//             <div>
//   <label className="block text-sm font-medium text-slate-100 mb-2">
//     Bio
//   </label>

//   <textarea
//     name="bio"
//     disabled={initialData.isDeleted}
//     defaultValue={initialData.bio || ""}
//     placeholder="Write a bio..."
//     className={`resize-none text-slate-100 placeholder:text-slate-400 ${
//       initialData.isDeleted
//         ? "bg-white/[0.07] text-slate-400 cursor-not-allowed"
//         : ""
//     }`}
//   />

//   <p className="text-xs text-slate-400 mt-1.5">
//     This will be displayed on your profile.
//   </p>
// </div>
//             {initialData.isDeleted ?(
//                 <div className="pt-2">
//                     <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
//                         <p className="text-rose-600 font-medium tracking-tight">Account Deactivated</p>
//                         <p className="text-sm text-red-500 mt-0.5"> You can no longer update your profile. </p>
//                     </div>
//                 </div>
//             ):(
//                 <div className="flex justify-end pt-2">
//                     <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 justify-center w-full sm:w-auto">
//                         {loading ? <Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}Save Changes</button>
//                 </div>
//             )}
//         </div>
//     </form>
//   )
// }

// export default ProfileForm




import { Loader2, Save, User } from "lucide-react"
import { useState } from "react"
import api from "../api/axios"

const ProfileForm = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")
    const [message, setMessage] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setMessage("")

        // ✅ Send JSON — server uses express.json(), not multipart
        const bio = new FormData(e.currentTarget).get("bio")

        try {
            await api.post("/profile", { bio })
            setMessage("Profile updated successfully")
            onSuccess?.()
        } catch (err) {
            setError(err.response?.data?.error || err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 sm:p-6 mb-6 bg-indigo-500/8 border border-indigo-500/15">
            <h2 className="text-base font-medium text-slate-100 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-100" />
                Public Profile
            </h2>

            {error && (
                <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm border border-rose-200 mb-6 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />{error}
                </div>
            )}
            {message && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-200 mb-6 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{message}
                </div>
            )}

            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-100 mb-2">Name</label>
                        <input disabled value={`${initialData.firstName} ${initialData.lastName}`} className="bg-white/[0.07] text-slate-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-100 mb-2">Email</label>
                        <input disabled value={initialData.email} className="bg-white/[0.07] text-slate-400 cursor-not-allowed" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-100 mb-2">Position</label>
                        <input disabled value={initialData.position} className="bg-white/[0.07] text-slate-400 cursor-not-allowed" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-100 mb-2">Bio</label>
                    <textarea
                        name="bio"
                        disabled={initialData.isDeleted}
                        defaultValue={initialData.bio || ""}
                        placeholder="Write a bio..."
                        className={`resize-none text-slate-100 placeholder:text-slate-400 ${
                            initialData.isDeleted ? "bg-white/[0.07] text-slate-400 cursor-not-allowed" : ""
                        }`}
                    />
                    <p className="text-xs text-slate-400 mt-1.5">This will be displayed on your profile.</p>
                </div>

                {initialData.isDeleted ? (
                    <div className="pt-2">
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                            <p className="text-rose-600 font-medium tracking-tight">Account Deactivated</p>
                            <p className="text-sm text-red-500 mt-0.5">You can no longer update your profile.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 justify-center w-full sm:w-auto">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </form>
    )
}

export default ProfileForm