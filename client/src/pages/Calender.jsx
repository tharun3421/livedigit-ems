import { useState, useMemo, useEffect, useCallback } from "react"
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon, XIcon, CheckIcon, ShieldIcon, LockIcon, Loader2Icon } from "lucide-react"
import { useAuth } from "../context/authContext"
import api from "../api/axios"

const WEEKDAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

// ─── Holiday Form Modal ───────────────────────────────────────────────────────
const HolidayForm = ({ initial, onSave, onClose, saving }) => {
  const [form, setForm] = useState(initial || { mmdd: "", name: "" })
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.mmdd.match(/^\d{2}-\d{2}$/) && form.name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-100">{initial ? "Edit Holiday" : "Add Holiday"}</h3>
          <button onClick={onClose} disabled={saving} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Date (MM-DD)</label>
            <input
              value={form.mmdd}
              onChange={e => set("mmdd", e.target.value)}
              placeholder="e.g. 08-15"
              maxLength={5}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Holiday Name</label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Independence Day"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid || saving}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              valid && !saving ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400" : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {saving
              ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Saving…</>
              : <><CheckIcon className="w-4 h-4" /> {initial ? "Save Changes" : "Add Holiday"}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = ({ holidays, onAdd, onEdit, onDelete, onClose }) => {
  const [editTarget,    setEditTarget]    = useState(null)
  const [addOpen,       setAddOpen]       = useState(false)
  const [search,        setSearch]        = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(null)
  const [error,         setError]         = useState("")

  const filtered = holidays
    .filter(h => h.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.mmdd.localeCompare(b.mmdd))

  const handleSaveAdd = async (form) => {
    setSaving(true); setError("")
    try {
      await onAdd(form)
      setAddOpen(false)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add holiday")
    } finally { setSaving(false) }
  }

  const handleSaveEdit = async (form) => {
    setSaving(true); setError("")
    try {
      await onEdit({ ...editTarget, ...form })
      setEditTarget(null)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update holiday")
    } finally { setSaving(false) }
  }

  const confirmDelete = async (h) => {
    if (deleteConfirm !== (h._id || h.id)) { setDeleteConfirm(h._id || h.id); return }
    setDeleting(h._id || h.id); setError("")
    try {
      await onDelete(h._id || h.id)
      setDeleteConfirm(null)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete holiday")
    } finally { setDeleting(null) }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <ShieldIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Manage Holidays</h3>
                <p className="text-xs text-slate-500">{holidays.length} holidays</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAddOpen(true); setError("") }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-slate-900 rounded-lg text-xs font-medium hover:bg-cyan-400 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Holiday
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-slate-800 shrink-0">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search holidays…"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl shrink-0">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">
                {holidays.length === 0 ? `No holidays added yet. Click "Add Holiday" to get started.` : "No results found."}
              </p>
            ) : filtered.map(h => (
              <div
                key={h._id || h.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{h.name}</p>
                  <p className="text-xs text-slate-500">
                    {MONTH_NAMES[parseInt(h.mmdd.split("-")[0]) - 1]} {parseInt(h.mmdd.split("-")[1])}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditTarget(h); setError("") }}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => confirmDelete(h)}
                    disabled={deleting === (h._id || h.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      deleteConfirm === (h._id || h.id)
                        ? "bg-red-500/20 text-red-400"
                        : "hover:bg-slate-700 text-slate-400 hover:text-red-400"
                    }`}
                    title={deleteConfirm === (h._id || h.id) ? "Click again to confirm" : "Delete"}
                  >
                    {deleting === (h._id || h.id)
                      ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                      : <TrashIcon className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
                {deleteConfirm === (h._id || h.id) && (
                  <span className="text-xs text-red-400 shrink-0">Confirm?</span>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-slate-800 shrink-0">
            <p className="text-xs text-slate-500 text-center">Hover a row to edit or delete</p>
          </div>
        </div>
      </div>

      {addOpen    && <HolidayForm saving={saving} onSave={handleSaveAdd}  onClose={() => setAddOpen(false)} />}
      {editTarget && <HolidayForm saving={saving} initial={editTarget} onSave={handleSaveEdit} onClose={() => setEditTarget(null)} />}
    </>
  )
}

// ─── Main Calendar ────────────────────────────────────────────────────────────
const TeluguCalendar = () => {
  const today = new Date()
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [viewYear,   setViewYear]   = useState(today.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(today.getMonth())
  const [selected,   setSelected]   = useState(null)
  const [holidays,   setHolidays]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [adminOpen,  setAdminOpen]  = useState(false)
  const [showDenied, setShowDenied] = useState(false)

  // ── Fetch holidays ──
  const fetchHolidays = useCallback(async () => {
    setLoading(true); setFetchError("")
    try {
      const { data } = await api.get("/holidays")
      setHolidays(data)
    } catch (e) {
      setFetchError("Could not load holidays")
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHolidays() }, [fetchHolidays])

  // ── CRUD ──
  const handleAdd = async (form) => {
    const { data } = await api.post("/holidays", form)
    setHolidays(prev => [...prev, data])
  }

  const handleEdit = async (h) => {
    const { data } = await api.put(`/holidays/${h._id || h.id}`, { mmdd: h.mmdd, name: h.name })
    setHolidays(prev => prev.map(x => (x._id || x.id) === (h._id || h.id) ? data : x))
  }

  const handleDelete = async (id) => {
    await api.delete(`/holidays/${id}`)
    setHolidays(prev => prev.filter(x => (x._id || x.id) !== id))
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }
  const goToday   = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelected(null) }

  const openAdmin = () => {
    if (isAdmin) setAdminOpen(true)
    else {
      setShowDenied(true)
      setTimeout(() => setShowDenied(false), 3000)
    }
  }

  const holidayMap = useMemo(() => {
    const map = {}
    holidays.forEach(h => { if (!map[h.mmdd]) map[h.mmdd] = h })
    return map
  }, [holidays])

  const { days } = useMemo(() => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const prevDays    = new Date(viewYear, viewMonth, 0).getDate()
    const cells       = []

    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: prevDays - i, current: false })

    for (let d = 1; d <= daysInMonth; d++) {
      const mmdd    = `${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
      const holiday = holidayMap[mmdd] || null
      const date    = new Date(viewYear, viewMonth, d)
      cells.push({
        day: d, current: true, holiday, mmdd,
        isSun:   date.getDay() === 0,
        isSat:   date.getDay() === 6,
        isToday: d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear(),
      })
    }

    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++)
      cells.push({ day: d, current: false })

    return { days: cells }
  }, [viewYear, viewMonth, holidayMap])

  const monthHolidays = useMemo(() =>
    holidays
      .filter(h => h.mmdd.startsWith(String(viewMonth+1).padStart(2,"0")))
      .sort((a, b) => a.mmdd.localeCompare(b.mmdd)),
    [holidays, viewMonth]
  )

  const selectedCell = selected ? days.find(d => d.current && d.day === selected) : null

  return (
    <div className="max-w-4xl mx-auto pb-10">

      {/* Access Denied Toast */}
      {showDenied && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl shadow-lg backdrop-blur-sm">
          <LockIcon className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Access Denied</p>
            <p className="text-xs text-slate-400">Only admins can manage holidays</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl text-slate-100">Company Calendar</h1>
          <p className="text-sm text-slate-400 mt-1">{MONTH_NAMES[viewMonth]} {viewYear}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button onClick={goToday} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm transition-colors">
            <CalendarDaysIcon className="w-4 h-4" /> Today
          </button>
          <button
            onClick={openAdmin}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              isAdmin
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                : "bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed"
            }`}
            title={isAdmin ? "Manage Holidays" : "Admin access required"}
          >
            {isAdmin ? <ShieldIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
            Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">

          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-slate-100">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Fetch error banner */}
          {fetchError && !loading && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
              <p className="text-xs text-amber-400">{fetchError} — holidays may not be shown</p>
              <button onClick={fetchHolidays} className="text-xs text-cyan-400 hover:underline ml-4 shrink-0">
                Retry
              </button>
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {WEEKDAYS.map(d => (
              <div key={d} className={`py-2.5 text-center text-xs font-semibold tracking-wider uppercase ${
                d === "Sun" ? "text-rose-400" : d === "Sat" ? "text-indigo-400" : "text-slate-500"
              }`}>{d}</div>
            ))}
          </div>

          {/* Loading spinner or grid — grid always renders after load */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2Icon className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading holidays…</span>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((cell, i) => {
                const isSelected = cell.current && cell.day === selected
                return (
                  <button
                    key={i}
                    onClick={() => cell.current && setSelected(isSelected ? null : cell.day)}
                    disabled={!cell.current}
                    className={`
                      relative min-h-[64px] sm:min-h-[76px] p-2 text-left border-b border-r border-slate-800/60 transition-colors
                      ${!cell.current ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-slate-800/50"}
                      ${isSelected ? "bg-cyan-500/10 ring-inset ring-1 ring-cyan-500/30" : ""}
                      ${cell.isToday && !isSelected ? "bg-indigo-500/10" : ""}
                    `}
                  >
                    <span className={`
                      inline-flex w-6 h-6 sm:w-7 sm:h-7 items-center justify-center rounded-full text-xs sm:text-sm font-medium
                      ${cell.isToday   ? "bg-indigo-500 text-white font-bold" :
                        isSelected     ? "bg-cyan-500 text-slate-900 font-bold" :
                        cell.isSun     ? "text-rose-400" :
                        cell.isSat     ? "text-indigo-400" : "text-slate-300"}
                    `}>
                      {cell.day}
                    </span>
                    {cell.holiday && (
                      <p className="mt-0.5 text-[9px] sm:text-[10px] leading-tight text-cyan-400 hidden sm:block truncate">
                        {cell.holiday.name}
                      </p>
                    )}
                    {cell.holiday && (
                      <span className="sm:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                    {cell.isToday && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">

          {/* Selected day info */}
          {selectedCell ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-cyan-400">{selectedCell.day}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {MONTH_NAMES[viewMonth]} {selectedCell.day}, {viewYear}
                  </p>
                  <p className="text-xs text-slate-500">
                    {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(viewYear, viewMonth, selectedCell.day).getDay()]}
                  </p>
                </div>
              </div>
              {selectedCell.holiday ? (
                <div className="rounded-xl p-3 bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-sm font-semibold text-cyan-400">{selectedCell.holiday.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Company Holiday</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No holiday on this day</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {today.getDate()} {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
                  </p>
                  <p className="text-xs text-slate-500">Click any date to see details</p>
                </div>
              </div>
            </div>
          )}

          {/* Holidays this month */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {MONTH_NAMES[viewMonth]} Holidays
              <span className="ml-2 text-slate-600 normal-case font-normal">({monthHolidays.length})</span>
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 py-2">
                <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : monthHolidays.length === 0 ? (
              <p className="text-sm text-slate-500">No holidays this month</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {monthHolidays.map(h => {
                  const id  = h._id || h.id
                  const day = parseInt(h.mmdd.split("-")[1])
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(day)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        selected === day ? "bg-cyan-500/10 ring-1 ring-cyan-500/20" : "hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">{day}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{h.name}</p>
                        <p className="text-[10px] text-slate-500">{MONTH_NAMES[viewMonth]} {day}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-xs text-slate-400">Company Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-xs text-slate-400">Today</span>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800">
                <span className="text-xs font-bold text-rose-400 w-2.5 text-center">S</span>
                <span className="text-xs text-slate-400">Sunday</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 w-2.5 text-center">S</span>
                <span className="text-xs text-slate-400">Saturday</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {adminOpen && isAdmin && (
        <AdminPanel
          holidays={holidays}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  )
}

export default TeluguCalendar