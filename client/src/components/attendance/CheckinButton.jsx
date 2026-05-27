import { Loader2Icon, LogInIcon, LogOutIcon, MapPinIcon, MapPinOffIcon } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

// ─── Geo Helpers ──────────────────────────────────────────────────────────────

const toRad = (deg) => (deg * Math.PI) / 180

const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R    = 6371000
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a    =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const GEO_ERRORS = {
    1: 'Location permission denied. Please allow location access and try again.',
    2: 'Location unavailable. Please check your GPS or network.',
    3: 'Location request timed out. Please try again.',
}

const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation is not supported by your browser.')
            return
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
            (err)        => reject(GEO_ERRORS[err.code] ?? 'Unable to retrieve your location.'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    })

// ─── Location Badge ───────────────────────────────────────────────────────────

const BADGE_CONFIG = {
    checking:       { Icon: MapPinIcon,    text: 'Verifying location…',    cls: 'bg-yellow-100 text-yellow-700' },
    ok:             { Icon: MapPinIcon,    text: 'Location verified ✓',    cls: 'bg-green-100 text-green-700'   },
    denied:         { Icon: MapPinOffIcon, text: 'Location access denied', cls: 'bg-red-100 text-red-700'       },
    'out-of-range': { Icon: MapPinOffIcon, text: null,                     cls: 'bg-red-100 text-red-700'       },
}

const LocationBadge = ({ status, locationLabel }) => {
    if (!status) return null
    const { Icon, text, cls } = BADGE_CONFIG[status]
    return (
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2 self-end ${cls}`}>
            <Icon className='w-3.5 h-3.5' />
            {text ?? `Not near ${locationLabel || 'assigned location'}`}
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

const CheckinButton = ({ todayRecord, onAction, assignedLocation }) => {
    const [loading,        setLoading]        = useState(false)
    const [locationStatus, setLocationStatus] = useState(null)

    const hasAssignedLocation =
        assignedLocation?.latitude != null && assignedLocation?.longitude != null

    const handleAttendance = async () => {
        setLoading(true)
        let coords = null

        try {
            if (hasAssignedLocation) {
                setLocationStatus('checking')

                try {
                    coords = await getCurrentPosition()
                } catch (err) {
                    setLocationStatus('denied')
                    toast.error(err, { duration: 6000 })
                    return
                }

                const radius   = assignedLocation.radiusMeters ?? 100
                const distance = getDistanceMeters(
                    coords.latitude,  coords.longitude,
                    assignedLocation.latitude, assignedLocation.longitude
                )

                if (distance > radius) {
                    setLocationStatus('out-of-range')
                    toast.error(
                        `You are ${Math.round(distance)}m away from ` +
                        `${assignedLocation.label || 'your assigned location'}. ` +
                        `You must be within ${radius}m to clock in/out.`,
                        { duration: 5000 }
                    )
                    return
                }

                setLocationStatus('ok')
            } else {
                try { coords = await getCurrentPosition() } catch { /* optional */ }
            }

            await api.post('/attendance', coords ?? undefined)
            await onAction()

        } catch (err) {
            const msg    = err?.response?.data?.error || err?.message
            const status = err?.response?.status
            const isLocationError =
                status === 400 && msg && /(location|latitude|longitude|coords)/i.test(msg)

            if (isLocationError) {
                setLocationStatus('denied')
                toast.error(
                    'Location data is required to clock in/out. Please enable location access and try again.',
                    { duration: 6000 }
                )
            } else {
                toast.error(msg || 'Something went wrong. Please try again.', { duration: 5000 })
            }

            if (status === 403) setLocationStatus('out-of-range')
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

    const buttonLabel = loading
        ? locationStatus === 'checking' ? 'Locating…' : 'Processing…'
        : isCheckedIn ? 'Clock Out' : 'Clock In'

    const ButtonIcon = () => {
        if (loading) return locationStatus === 'checking'
            ? <MapPinIcon  className='size-7 animate-pulse' />
            : <Loader2Icon className='size-7 animate-spin'  />
        return isCheckedIn
            ? <LogOutIcon className='size-7' />
            : <LogInIcon  className='size-7' />
    }

    return (
        <div className='absolute bottom-4 right-4 flex flex-col items-end z-1'>
            <LocationBadge status={locationStatus} locationLabel={assignedLocation?.label} />

            {assignedLocation?.label && !locationStatus && (
                <div className='flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2 bg-slate-100 text-slate-500'>
                    <MapPinIcon className='w-3.5 h-3.5' />
                    Must be at: {assignedLocation.label}
                </div>
            )}

            <button
                onClick={handleAttendance}
                disabled={loading}
                className={`w-full max-w-xs flex justify-between items-center gap-8 p-4 rounded-xl bg-linear-to-br text-white transition-opacity ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'opacity-100'
                } ${isCheckedIn ? 'from-slate-700 to-slate-900' : 'from-indigo-600 to-indigo-700'}`}
            >
                <ButtonIcon />
                <div className='flex flex-col items-center text-center'>
                    <h2 className='text-lg font-medium mb-1'>{buttonLabel}</h2>
                    <p className='text-xs opacity-80'>
                        {isCheckedIn ? 'Click to end your shift' : 'Start your work day'}
                    </p>
                </div>
            </button>
        </div>
    )
}

export default CheckinButton