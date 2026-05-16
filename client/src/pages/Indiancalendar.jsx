import { useState, useMemo } from "react"
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from "lucide-react"

// ─── Indian National Holidays & Festivals (Gregorian dates) ──────────────────
const INDIAN_HOLIDAYS = {
    "01-26": { name: "Republic Day",          type: "national",  icon: "🇮🇳" },
    "03-17": { name: "Holi",                  type: "festival",  icon: "🎨" },
    "04-14": { name: "Dr. Ambedkar Jayanti",  type: "national",  icon: "🎗️" },
    "04-18": { name: "Good Friday",           type: "festival",  icon: "✝️"  },
    "05-01": { name: "Labour Day",            type: "national",  icon: "⚒️" },
    "06-07": { name: "Eid ul-Fitr",           type: "festival",  icon: "🌙" },
    "08-15": { name: "Independence Day",      type: "national",  icon: "🇮🇳" },
    "08-16": { name: "Janmashtami",           type: "festival",  icon: "🦚" },
    "08-27": { name: "Ganesh Chaturthi",      type: "festival",  icon: "🐘" },
    "10-02": { name: "Gandhi Jayanti",        type: "national",  icon: "🕊️" },
    "10-02": { name: "Gandhi Jayanti",        type: "national",  icon: "🕊️" },
    "10-13": { name: "Dussehra",              type: "festival",  icon: "🏹" },
    "11-01": { name: "Diwali",                type: "festival",  icon: "🪔" },
    "11-02": { name: "Govardhan Puja",        type: "festival",  icon: "🪔" },
    "11-05": { name: "Guru Nanak Jayanti",    type: "festival",  icon: "🙏" },
    "12-25": { name: "Christmas",             type: "festival",  icon: "🎄" },
}

// ─── Indian Saka Calendar month names ────────────────────────────────────────
const SAKA_MONTHS = [
    "Chaitra","Vaisakha","Jyaishtha","Ashadha",
    "Shravana","Bhadra","Asvina","Kartika",
    "Agrahayana","Pausha","Magha","Phalguna"
]

