// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { Loader2Icon, MapPinIcon, MapPinOffIcon, LocateFixedIcon, NavigationIcon } from "lucide-react"
// import api from "../api/axios"
// import toast from "react-hot-toast"
// import { DEPARTMENTS } from "../assets/assets.js"

// const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// // ─── Location Picker (Leaflet / OpenStreetMap) ────────────────────────────────
// import { useEffect, useRef } from "react"

// const LocationPicker = ({ value, onChange }) => {
//     const mapRef     = useRef(null)
//     const leafletMap = useRef(null)
//     const markerRef  = useRef(null)
//     const circleRef  = useRef(null)
//     const [ready, setReady]       = useState(false)
//     const [locating, setLocating] = useState(false)

//     const lat    = value?.latitude     ?? null
//     const lng    = value?.longitude    ?? null
//     const radius = value?.radiusMeters ?? 100

//     useEffect(() => {
//         if (window.L) { setReady(true); return }
//         const link = document.createElement("link")
//         link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
//         document.head.appendChild(link)
//         const script = document.createElement("script")
//         script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
//         script.onload = () => setReady(true)
//         document.head.appendChild(script)
//     }, [])

//     useEffect(() => {
//         if (!ready || !mapRef.current || leafletMap.current) return
//         const L   = window.L
//         const map = L.map(mapRef.current).setView([lat ?? 17.3850, lng ?? 78.4867], lat ? 16 : 12)
//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map)
//         leafletMap.current = map
//         map.on("click", (e) => {
//             const { lat: la, lng: lo } = e.latlng
//             placePin(la, lo)
//             onChange((p) => ({ ...p, latitude: la, longitude: lo }))
//         })
//         if (lat && lng) placePin(lat, lng)
//         return () => { map.remove(); leafletMap.current = null }
//     }, [ready]) // eslint-disable-line

//     useEffect(() => {
//         if (!leafletMap.current || !markerRef.current) return
//         circleRef.current?.remove()
//         circleRef.current = window.L.circle(markerRef.current.getLatLng(), { radius, color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.12, weight: 2 }).addTo(leafletMap.current)
//     }, [radius])

//     const placePin = (la, lo) => {
//         const L = window.L; const map = leafletMap.current; if (!map) return
//         const icon = L.divIcon({ html: `<div style="width:24px;height:24px;background:#6366f1;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`, iconSize: [24, 24], iconAnchor: [12, 24], className: "" })
//         if (markerRef.current) markerRef.current.setLatLng([la, lo])
//         else markerRef.current = L.marker([la, lo], { icon }).addTo(map)
//         circleRef.current?.remove()
//         circleRef.current = L.circle([la, lo], { radius: value?.radiusMeters ?? 100, color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.12, weight: 2 }).addTo(map)
//     }

//     const handleLocateMe = () => {
//         if (!navigator.geolocation) return toast.error("Geolocation not supported")
//         setLocating(true)
//         navigator.geolocation.getCurrentPosition(
//             ({ coords: { latitude: la, longitude: lo } }) => {
//                 placePin(la, lo); leafletMap.current?.setView([la, lo], 17)
//                 onChange((p) => ({ ...p, latitude: la, longitude: lo })); setLocating(false)
//             },
//             () => { toast.error("Could not get location"); setLocating(false) },
//             { enableHighAccuracy: true, timeout: 8000 }
//         )
//     }

//     const handleClear = () => {
//         markerRef.current?.remove(); markerRef.current = null
//         circleRef.current?.remove(); circleRef.current = null
//         onChange((p) => ({ ...p, latitude: null, longitude: null }))
//     }

