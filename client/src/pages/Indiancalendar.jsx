import { useState, useMemo } from "react"
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from "lucide-react"

// ─── All Holidays: Telugu + National + International (2025) ──────────────────
const HOLIDAYS = {
  // ── January ──
  "01-01": { name: "New Year's Day",            type: "international", icon: "🎆" },
  "01-13": { name: "Bhogi",                     type: "telugu",        icon: "🔥" },
  "01-14": { name: "Makar Sankranti",           type: "telugu",        icon: "🪁" },
  "01-15": { name: "Kanuma",                    type: "telugu",        icon: "🐄" },
  "01-16": { name: "Mukkanuma",                 type: "telugu",        icon: "🐂" },
  "01-26": { name: "Republic Day",              type: "national",      icon: "🇮🇳" },

  // ── February ──
  "02-02": { name: "World Wetlands Day",        type: "international", icon: "🌿" },
  "02-04": { name: "World Cancer Day",          type: "international", icon: "🎗️" },
  "02-14": { name: "Valentine's Day",           type: "international", icon: "❤️"  },
  "02-26": { name: "Maha Shivaratri",           type: "telugu",        icon: "🕉️" },
  "02-28": { name: "National Science Day",      type: "national",      icon: "🔬" },

  // ── March ──
  "03-08": { name: "International Women's Day", type: "international", icon: "👩" },
  "03-14": { name: "Holi",                      type: "national",      icon: "🎨" },
  "03-20": { name: "World Sparrow Day",         type: "international", icon: "🐦" },
  "03-22": { name: "World Water Day",           type: "international", icon: "💧" },
  "03-30": { name: "Ugadi (Telugu New Year)",   type: "telugu",        icon: "🌸" },
  "03-31": { name: "Ramzan / Id-ul-Fitr",       type: "national",      icon: "🌙" },

  // ── April ──
  "04-01": { name: "April Fool's Day",          type: "international", icon: "🤡" },
  "04-06": { name: "Sri Rama Navami",           type: "telugu",        icon: "🏹" },
  "04-07": { name: "World Health Day",          type: "international", icon: "🏥" },
  "04-10": { name: "Mahavir Jayanti",           type: "national",      icon: "🙏" },
  "04-14": { name: "Dr. Ambedkar Jayanti",      type: "national",      icon: "📖" },
  "04-18": { name: "Good Friday",               type: "national",      icon: "✝️"  },
  "04-20": { name: "Easter Sunday",             type: "international", icon: "🐣" },
  "04-22": { name: "Earth Day",                 type: "international", icon: "🌍" },

  // ── May ──
  "05-01": { name: "Labour Day / May Day",      type: "national",      icon: "⚒️" },
  "05-04": { name: "World Press Freedom Day",   type: "international", icon: "📰" },
  "05-11": { name: "Buddha Purnima",            type: "national",      icon: "☸️" },
  "05-12": { name: "Mother's Day",              type: "international", icon: "🌷" },

  // ── June ──
  "06-01": { name: "World Milk Day",            type: "international", icon: "🥛" },
  "06-05": { name: "World Environment Day",     type: "international", icon: "🌱" },
  "06-07": { name: "Eid ul-Adha (Bakrid)",      type: "national",      icon: "🌙" },
  "06-15": { name: "Father's Day",              type: "international", icon: "👨" },
  "06-21": { name: "World Yoga Day",            type: "international", icon: "🧘" },
  "06-26": { name: "World Anti-Drug Day",       type: "international", icon: "🚫" },

  // ── July ──
  "07-01": { name: "National Doctor's Day",     type: "national",      icon: "👨‍⚕️" },
  "07-06": { name: "Muharram",                  type: "national",      icon: "🌙" },
  "07-07": { name: "Bonalu (Hyderabad)",         type: "telugu",        icon: "🏺" },
  "07-11": { name: "World Population Day",      type: "international", icon: "👥" },
  "07-18": { name: "Nelson Mandela Day",        type: "international", icon: "✊" },

  // ── August ──
  "08-09": { name: "Varalakshmi Vratam",        type: "telugu",        icon: "🪷" },
  "08-12": { name: "World Elephant Day",        type: "international", icon: "🐘" },
  "08-15": { name: "Independence Day",          type: "national",      icon: "🇮🇳" },
  "08-16": { name: "Janmashtami",               type: "telugu",        icon: "🦚" },
  "08-19": { name: "World Photography Day",     type: "international", icon: "📷" },
  "08-27": { name: "Ganesh Chaturthi",          type: "telugu",        icon: "🐘" },

  // ── September ──
  "09-05": { name: "Teachers' Day",             type: "national",      icon: "📚" },
  "09-16": { name: "World Ozone Day",           type: "international", icon: "🌐" },
  "09-21": { name: "World Alzheimer's Day",     type: "international", icon: "🧠" },
  "09-25": { name: "World Pharmacists' Day",    type: "international", icon: "💊" },

  // ── October ──
  "10-01": { name: "World Vegetarian Day",      type: "international", icon: "🥗" },
  "10-02": { name: "Gandhi Jayanti",            type: "national",      icon: "🕊️" },
  "10-02": { name: "Navaratri Begins",          type: "telugu",        icon: "🪔" },
  "10-04": { name: "World Animal Day",          type: "international", icon: "🐾" },
  "10-10": { name: "World Mental Health Day",   type: "international", icon: "🧠" },
  "10-12": { name: "Dussehra / Vijaya Dashami",type: "telugu",        icon: "🏹" },
  "10-16": { name: "World Food Day",            type: "international", icon: "🌾" },
  "10-20": { name: "Milad-un-Nabi",             type: "national",      icon: "🌙" },
  "10-21": { name: "Deepavali (Diwali)",        type: "telugu",        icon: "🪔" },
  "10-22": { name: "Bali Padyami",              type: "telugu",        icon: "🌺" },
  "10-24": { name: "Bhratru Dwitiya",           type: "telugu",        icon: "👫" },
  "10-31": { name: "Halloween",                 type: "international", icon: "🎃" },
  "10-31": { name: "Sardar Patel Jayanti",      type: "national",      icon: "🏛️" },

  // ── November ──
  "11-01": { name: "AP / TS Formation Day",     type: "telugu",        icon: "📅" },
  "11-05": { name: "Guru Nanak Jayanti",        type: "national",      icon: "🙏" },
  "11-14": { name: "Children's Day",            type: "national",      icon: "🧒" },
  "11-20": { name: "Karthika Purnima",          type: "telugu",        icon: "🪔" },

  // ── December ──
  "12-01": { name: "World AIDS Day",            type: "international", icon: "🎗️" },
  "12-03": { name: "World Disability Day",      type: "international", icon: "♿" },
  "12-10": { name: "Human Rights Day",          type: "international", icon: "✊" },
  "12-22": { name: "National Mathematics Day",  type: "national",      icon: "➗" },
  "12-25": { name: "Christmas",                 type: "international", icon: "🎄" },
  "12-31": { name: "New Year's Eve",            type: "international", icon: "🎆" },
}

