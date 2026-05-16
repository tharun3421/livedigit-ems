
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