//     return (
//         <div className="space-y-3">
//             <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 260 }}>
//                 {!ready && <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10"><Loader2Icon className="w-6 h-6 animate-spin text-indigo-400" /></div>}
//                 <div ref={mapRef} className="w-full h-full" />
//                 <div className="absolute top-2 right-2 z-[999] flex flex-col gap-2">
//                     <button type="button" onClick={handleLocateMe} disabled={locating} className="p-2 bg-white rounded-lg shadow-md text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50">
//                         {locating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <LocateFixedIcon className="w-4 h-4" />}
//                     </button>
//                     {lat && <button type="button" onClick={handleClear} className="p-2 bg-white rounded-lg shadow-md text-rose-500 hover:bg-rose-50"><MapPinOffIcon className="w-4 h-4" /></button>}
//                 </div>
//                 {!lat && (
//                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
//                         <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">Click map to set location</span>
//                     </div>
//                 )}
//             </div>
//             {lat && lng && (
//                 <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
//                     <NavigationIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
//                     <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
//                 </div>
//             )}
//             <div>
//                 <div className="flex justify-between items-center mb-1.5">
//                     <label className="text-xs text-slate-500">Allowed Radius</label>
//                     <span className="text-xs font-semibold text-indigo-600">{radius}m</span>
//                 </div>
//                 <input type="range" min={50} max={1000} step={50} value={radius} onChange={(e) => onChange((p) => ({ ...p, radiusMeters: parseInt(e.target.value) }))} className="w-full accent-indigo-600" />
//                 <div className="flex justify-between text-xs text-slate-400 mt-1"><span>50m</span><span>1000m</span></div>
//             </div>
//         </div>
//     )
// }

// // ─── Main Form ────────────────────────────────────────────────────────────────
// const EmployeeForm = ({ initialData, onSuccess, onCancel, isAdmin = false }) => {
//     const navigate   = useNavigate()
//     const [loading, setLoading] = useState(false)
//     const isEditMode = !!initialData

//     // Work schedule state
//     const [workSchedule, setWorkSchedule] = useState({
//         shiftStart: initialData?.workSchedule?.shiftStart ?? "",
//         shiftEnd:   initialData?.workSchedule?.shiftEnd   ?? "",
//         breakStart: initialData?.workSchedule?.breakStart ?? "",
//         breakEnd:   initialData?.workSchedule?.breakEnd   ?? "",
//         lunchStart: initialData?.workSchedule?.lunchStart ?? "",
//         lunchEnd:   initialData?.workSchedule?.lunchEnd   ?? "",
//         weekOff:    initialData?.workSchedule?.weekOff    ?? ["Saturday", "Sunday"],
//     })

//     const toggleWeekOff = (day) => {
//         setWorkSchedule((prev) => ({
//             ...prev,
//             weekOff: prev.weekOff.includes(day)
//                 ? prev.weekOff.filter((d) => d !== day)
//                 : [...prev.weekOff, day],
//         }))
//     }

//     // Location state
//     const [enableGeofencing, setEnableGeofencing] = useState(!!(initialData?.assignedLocation?.latitude))
//     const [assignedLocation, setAssignedLocation] = useState({
//         label:        initialData?.assignedLocation?.label        ?? "",
//         latitude:     initialData?.assignedLocation?.latitude     ?? null,
//         longitude:    initialData?.assignedLocation?.longitude    ?? null,
//         radiusMeters: initialData?.assignedLocation?.radiusMeters ?? 100,
//     })

//     const handleSubmit = async (e) => {
//         e.preventDefault()
//         setLoading(true)
//         const formData = new FormData(e.currentTarget)
//         const body     = Object.fromEntries(formData.entries())

//         if (body.date) { body.joinDate = body.date; delete body.date }
//         if (isEditMode && !body.password) delete body.password

//         if (isAdmin) {
//             body.workSchedule    = workSchedule
//             body.assignedLocation = enableGeofencing && assignedLocation.latitude
//                 ? assignedLocation
//                 : { label: "", latitude: null, longitude: null, radiusMeters: 100 }
//         }

//         try {
//             const url    = isEditMode ? `/employees/${initialData._id || initialData.id}` : "/employees"
//             const method = isEditMode ? "put" : "post"
//             await api[method](url, body)
//             toast.success(isEditMode ? "Employee updated" : "Employee created")
//             onSuccess ? onSuccess() : navigate("/employees")
//         } catch (error) {
//             toast.error(error.response?.data?.error || error.message)
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-fade-in">

