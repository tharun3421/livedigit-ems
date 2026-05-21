import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading"
import CheckinButton from "../components/attendance/CheckinButton"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import api from "../api/axios"
import toast from "react-hot-toast"

const Attendance = () => {
  const [history,          setHistory]          = useState([])
  const [assignedLocation, setAssignedLocation] = useState(null)   // ← new
  const [loading,          setLoading]          = useState(true)
  const [isDeleted,        setDeleted]          = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch attendance + profile in parallel
      const [attRes, profileRes] = await Promise.all([
        api.get("/attendance"),
        api.get("/profile"),
      ])

      const json = attRes.data
      setHistory(json.data || [])
      if (json.employee?.isDeleted) setDeleted(true)

      // Only set assignedLocation if the employee actually has one
      const loc = profileRes.data?.assignedLocation
      const hasLocation = loc?.latitude != null && loc?.longitude != null
      setAssignedLocation(hasLocation ? loc : null)

    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <Loading />

  const todayStr    = new Date().toLocaleDateString("en-CA")
  const todayRecord = history.find(
    (r) => new Date(r.date).toLocaleDateString("en-CA") === todayStr
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="text-slate-100 text-3xl">Attendance</h1>
        <p className="page-subtitle">Track your work hours and daily check-ins</p>
      </div>

      {isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p>You can no longer clock in or out because your employee records have been marked as deleted.</p>
        </div>
      ) : (
        <div className="mb-8">
          <CheckinButton
            todayRecord={todayRecord}
            onAction={fetchData}
            assignedLocation={assignedLocation}  // ← was missing, caused the 403
          />
        </div>
      )}

      <AttendanceStats   history={history} />
      <AttendanceHistory history={history} />
    </div>
  )
}

export default Attendance