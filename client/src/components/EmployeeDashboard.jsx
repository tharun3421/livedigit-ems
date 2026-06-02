// import { useEffect, useRef, useState, useCallback } from "react";
// import { ArrowRightIcon, CalendarIcon, FileTextIcon, IndianRupeeIcon, BellIcon } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";
// import api from "../api/axios";

// // ─── Notification sound (same as Announcements page) ─────────────────────────
// const playNotificationSound = (priority = "NORMAL") => {
//   try {
//     const ctx = new (window.AudioContext || window.webkitAudioContext)();
//     const configs = {
//       NORMAL:    [{ freq: 523, dur: 0.12 }, { freq: 659, dur: 0.18 }],
//       IMPORTANT: [{ freq: 659, dur: 0.12 }, { freq: 784, dur: 0.12 }, { freq: 880, dur: 0.22 }],
//       URGENT:    [{ freq: 880, dur: 0.10 }, { freq: 988, dur: 0.10 }, { freq: 880, dur: 0.10 }, { freq: 988, dur: 0.25 }],
//     };
//     let time = ctx.currentTime;
//     (configs[priority] || configs.NORMAL).forEach(({ freq, dur }) => {
//       const osc  = ctx.createOscillator();
//       const gain = ctx.createGain();
//       osc.connect(gain);
//       gain.connect(ctx.destination);
//       osc.frequency.value = freq;
//       osc.type = "sine";
//       gain.gain.setValueAtTime(0.35, time);
//       gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
//       osc.start(time);
//       osc.stop(time + dur);
//       time += dur + 0.04;
//     });
//   } catch { /* AudioContext not supported */ }
// };

// // ─── Bell Button with unread badge ───────────────────────────────────────────
// const AnnouncementBell = () => {
//   const navigate = useNavigate();
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [ringing,     setRinging]     = useState(false);
//   const knownIdsRef   = useRef(new Set());
//   const initializedRef = useRef(false);

//   const fetchAndDiff = useCallback(async () => {
//     try {
//       const res  = await api.get("/announcements");
//       const data = res.data.data || [];

//       if (!initializedRef.current) {
//         // First load — seed known IDs, count unread vs lastSeen
//         const lastSeen = localStorage.getItem("announcementLastSeen") || "";
//         data.forEach((a) => knownIdsRef.current.add(a._id));
//         const unread = lastSeen
//           ? data.filter((a) => new Date(a.createdAt) > new Date(lastSeen)).length
//           : data.length;
//         setUnreadCount(unread);
//         initializedRef.current = true;
//         return;
//       }

//       // Subsequent polls — find genuinely new items
//       const newItems = data.filter((a) => !knownIdsRef.current.has(a._id));
//       if (newItems.length > 0) {
//         newItems.forEach((a) => knownIdsRef.current.add(a._id));
//         setUnreadCount((c) => c + newItems.length);

//         // Play sound based on highest priority
//         const priority =
//           newItems.some((a) => a.priority === "URGENT")    ? "URGENT"    :
//           newItems.some((a) => a.priority === "IMPORTANT") ? "IMPORTANT" : "NORMAL";
//         playNotificationSound(priority);

//         // Animate the bell
//         setRinging(true);
//         setTimeout(() => setRinging(false), 1000);
//       }
//     } catch { /* silently ignore polling errors */ }
//   }, []);

//   useEffect(() => {
//     fetchAndDiff();
//     const timer = setInterval(fetchAndDiff, 30_000);
//     return () => clearInterval(timer);
//   }, [fetchAndDiff]);

//   const handleClick = () => {
//     setUnreadCount(0);
//     // Mark seen so Announcements page won't re-badge these
//     localStorage.setItem("announcementLastSeen", new Date().toISOString());
//     navigate("/announcements");
//   };

//   return (
//     <button
//       onClick={handleClick}
//       title="View announcements"
//       className={`relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 transition-all ${ringing ? "animate-bounce" : ""}`}
//     >
//       <BellIcon className="w-5 h-5" />

//       {/* Unread badge */}
//       {unreadCount > 0 && (
//         <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
//           {unreadCount > 9 ? "9+" : unreadCount}
//         </span>
//       )}
//     </button>
//   );
// };

// // ─── Main Dashboard ───────────────────────────────────────────────────────────
// const EmployeeDashboard = ({ data }) => {
//   const emp = data.employee;

//   const cards = [
//     {
//       icon: CalendarIcon,
//       value: data.currentMonthAttendance,
//       titel: "Days Present",
//       subtitle: "This month",
//     },
//     {
//       icon: FileTextIcon,
//       value: data.pendingLeaves,
//       titel: "Pending Leave Request",
//       subtitle: "Awaiting approval",
//     },
//     {
//       icon: IndianRupeeIcon,
//       value: data.latestPayslip
//         ? `₹ ${data.latestPayslip.netSalary?.toLocaleString()}`
//         : "N/A",
//       titel: "Latest payslip",
//       subtitle: "Most recent payout",
//     },
//   ];

//   return (
//     <div className="animate-fade-in">
//       {/* Header row with bell */}
//       <div className="page-header flex items-start justify-between gap-4">
//         <div>
//           <h1 className="text-slate-100 text-3xl">Welcome, {emp?.firstName} !</h1>
//           <p className="page-subtitle">
//             {emp?.position} - {emp?.department || "No Department"}
//           </p>
//         </div>

//         <AnnouncementBell />
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
//         {cards.map((card, index) => (
//           <div
//             key={index}
//             className="card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between"
//           >
//             <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />

//             <div>
//               <p>{card.titel}</p>
//               <p>{card.value}</p>
//             </div>

//             <card.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors" />
//           </div>
//         ))}
//       </div>

//       <div className="flex flex-col sm:flex-row gap-3">
//         <Link
//           to="/attendance"
//           className="btn-primary text-center inline-flex items-center justify-center gap-2"
//         >
//           Mark Attendance <ArrowRightIcon className="w-4 h-4" />
//         </Link>
//         <Link to="/leave" className="btn-secondary text-center">
//           Apply for Leave
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default EmployeeDashboard;



// client/src/components/EmployeeDashboard.jsx
// Replace your existing EmployeeDashboard.jsx with this file.

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRightIcon, CalendarIcon, FileTextIcon, IndianRupeeIcon, BellIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AttendanceCalendarModal from "./attendance/AttendanceCalendarModal";

// ─── Notification sound ───────────────────────────────────────────────────────
const playNotificationSound = (priority = "NORMAL") => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const configs = {
      NORMAL:    [{ freq: 523, dur: 0.12 }, { freq: 659, dur: 0.18 }],
      IMPORTANT: [{ freq: 659, dur: 0.12 }, { freq: 784, dur: 0.12 }, { freq: 880, dur: 0.22 }],
      URGENT:    [{ freq: 880, dur: 0.10 }, { freq: 988, dur: 0.10 }, { freq: 880, dur: 0.10 }, { freq: 988, dur: 0.25 }],
    };
    let time = ctx.currentTime;
    (configs[priority] || configs.NORMAL).forEach(({ freq, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.start(time);
      osc.stop(time + dur);
      time += dur + 0.04;
    });
  } catch { /* AudioContext not supported */ }
};

// ─── Bell Button ──────────────────────────────────────────────────────────────
const AnnouncementBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [ringing,     setRinging]     = useState(false);
  const knownIdsRef    = useRef(new Set());
  const initializedRef = useRef(false);

  const fetchAndDiff = useCallback(async () => {
    try {
      const res  = await api.get("/announcements");
      const data = res.data.data || [];
      if (!initializedRef.current) {
        const lastSeen = localStorage.getItem("announcementLastSeen") || "";
        data.forEach((a) => knownIdsRef.current.add(a._id));
        const unread = lastSeen
          ? data.filter((a) => new Date(a.createdAt) > new Date(lastSeen)).length
          : data.length;
        setUnreadCount(unread);
        initializedRef.current = true;
        return;
      }
      const newItems = data.filter((a) => !knownIdsRef.current.has(a._id));
      if (newItems.length > 0) {
        newItems.forEach((a) => knownIdsRef.current.add(a._id));
        setUnreadCount((c) => c + newItems.length);
        const priority =
          newItems.some((a) => a.priority === "URGENT")    ? "URGENT"    :
          newItems.some((a) => a.priority === "IMPORTANT") ? "IMPORTANT" : "NORMAL";
        playNotificationSound(priority);
        setRinging(true);
        setTimeout(() => setRinging(false), 1000);
      }
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchAndDiff();
    const timer = setInterval(fetchAndDiff, 30_000);
    return () => clearInterval(timer);
  }, [fetchAndDiff]);

  const handleClick = () => {
    setUnreadCount(0);
    localStorage.setItem("announcementLastSeen", new Date().toISOString());
    navigate("/announcements");
  };

  return (
    <button
      onClick={handleClick}
      title="View announcements"
      className={`relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 transition-all ${ringing ? "animate-bounce" : ""}`}
    >
      <BellIcon className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const EmployeeDashboard = ({ data }) => {
  const emp = data.employee;
  const [showCalendar, setShowCalendar] = useState(false);

  const cards = [
    {
      icon: CalendarIcon,
      value: data.currentMonthAttendance,
      titel: "Days Present",
      subtitle: "This month — click to view",
      clickable: true,
      onClick: () => setShowCalendar(true),
    },
    {
      icon: FileTextIcon,
      value: data.pendingLeaves,
      titel: "Pending Leave Request",
      subtitle: "Awaiting approval",
    },
    {
      icon: IndianRupeeIcon,
      value: data.latestPayslip
        ? `₹ ${data.latestPayslip.netSalary?.toLocaleString()}`
        : "N/A",
      titel: "Latest payslip",
      subtitle: "Most recent payout",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-100 text-3xl">Welcome, {emp?.firstName} !</h1>
          <p className="page-subtitle">
            {emp?.position} - {emp?.department || "No Department"}
          </p>
        </div>
        <AnnouncementBell />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className={`card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between ${card.clickable ? "cursor-pointer" : ""}`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
            <div>
              <p className="text-sm text-slate-400">{card.titel}</p>
              <p className="text-2xl font-bold text-slate-100 mt-0.5">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.subtitle}</p>
              {card.clickable && (
                <p className="text-[10px] text-indigo-400 mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view calendar →
                </p>
              )}
            </div>
            <card.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors" />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/attendance"
          className="btn-primary text-center inline-flex items-center justify-center gap-2"
        >
          Mark Attendance <ArrowRightIcon className="w-4 h-4" />
        </Link>
        <Link to="/leave" className="btn-secondary text-center">
          Apply for Leave
        </Link>
      </div>

      {/* Attendance Calendar Modal */}
      {showCalendar && (
        <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />
      )}
    </div>
  );
};

export default EmployeeDashboard;