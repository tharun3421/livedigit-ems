import { Loader2Icon, LogInIcon, LogOutIcon, MapPinIcon, MapPinOffIcon } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R     = 6371000
    const toRad = (deg) => (deg * Math.PI) / 180
    const dLat  = toRad(lat2 - lat1)
    const dLon  = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocation is not supported by your browser.")
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        reject("Location permission denied. Please allow location access and try again.")
                        break
                    case err.POSITION_UNAVAILABLE:
                        reject("Location unavailable. Please check your GPS or network.")
                        break
                    case err.TIMEOUT:
                        reject("Location request timed out. Please try again.")
                        break
                    default:
                        reject("Unable to retrieve your location.")
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    })

// ─── Component ────────────────────────────────────────────────────────────────
// Props:
//   todayRecord      — today's attendance record (from parent)
//   onAction         — callback after successful clock in/out
//   assignedLocation — from employee profile: { latitude, longitude, radiusMeters, label }
//                      Pass null/undefined if no location is assigned (unrestricted)

const CheckinButton = ({ todayRecord, onAction, assignedLocation }) => {
    const [loading, setLoading]               = useState(false)
    const [locationStatus, setLocationStatus] = useState(null)

    const handleAttendance = async () => {
        setLoading(true)

        const hasAssignedLocation =
            assignedLocation?.latitude  != null &&
            assignedLocation?.longitude != null

        try {
            let coords = null

            if (hasAssignedLocation) {
                // ── Assigned location: verify proximity before submitting ──
                setLocationStatus("checking")

                try {
                    coords = await getCurrentPosition()
                } catch (locationError) {
                    setLocationStatus("denied")
                    toast.error(locationError, { duration: 6000 })
                    return
                }

                const distance = getDistanceMeters(
                    coords.latitude,
                    coords.longitude,
                    assignedLocation.latitude,
                    assignedLocation.longitude
                )

                const radius = assignedLocation.radiusMeters ?? 100

                if (distance > radius) {
                    setLocationStatus("out-of-range")
                    toast.error(
                        `You are ${Math.round(distance)}m away from ${assignedLocation.label || "your assigned location"}. ` +
                        `You must be within ${radius}m to clock in/out.`,
                        { duration: 5000 }
                    )
                    return
                }

                setLocationStatus("ok")
            } else {
                // ── No assigned location: still try to get coords (optional) ──
                // Attempt silently; don't block if it fails
                try {
                    coords = await getCurrentPosition()
                } catch {
                    coords = null
                }
            }

            // FIX: only send coords if we actually have them; never send an empty {}
            const body = coords ?? undefined
            await api.post("/attendance", body)
            await onAction()

        } catch (error) {
            const serverMsg = error?.response?.data?.error || error?.message
            const status    = error?.response?.status

            // FIX: detect server-side "location required" errors and show a clear toast
            const isLocationError =
                status === 400 &&
                serverMsg &&
                /(location|latitude|longitude|coords)/i.test(serverMsg)

            if (isLocationError) {
                setLocationStatus("denied")
                toast.error(
                    "Location data is required to clock in/out. Please enable location access and try again.",
                    { duration: 6000 }
                )
            } else {
                toast.error(serverMsg || "Something went wrong. Please try again.", { duration: 5000 })
            }

            if (status === 403) setLocationStatus("out-of-range")
        } finally {
            setLoading(false)
        }
    }

    if (todayRecord?.checkOut) {
        return (
            <div className='flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200'>
                <h3 className='text-lg font-bold text-slate-900'>Work Day Completed</h3>
                <p className='text-slate-500 text-sm mt-1'>Great job! See you tomorrow</p>
            </div>
        )
    }

    const isCheckedIn = !!todayRecord?.checkIn

    const LocationBadge = () => {
        if (!locationStatus) return null
        const configs = {
            checking:       { icon: <MapPinIcon    className="w-3.5 h-3.5 animate-pulse" />, text: "Verifying location…",                                         cls: "bg-yellow-100 text-yellow-700" },
            ok:             { icon: <MapPinIcon    className="w-3.5 h-3.5" />,               text: "Location verified ✓",                                         cls: "bg-green-100  text-green-700"  },
            denied:         { icon: <MapPinOffIcon className="w-3.5 h-3.5" />,               text: "Location access denied",                                      cls: "bg-red-100    text-red-700"    },
            "out-of-range": { icon: <MapPinOffIcon className="w-3.5 h-3.5" />,               text: `Not near ${assignedLocation?.label || "assigned location"}`,  cls: "bg-red-100    text-red-700"    },
        }
        const c = configs[locationStatus]
        return (
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2 self-end ${c.cls}`}>
                {c.icon} {c.text}
            </div>
        )
    }

    return (
        <div className='absolute bottom-4 right-4 flex flex-col items-end z-1'>
            <LocationBadge />

            {assignedLocation?.label && !locationStatus && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2 bg-slate-100 text-slate-500">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    Must be at: {assignedLocation.label}
                </div>
            )}

            <button
                onClick={handleAttendance}
                disabled={loading}
                className={`w-full max-w-xs flex justify-between items-center gap-8 p-4 rounded-xl bg-linear-to-br text-white transition-opacity ${
                    loading ? "opacity-70 cursor-not-allowed" : "opacity-100"
                } ${isCheckedIn ? "from-slate-700 to-slate-900" : "from-indigo-600 to-indigo-700"}`}
            >
                {loading
                    ? locationStatus === "checking"
                        ? <MapPinIcon  className='size-7 animate-pulse' />
                        : <Loader2Icon className='size-7 animate-spin'  />
                    : isCheckedIn
                        ? <LogOutIcon  className='size-7' />
                        : <LogInIcon   className='size-7' />
                }
                <div className='flex flex-col items-center text-center'>
                    <h2 className='text-lg font-medium mb-1'>
                        {loading
                            ? locationStatus === "checking" ? "Locating…" : "Processing…"
                            : isCheckedIn ? "Clock Out" : "Clock In"}
                    </h2>
                    <p className='text-xs opacity-80'>
                        {isCheckedIn ? "Click to end your shift" : "Start your work day"}
                    </p>
                </div>
            </button>
        </div>
    )
}

export default CheckinButton