// ─── Telugu Panchanga months (English) ───────────────────────────────────────
const TELUGU_MONTHS_EN = [
  "Chaitra","Vaisakha","Jyaishtha","Ashadha",
  "Shravana","Bhadrapada","Ashwayuja","Karthika",
  "Margashira","Pushya","Magha","Phalguna",
]

const SAMVATSARAS = [
  "Prabhava","Vibhava","Shukla","Pramoda","Prajapati",
  "Angirasa","Srimukha","Bhava","Yuva","Dhata",
  "Ishvara","Bahudhanya","Pramadi","Vikrama","Vrisha",
  "Chitrabhanu","Svabhanu","Tarana","Parthiva","Vyaya",
  "Sarvajit","Sarvadharin","Virodhi","Vikruti","Khara",
  "Nandana","Vijaya","Jaya","Manmatha","Durmukhi",
  "Hevilambi","Vilambi","Vikari","Sharvari","Plava",
  "Shubhakrut","Shobhakrut","Krodhi","Vishvavasu","Parabhava",
  "Plavanga","Keelaka","Saumya","Sadharana","Virodhakrut",
  "Paridhavi","Pramadicha","Ananda","Rakshasa","Nala",
  "Pingala","Kalayukti","Siddharthi","Raudri","Durmati",
  "Dundubhi","Rudhirodgari","Raktakshi","Krodhana","Akshaya",
]