//             {/* Personal Information */}
//             <div className="card p-5 sm:p-6">
//                 <h3 className="font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Personal Information</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">
//                     <div><label className="block mb-2">First Name</label><input name="firstName" required defaultValue={initialData?.firstName} /></div>
//                     <div><label className="block mb-2">Last Name</label><input name="lastName" required defaultValue={initialData?.lastName} /></div>
//                     <div><label className="block mb-2">Phone Number</label><input name="phone" required defaultValue={initialData?.phone} /></div>
//                     <div>
//                         <label className="block mb-2">Join Date</label>
//                         <input type="date" name="date" required defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""} />
//                     </div>
//                     <div className="sm:col-span-2">
//                         <label className="block mb-2">Bio (Optional)</label>
//                         <textarea name="bio" defaultValue={initialData?.bio} rows={3} className="resize-none" placeholder="Brief description.." />
//                     </div>
//                 </div>
//             </div>

//             {/* Employee Details */}
//             <div className="card p-5 sm:p-6">
//                 <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">Employee Details</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">
//                     <div>
//                         <label className="block mb-2">Department</label>
//                         <select name="department" defaultValue={initialData?.department || ""}>
//                             <option value="">Select Department</option>
//                             {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
//                         </select>
//                     </div>
//                     <div><label className="block mb-2">Position</label><input name="position" required defaultValue={initialData?.position} /></div>
//                     <div><label className="block mb-2">Salary</label><input type="number" name="basicSalary" required min="0" step="0.01" defaultValue={initialData?.basicSalary || 0} /></div>
//                     <div><label className="block mb-2">Allowances</label><input type="number" name="allowances" required min="0" step="0.01" defaultValue={initialData?.allowances || 0} /></div>
//                     <div><label className="block mb-2">Deductions</label><input type="number" name="deductions" required min="0" step="0.01" defaultValue={initialData?.deductions || 0} /></div>
//                     {isEditMode && (
//                         <div>
//                             <label className="block mb-2">Status</label>
//                             <select name="employmentStatus" defaultValue={initialData?.employmentStatus}>
//                                 <option value="ACTIVE">Active</option>
//                                 <option value="INACTIVE">Inactive</option>
//                             </select>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Account Setup */}
//             <div className="card p-5 sm:p-6">
//                 <h3 className="text-base font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Account Setup</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
//                     <div className="sm:col-span-2 text-slate-900"><label className="block mb-2">Work Email</label><input type="email" name="email" required defaultValue={initialData?.email} /></div>
//                     {!isEditMode && <div><label className="block mb-2 text-slate-900">Temporary Password</label><input type="password" name="password" required className="text-slate-900"/></div>}
//                     {isEditMode  && <div><label className="block mb-2 text-slate-900">Change Password (Optional)</label><input type="password" name="password" placeholder="Leave blank to keep current" /></div>}
//                     <div>
//                         <label className="block mb-2 text-slate-900">System Role</label>
//                         <select className="text-slate-900" name="role" defaultValue={initialData?.user?.role || "EMPLOYEE"}>
//                             <option value="EMPLOYEE">Employee</option>
//                             <option value="ADMIN">Admin</option>
//                         </select>
//                     </div>
//                 </div>
//             </div>

//             {/* Bank Details — admin only */}
//             {isAdmin && (
//                 <div className="card p-5 sm:p-6">
//                     <h3 className="text-base font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Bank Details</h3>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">
//                         <div className="sm:col-span-2"><label className="block mb-2">Account Holder Name</label><input name="accountHolderName" placeholder="As per bank records" defaultValue={initialData?.bankDetails?.accountHolderName} /></div>
//                         <div><label className="block mb-2">Bank Name</label><input name="bankName" placeholder="e.g. State Bank of India" defaultValue={initialData?.bankDetails?.bankName} /></div>
//                         <div>
//                             <label className="block mb-2">Account Type</label>
//                             <select name="accountType" defaultValue={initialData?.bankDetails?.accountType || ""}>
//                                 <option value="">Select Type</option>
//                                 <option value="SAVINGS">Savings</option>
//                                 <option value="CURRENT">Current</option>
//                             </select>
//                         </div>
//                         <div><label className="block mb-2">Account Number</label><input name="accountNumber" defaultValue={initialData?.bankDetails?.accountNumber} /></div>
//                         <div><label className="block mb-2">IFSC Code</label><input name="ifscCode" placeholder="e.g. SBIN0001234" defaultValue={initialData?.bankDetails?.ifscCode} /></div>
//                     </div>
//                 </div>
//             )}

//             {/* ── Work Schedule — admin only ─────────────────────────────────── */}
//             {isAdmin && (
//                 <div className="card p-5 sm:p-6">
//                     <h3 className="text-base font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">Work Schedule</h3>
//                     <div className="space-y-6 text-sm text-slate-900">

//                         {/* Shift timings */}
//                         <div>
//                             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Shift Timings</p>
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block mb-2">Shift Start</label>
//                                     <input type="time" value={workSchedule.shiftStart} onChange={(e) => setWorkSchedule((p) => ({ ...p, shiftStart: e.target.value }))} />
//                                 </div>
//                                 <div>
//                                     <label className="block mb-2">Shift End</label>
//                                     <input type="time" value={workSchedule.shiftEnd} onChange={(e) => setWorkSchedule((p) => ({ ...p, shiftEnd: e.target.value }))} />
//                                 </div>
//                             </div>
//                         </div>

                        
//                         {/* Lunch timings */}
//                         <div>
//                             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Lunch Timings</p>
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block mb-2">Lunch Start</label>
//                                     <input type="time" value={workSchedule.lunchStart} onChange={(e) => setWorkSchedule((p) => ({ ...p, lunchStart: e.target.value }))} />
//                                 </div>
//                                 <div>
//                                     <label className="block mb-2">Lunch End</label>
//                                     <input type="time" value={workSchedule.lunchEnd} onChange={(e) => setWorkSchedule((p) => ({ ...p, lunchEnd: e.target.value }))} />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Break timings */}
//                         <div>
//                             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Break Timings</p>
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block mb-2">Break Start</label>
//                                     <input type="time" value={workSchedule.breakStart} onChange={(e) => setWorkSchedule((p) => ({ ...p, breakStart: e.target.value }))} />
//                                 </div>
//                                 <div>
//                                     <label className="block mb-2">Break End</label>
//                                     <input type="time" value={workSchedule.breakEnd} onChange={(e) => setWorkSchedule((p) => ({ ...p, breakEnd: e.target.value }))} />
//                                 </div>
//                             </div>
//                         </div>


//                         {/* Week off */}
//                         <div>
//                             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Week Off Days</p>
//                             <div className="flex flex-wrap gap-2">
//                                 {DAYS_OF_WEEK.map((day) => {
//                                     const selected = workSchedule.weekOff.includes(day)
//                                     return (
//                                         <button
//                                             key={day} type="button"
//                                             onClick={() => toggleWeekOff(day)}
//                                             className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
//                                                 selected
//                                                     ? "bg-indigo-600 text-white border-indigo-600"
//                                                     : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
//                                             }`}
//                                         >
//                                             {day.slice(0, 3)}
//                                         </button>
//                                     )
//                                 })}
//                             </div>
//                             <p className="text-xs text-slate-400 mt-2">
//                                 Selected: {workSchedule.weekOff.length > 0 ? workSchedule.weekOff.join(", ") : "None"}
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* ── Attendance Location — admin only ───────────────────────────── */}
//             {isAdmin && (
//                 <div className="card p-5 sm:p-6">
//                     <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
//                         <div>
//                             <h3 className="text-base font-medium text-slate-900">Attendance Location</h3>
//                             <p className="text-xs text-slate-400 mt-0.5">Restrict clock-in to a specific location</p>
//                         </div>
//                         <button
//                             type="button"
//                             onClick={() => setEnableGeofencing((v) => !v)}
//                             className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${enableGeofencing ? "bg-indigo-600" : "bg-slate-200"}`}
//                         >
//                             <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${enableGeofencing ? "translate-x-5" : "translate-x-0"}`} />
//                         </button>
//                     </div>

//                     {enableGeofencing ? (
//                         <div className="space-y-4 text-sm text-slate-900">
//                             <div>
//                                 <label className="block mb-2">Location Name</label>
//                                 <div className="relative">
//                                     <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input type="text" placeholder='e.g. "Head Office"' value={assignedLocation.label} onChange={(e) => setAssignedLocation((p) => ({ ...p, label: e.target.value }))} className="pl-9" />
//                                 </div>
//                             </div>
//                             <div>
//                                 <label className="block mb-2">Pin Location <span className="text-xs text-slate-400 font-normal">— click map or use locate me</span></label>
//                                 <LocationPicker value={assignedLocation} onChange={setAssignedLocation} />
//                             </div>
//                             {!assignedLocation.latitude && (
//                                 <p className="text-xs text-amber-600 flex items-center gap-1.5">
//                                     <MapPinIcon className="w-3.5 h-3.5" /> Please pin a location on the map
//                                 </p>
//                             )}
//                         </div>
//                     ) : (
//                         <p className="text-sm text-slate-400 flex items-center gap-2">
//                             <MapPinOffIcon className="w-4 h-4" /> No restriction — employee can clock in from anywhere
//                         </p>
//                     )}
//                 </div>
//             )}

//             {/* Buttons */}
//             <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
//                 <button type="button" className="btn-secondary" onClick={() => onCancel ? onCancel() : navigate(-1)}>Cancel</button>
//                 <button type="submit" className="btn-primary flex items-center justify-center" disabled={loading}>
//                     {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
//                     {isEditMode ? "Update Employee" : "Create Employee"}
//                 </button>
//             </div>
//         </form>
//     )
// }

// export default EmployeeForm



import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Loader2Icon,
  MapPinIcon,
  MapPinOffIcon,
} from "lucide-react"

import api from "../api/axios"
import toast from "react-hot-toast"
import { DEPARTMENTS } from "../assets/assets.js"

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

// ─────────────────────────────────────────────────────────────
// OFFICE LOCATIONS
// ─────────────────────────────────────────────────────────────
const OFFICE_LOCATIONS = {
  HYDERABAD: {
    label: "Hyderabad Office",
    latitude: 17.385044,
    longitude: 78.486671,
    radiusMeters: 150,
  },

  VIZAG: {
    label: "Vizag Office",
    latitude: 17.686815,
    longitude: 83.218483,
    radiusMeters: 150,
  },
}

const EmployeeForm = ({
  initialData,
  onSuccess,
  onCancel,
  isAdmin = false,
}) => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const isEditMode = !!initialData

  // ───────────────────────────────────────────────────────────
  // WORK SCHEDULE
  // ───────────────────────────────────────────────────────────
  const [workSchedule, setWorkSchedule] = useState({
    shiftStart: initialData?.workSchedule?.shiftStart ?? "",
    shiftEnd: initialData?.workSchedule?.shiftEnd ?? "",
    breakStart: initialData?.workSchedule?.breakStart ?? "",
    breakEnd: initialData?.workSchedule?.breakEnd ?? "",
    lunchStart: initialData?.workSchedule?.lunchStart ?? "",
    lunchEnd: initialData?.workSchedule?.lunchEnd ?? "",
    weekOff:
      initialData?.workSchedule?.weekOff ?? [
        "Saturday",
        "Sunday",
      ],
  })

  // ───────────────────────────────────────────────────────────
  // LOCATION STATE
  // ───────────────────────────────────────────────────────────
  const [enableGeofencing, setEnableGeofencing] =
    useState(
      !!initialData?.assignedLocation?.latitude
    )

  const [selectedOffice, setSelectedOffice] = useState(() => {
    const label = initialData?.assignedLocation?.label || ""

    if (label.includes("Hyderabad")) return "HYDERABAD"
    if (label.includes("Vizag")) return "VIZAG"

    return ""
  })

  // ───────────────────────────────────────────────────────────
  // WEEK OFF TOGGLE
  // ───────────────────────────────────────────────────────────
  const toggleWeekOff = (day) => {
    setWorkSchedule((prev) => ({
      ...prev,

      weekOff: prev.weekOff.includes(day)
        ? prev.weekOff.filter((d) => d !== day)
        : [...prev.weekOff, day],
    }))
  }

  // ───────────────────────────────────────────────────────────
  // SUBMIT
  // ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const body = Object.fromEntries(formData.entries())

    if (body.date) {
      body.joinDate = body.date
      delete body.date
    }

    if (isEditMode && !body.password) {
      delete body.password
    }

    if (isAdmin) {
      body.workSchedule = workSchedule

      body.assignedLocation =
        enableGeofencing && selectedOffice
          ? OFFICE_LOCATIONS[selectedOffice]
          : {
              label: "",
              latitude: null,
              longitude: null,
              radiusMeters: 100,
            }
    }

    try {
      const url = isEditMode
        ? `/employees/${initialData._id || initialData.id}`
        : "/employees"

      const method = isEditMode ? "put" : "post"

      await api[method](url, body)

      toast.success(
        isEditMode
          ? "Employee updated"
          : "Employee created"
      )

      onSuccess
        ? onSuccess()
        : navigate("/employees")
    } catch (error) {
      toast.error(
        error.response?.data?.error || error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl animate-fade-in"
    >

      {/* PERSONAL INFO */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-medium mb-6 pb-4 border-b border-slate-100 text-slate-900">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">

          <div>
            <label className="block mb-2">
              First Name
            </label>

            <input
              name="firstName"
              required
              defaultValue={initialData?.firstName}
            />
          </div>

          <div>
            <label className="block mb-2">
              Last Name
            </label>

            <input
              name="lastName"
              required
              defaultValue={initialData?.lastName}
            />
          </div>

          <div>
            <label className="block mb-2">
              Phone Number
            </label>

            <input
              name="phone"
              required
              defaultValue={initialData?.phone}
            />
          </div>

          <div>
            <label className="block mb-2">
              Join Date
            </label>

            <input
              type="date"
              name="date"
              required
              defaultValue={
                initialData?.joinDate
                  ? new Date(initialData.joinDate)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-2">
              Bio
            </label>

            <textarea
              name="bio"
              rows={3}
              defaultValue={initialData?.bio}
              className="resize-none"
              placeholder="Brief description..."
            />
          </div>
        </div>
      </div>

      {/* EMPLOYEE DETAILS */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Employee Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-900">

          <div>
            <label className="block mb-2">
              Department
            </label>

            <select
              name="department"
              defaultValue={
                initialData?.department || ""
              }
            >
              <option value="">
                Select Department
              </option>

              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">
              Position
            </label>

            <input
              name="position"
              required
              defaultValue={initialData?.position}
            />
          </div>
        </div>
      </div>

      {/* ATTENDANCE LOCATION */}
      {isAdmin && (
        <div className="card p-5 sm:p-6">

          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">

            <div>
              <h3 className="text-base font-medium text-slate-900">
                Attendance Location
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                Restrict employee attendance
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setEnableGeofencing((v) => !v)
              }
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                enableGeofencing
                  ? "bg-indigo-600"
                  : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                  enableGeofencing
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {enableGeofencing ? (
            <div className="space-y-4 text-sm text-slate-900">

              <div>
                <label className="block mb-2">
                  Select Office
                </label>

                <select
                  value={selectedOffice}
                  onChange={(e) =>
                    setSelectedOffice(e.target.value)
                  }
                >
                  <option value="">
                    Select Office Location
                  </option>

                  <option value="HYDERABAD">
                    Hyderabad Office
                  </option>

                  <option value="VIZAG">
                    Vizag Office
                  </option>
                </select>
              </div>

              {selectedOffice && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                  <div className="flex items-center gap-2 text-indigo-600 font-medium">

                    <MapPinIcon className="w-4 h-4" />

                    {
                      OFFICE_LOCATIONS[selectedOffice]
                        .label
                    }
                  </div>

                  <div className="mt-3 text-xs text-slate-500 space-y-1">

                    <p>
                      Latitude:
                      {" "}
                      {
                        OFFICE_LOCATIONS[selectedOffice]
                          .latitude
                      }
                    </p>

                    <p>
                      Longitude:
                      {" "}
                      {
                        OFFICE_LOCATIONS[selectedOffice]
                          .longitude
                      }
                    </p>

                    <p>
                      Allowed Radius:
                      {" "}
                      {
                        OFFICE_LOCATIONS[selectedOffice]
                          .radiusMeters
                      }m
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 flex items-center gap-2">

              <MapPinOffIcon className="w-4 h-4" />

              No restriction — employee can clock in
              from anywhere
            </p>
          )}
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">

        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            onCancel
              ? onCancel()
              : navigate(-1)
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center justify-center"
        >
          {loading && (
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          )}

          {isEditMode
            ? "Update Employee"
            : "Create Employee"}
        </button>
      </div>
    </form>
  )
}

export default EmployeeForm