// Approximate Gregorian → Saka conversion
const gregorianToSaka = (year, month, day) => {
    // Saka year = Gregorian year - 78 (after March 22)
    const isAfterMarch22 = month > 3 || (month === 3 && day >= 22)
    const sakaYear  = isAfterMarch22 ? year - 78 : year - 79

    // Saka month mapping (approximate)
    const monthMap = [10, 11, 12, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const sakaMonth = SAKA_MONTHS[
        month === 3 && day >= 22 ? 0 :
        month === 4              ? 1 :
        month === 5              ? 2 :
        month === 6              ? 3 :
        month === 7              ? 4 :
        month === 8              ? 5 :
        month === 9              ? 6 :
        month === 10             ? 7 :
        month === 11             ? 8 :
        month === 12             ? 9 :
        month === 1              ? 10 :
        month === 2              ? 11 : 0
    ]
    return { sakaYear, sakaMonth }
}

const WEEKDAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

// ─── Main Component ───────────────────────────────────────────────────────────
const IndianCalendar = () => {
    const today = new Date()
    const [viewYear,  setViewYear]  = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed
    const [selected,  setSelected]  = useState(null)

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
        else setViewMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
        else setViewMonth(m => m + 1)
    }
    const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelected(null) }

    // Build calendar grid
    const { days, sakaInfo } = useMemo(() => {
        const firstDay   = new Date(viewYear, viewMonth, 1).getDay()
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
        const prevDays   = new Date(viewYear, viewMonth, 0).getDate()

        const cells = []

        // Prev month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            cells.push({ day: prevDays - i, current: false, next: false })
        }
        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            const mmdd   = `${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
            const holiday = INDIAN_HOLIDAYS[mmdd] || null
            const date   = new Date(viewYear, viewMonth, d)
            const isSun  = date.getDay() === 0
            const isSat  = date.getDay() === 6
            const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
            cells.push({ day: d, current: true, next: false, holiday, isSun, isSat, isToday, mmdd })
        }
        // Next month leading days
        const remaining = 42 - cells.length
        for (let d = 1; d <= remaining; d++) {
            cells.push({ day: d, current: false, next: true })
        }

        // Saka info for the 1st of this month
        const saka = gregorianToSaka(viewYear, viewMonth + 1, 1)

        return { days: cells, sakaInfo: saka }
    }, [viewYear, viewMonth])

    // Holidays this month
    const monthHolidays = useMemo(() => {
        return Object.entries(INDIAN_HOLIDAYS)
            .filter(([key]) => key.startsWith(String(viewMonth + 1).padStart(2,"0")))
            .sort(([a], [b]) => a.localeCompare(b))
    }, [viewMonth])

    const selectedCell = selected
        ? days.find(d => d.current && d.day === selected)
        : null

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl text-slate-100">Calendar</h1>
                    <p className="page-subtitle mt-1">
                        {SAKA_MONTHS[viewMonth === 0 ? 10 : viewMonth - 1] ?? sakaInfo.sakaMonth} {sakaInfo.sakaYear} Saka Era
                        · Indian National Calendar
                    </p>
                </div>
                <button
                    onClick={goToday}
                    className="btn-secondary text-sm self-start sm:self-auto flex items-center gap-2"
                >
                    <CalendarDaysIcon className="w-4 h-4" /> Today
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Calendar Grid ── */}
                <div className="lg:col-span-2 card overflow-hidden">

                    {/* Month nav */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-slate-100">
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {sakaInfo.sakaMonth} {sakaInfo.sakaYear} Saka
                            </p>
                        </div>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-slate-800">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className={`py-2.5 text-center text-xs font-semibold tracking-wider uppercase ${
                                d === "Sun" ? "text-rose-400" :
                                d === "Sat" ? "text-indigo-400" : "text-slate-500"
                            }`}>{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7">
                        {days.map((cell, i) => {
                            const isSelected = cell.current && cell.day === selected
                            return (
                                <button
                                    key={i}
                                    onClick={() => cell.current && setSelected(isSelected ? null : cell.day)}
                                    disabled={!cell.current}
                                    className={`
                                        relative min-h-15 sm:min-h-18 p-1.5 sm:p-2 text-left border-b border-r border-slate-800/60
                                        transition-colors duration-150
                                        ${!cell.current ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-slate-800/50"}
                                        ${isSelected ? "bg-indigo-600/20 border-indigo-500/40" : ""}
                                        ${cell.isToday && !isSelected ? "bg-indigo-500/10" : ""}
                                    `}
                                >
                                    {/* Day number */}
                                    <span className={`
                                        inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium
                                        ${cell.isToday ? "bg-indigo-500 text-white font-bold" :
                                          isSelected   ? "bg-indigo-400 text-white" :
                                          cell.isSun   ? "text-rose-400" :
                                          cell.isSat   ? "text-indigo-400" : "text-slate-300"}
                                    `}>
                                        {cell.day}
                                    </span>

                                    {/* Holiday indicator */}
                                    {cell.holiday && (
                                        <div className="mt-1">
                                            <span className="text-[10px] leading-tight block truncate" title={cell.holiday.name}>
                                                {cell.holiday.icon} <span className={`${
                                                    cell.holiday.type === "national" ? "text-orange-400" : "text-yellow-400"
                                                } hidden sm:inline`}>{cell.holiday.name}</span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Today dot */}
                                    {cell.isToday && (
                                        <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="space-y-4">

                    {/* Selected day detail */}
                    {selectedCell ? (
                        <div className="card p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                                    <span className="text-xl font-bold text-indigo-400">{selectedCell.day}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">
                                        {MONTH_NAMES[viewMonth]} {selectedCell.day}, {viewYear}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][
                                            new Date(viewYear, viewMonth, selectedCell.day).getDay()
                                        ]}
                                    </p>
                                </div>
                            </div>

                            {selectedCell.holiday ? (
                                <div className={`rounded-xl p-3 ${
                                    selectedCell.holiday.type === "national"
                                        ? "bg-orange-500/10 border border-orange-500/20"
                                        : "bg-yellow-500/10 border border-yellow-500/20"
                                }`}>
                                    <p className="text-lg">{selectedCell.holiday.icon}</p>
                                    <p className={`text-sm font-semibold mt-1 ${
                                        selectedCell.holiday.type === "national" ? "text-orange-300" : "text-yellow-300"
                                    }`}>{selectedCell.holiday.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{selectedCell.holiday.type} holiday</p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No holidays or festivals</p>
                            )}

                            {/* Saka date */}
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-xs text-slate-500 mb-1">Indian National Calendar</p>
                                <p className="text-sm text-slate-300">
                                    {gregorianToSaka(viewYear, viewMonth + 1, selectedCell.day).sakaMonth}{" "}
                                    {gregorianToSaka(viewYear, viewMonth + 1, selectedCell.day).sakaYear} Saka
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                                    <CalendarDaysIcon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">
                                        {today.getDate()} {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
                                    </p>
                                    <p className="text-xs text-slate-500">Today</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">Click a date to see details</p>
                        </div>
                    )}

                    {/* Holidays this month */}
                    <div className="card p-5">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            {MONTH_NAMES[viewMonth]} Holidays
                        </h3>
                        {monthHolidays.length === 0 ? (
                            <p className="text-sm text-slate-500">No holidays this month</p>
                        ) : (
                            <div className="space-y-2">
                                {monthHolidays.map(([key, h]) => {
                                    const day = parseInt(key.split("-")[1])
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelected(day)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                                                selected === day ? "bg-indigo-500/15" : "hover:bg-slate-800/50"
                                            }`}
                                        >
                                            <span className="text-xl shrink-0">{h.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">{h.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {MONTH_NAMES[viewMonth]} {day} ·{" "}
                                                    <span className={h.type === "national" ? "text-orange-400" : "text-yellow-400"}>
                                                        {h.type}
                                                    </span>
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="card p-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                                <span className="text-slate-400">Today</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-rose-400 font-bold shrink-0">S</span>
                                <span className="text-slate-400">Sunday</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-400 font-bold shrink-0">S</span>
                                <span className="text-slate-400">Saturday</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="shrink-0">🇮🇳</span>
                                <span className="text-orange-400">National Holiday</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="shrink-0">🪔</span>
                                <span className="text-yellow-400">Festival</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IndianCalendar