const gregorianToTelugu = (year, month, day) => {
  const isAfterUgadi = month > 3 || (month === 3 && day >= 30)
  const teluguYear   = isAfterUgadi ? year - 78 : year - 79
  const samvatsara   = SAMVATSARAS[(teluguYear - 1) % 60]
  const idx =
    (month === 3 && day >= 30) || month === 4 ? 0 :
    month === 5  ? 1 : month === 6  ? 2 : month === 7  ? 3 :
    month === 8  ? 4 : month === 9  ? 5 : month === 10 ? 6 :
    month === 11 ? 7 : month === 12 ? 8 : month === 1  ? 9 :
    month === 2  ? 10 : 11
  return { teluguYear, samvatsara, teluguMonth: TELUGU_MONTHS_EN[idx] }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKDAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

const TYPE_CONFIG = {
  telugu:        { label: "Telugu Festival",    color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20",   dot: "bg-yellow-400"  },
  national:      { label: "National Holiday",   color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20",   dot: "bg-orange-400"  },
  international: { label: "International Day",  color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/20",   dot: "bg-indigo-400"  },
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TeluguCalendar = () => {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState("all")

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelected(null) }

  const { days, teluguInfo } = useMemo(() => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const prevDays    = new Date(viewYear, viewMonth, 0).getDate()
    const cells       = []

    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: prevDays - i, current: false })

    for (let d = 1; d <= daysInMonth; d++) {
      const mmdd   = `${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
      const holiday = HOLIDAYS[mmdd] || null
      const date   = new Date(viewYear, viewMonth, d)
      cells.push({
        day: d, current: true, holiday,
        isSun: date.getDay() === 0, isSat: date.getDay() === 6,
        isToday: d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear(),
        mmdd,
      })
    }

    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++)
      cells.push({ day: d, current: false })

    return { days: cells, teluguInfo: gregorianToTelugu(viewYear, viewMonth + 1, 1) }
  }, [viewYear, viewMonth])

  const monthHolidays = useMemo(() => {
    return Object.entries(HOLIDAYS)
      .filter(([k, h]) => {
        const inMonth = k.startsWith(String(viewMonth + 1).padStart(2,"0"))
        return inMonth && (filter === "all" || h.type === filter)
      })
      .sort(([a],[b]) => a.localeCompare(b))
  }, [viewMonth, filter])

  const selectedCell = selected ? days.find(d => d.current && d.day === selected) : null

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl text-slate-100">Calendar</h1>
          <p className="page-subtitle mt-1">
            {teluguInfo.samvatsara} Samvatsara · {teluguInfo.teluguYear} · {teluguInfo.teluguMonth} masa
          </p>
        </div>
        <button onClick={goToday} className="btn-secondary text-sm self-start sm:self-auto flex items-center gap-2">
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
              <p className="text-xs text-yellow-500/80 mt-0.5">
                {teluguInfo.teluguMonth} · {teluguInfo.samvatsara}
              </p>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {WEEKDAYS.map(d => (
              <div key={d} className={`py-2.5 text-center text-xs font-semibold tracking-wider uppercase ${
                d === "Sun" ? "text-rose-400" : d === "Sat" ? "text-indigo-400" : "text-slate-500"
              }`}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((cell, i) => {
              const isSelected = cell.current && cell.day === selected
              const cfg = cell.holiday ? TYPE_CONFIG[cell.holiday.type] : null
              return (
                <button
                  key={i}
                  onClick={() => cell.current && setSelected(isSelected ? null : cell.day)}
                  disabled={!cell.current}
                  className={`
                    relative min-h-[60px] sm:min-h-[72px] p-1.5 sm:p-2 text-left border-b border-r border-slate-800/60
                    transition-colors duration-150
                    ${!cell.current ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-slate-800/50"}
                    ${isSelected ? "bg-yellow-500/10 ring-inset ring-1 ring-yellow-500/30" : ""}
                    ${cell.isToday && !isSelected ? "bg-indigo-500/10" : ""}
                  `}
                >
                  <span className={`
                    inline-flex w-6 h-6 sm:w-7 sm:h-7 items-center justify-center rounded-full text-xs sm:text-sm font-medium
                    ${cell.isToday   ? "bg-indigo-500 text-white font-bold" :
                      isSelected     ? "bg-yellow-500 text-slate-900 font-bold" :
                      cell.isSun     ? "text-rose-400" :
                      cell.isSat     ? "text-indigo-400" : "text-slate-300"}
                  `}>
                    {cell.day}
                  </span>

                  {cell.holiday && cfg && (
                    <div className="mt-0.5">
                      <span className="text-[9px] sm:text-[10px] leading-tight block">
                        {cell.holiday.icon}{" "}
                        <span className={`${cfg.color} hidden sm:inline`}>
                          {cell.holiday.name.length > 11
                            ? cell.holiday.name.slice(0, 10) + "…"
                            : cell.holiday.name}
                        </span>
                      </span>
                    </div>
                  )}

                  {cell.isToday && (
                    <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="space-y-4">

          {/* Selected / Today info */}
          {selectedCell ? (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
                  <span className="text-xl font-bold text-yellow-400">{selectedCell.day}</span>
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

              {selectedCell.holiday ? (() => {
                const cfg = TYPE_CONFIG[selectedCell.holiday.type]
                return (
                  <div className={`rounded-xl p-3 border ${cfg.bg}`}>
                    <p className="text-2xl">{selectedCell.holiday.icon}</p>
                    <p className={`text-sm font-semibold mt-1 ${cfg.color}`}>{selectedCell.holiday.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cfg.label}</p>
                  </div>
                )
              })() : (
                <p className="text-sm text-slate-500">No holiday or festival on this day</p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
                <p className="text-xs text-slate-500">Telugu Panchanga</p>
                {(() => {
                  const t = gregorianToTelugu(viewYear, viewMonth + 1, selectedCell.day)
                  return (
                    <>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500">Samvatsara: </span>
                        <span className="text-yellow-400">{t.samvatsara}</span>
                      </p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500">Masa: </span>{t.teluguMonth}
                      </p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500">Saka Year: </span>{t.teluguYear}
                      </p>
                    </>
                  )
                })()}
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {today.getDate()} {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {gregorianToTelugu(today.getFullYear(), today.getMonth()+1, today.getDate()).samvatsara} Samvatsara
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Click any date to see details</p>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {[["all","All"],["telugu","Telugu"],["national","National"],["international","International"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filter === val
                    ? val === "telugu"        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
                      val === "national"      ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
                      val === "international" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" :
                                               "bg-slate-700 text-slate-200 border-slate-600"
                    : "bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Holidays this month */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {MONTH_NAMES[viewMonth]} Holidays
              <span className="ml-2 text-slate-600 normal-case font-normal">({monthHolidays.length})</span>
            </h3>
            {monthHolidays.length === 0 ? (
              <p className="text-sm text-slate-500">No holidays this month</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {monthHolidays.map(([key, h]) => {
                  const day = parseInt(key.split("-")[1])
                  const cfg = TYPE_CONFIG[h.type]
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(day)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                        selected === day ? "bg-yellow-500/10 ring-1 ring-yellow-500/20" : "hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="text-base shrink-0">{h.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-200 truncate">{h.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {MONTH_NAMES[viewMonth]} {day}
                          <span className={`ml-1 ${cfg.color}`}>· {cfg.label}</span>
                        </p>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-xs text-slate-400">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 w-2.5 text-center shrink-0">S</span>
                <span className="text-xs text-slate-400">Sunday</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 w-2.5 text-center shrink-0">S</span>
                <span className="text-xs text-slate-400">Saturday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeluguCalendar