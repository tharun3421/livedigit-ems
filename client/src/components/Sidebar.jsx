// import { useEffect, useState } from "react";
// import {data, href, Link, useLocation} from "react-router-dom"
// import {CalendarIcon, ChevronRightIcon, DollarSignIcon, FileTextIcon, IndianRupeeIcon, LayoutGridIcon, Loader2, LogOutIcon, MenuIcon, SettingsIcon, UserIcon, XIcon} from "lucide-react"
// import { useAuth } from "../context/authContext";
// import api from "../api/axios";

// const Sidebar = () => {

//     const {pathname} = useLocation();
//     const [userName,setUserName]= useState('')
//     const [mobileOpen,setMobileOpen]= useState(false)

//     const {user,loading,logout}= useAuth()

//     useEffect(()=>{
//         api.get("/profile").then(({data})=>{
//             if(data.firstName) setUserName(`${data.firstName} ${data.lastName || ""} `.trim())
//         })
//     })

//     useEffect(()=>{
//         setMobileOpen(false)
//     },[pathname])

//     const role = user?.role;

//     const navItems=[
//         {
//             name:"Dashboard",href:"/dashboard",icon: LayoutGridIcon
//         },
//         role === "ADMIN"?{
//             name:"Employees",href:"/employees",icon: UserIcon}:{name:"Attendance",href:"/attendance",icon: CalendarIcon},
//         {
//             name:"Leave",href:"/leave",icon: FileTextIcon
//         },
//         {
//             name:"Payslips",href:"/payslips",icon: IndianRupeeIcon
//         },
//         {
//             name:"Settings",href:"/settings",icon: SettingsIcon
//         },
//     ]

//     const handleLogout = () => {
//         logout()
//   window.location.href = "/login";
// };

//     const sidebarContent =(
//         <>
//             {/* Brand Header */}
//             <div className="px-5 pt-6 border-b border-white/6">
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <UserIcon className="text-white size-7"/>
//                         <div>
//                         <p className="font-semibold text-[13px] text-white tracking-wide">Employee MS</p>
//                         <p className="text-[11px] text-slate-500 font-medium">Management System</p>
//                     </div>
//                     </div>
//                     <button onClick={()=> setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
//                         <XIcon size={20}/>
//                     </button>
//                 </div>
//             </div>
//             {/* UserProfile card */}
//             {userName && (
//                 <div className="mx-3 mt-4 mb-1 p-3 rounded-lg bg-white/3 border border-white/4">
//                     <div className="flex items-center gap-3">
//                         <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center ring-1 ring-white/10 shrink-0">
//                             <span className="text-slate-400 text-xs font-semibold">
//                                 {userName.charAt(0).toUpperCase()}
//                             </span>
//                         </div>
//                         <div>
//                             <p>{userName}</p>
//                             <p>{role == "ADMIN" ? "Administrator":"Employee"}</p>
//                         </div>
//                     </div>
//                 </div>
//             )}
//             {/* Section Label */}

//             <div className="px-5 pt-5 pb-2">
//                 <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Navigation</p>
//             </div>
//             {/* Navigation list */}
//             <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
//                 {loading?(
//                     <div className="px-3 py-3 flex items-center gap-2 text-slate-500">
//                         <Loader2 className="animate-spin w-4 h-4"/>
//                         <span className="text-sm">Loading...</span>
//                     </div>
//                 ):( 
//                  navItems.map((item)=>{
//                     const isActive = pathname.startsWith(item.href)
//                     return(
//                         <Link key={item.name} to={item.href} className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 relative ${isActive ? "bg-indigo-500/12 text-indigo-300": "text-slate-300 hover:text-white hover:bg-white/4"}`}>
//                         {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 rounded-r-full bg-indigo-500"/>}
//                         <item.icon className={`w-4.25 h-4.25 shrink-0 ${isActive ? "text-indigo-300":"text-slate-400 group-hover:text-slate-300"}`}/>
//                         <span className="flex-1">{item.name}</span>
//                         {isActive && <ChevronRightIcon className="w-3.5 h-3.5 text-indigo-500/50"/>}
//                         </Link>
//                     )
//                 })
//                 )}
               
//             </div>
//             {/* logout */}
//             <div className="p-3 border-t border-white/6">
//                 <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-[13px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/8 transition-all duration-150">
//                     <LogOutIcon className="w-4.25 h-4.25"/>
//                     <span>Log out</span>
//                 </button>
//             </div>
//         </>
//     )

//   return (
//     <>
//     <button onClick={()=> setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-white/10">
//         <MenuIcon size={20}/>
//     </button>
//     {/* Mobile overlay */}

//     {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={()=> setMobileOpen(false)}/>}

//     {/* Sidebar -desktop */}
//     <aside className="hidden lg:flex flex-col h-full w-65 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white shrink-0 border-r border-white/4">
//         {sidebarContent}
//     </aside>
//         {/* Sidebar - mobile */}
//         <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white z-50 flex flex-col transform transition-transform duration-300 ${mobileOpen ? "translate-x-0":"-translate-x-full"}`}>
//             {sidebarContent}
//         </aside>
//     </>
//   )
// }

// export default Sidebar




import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarIcon, ChevronRightIcon, FileTextIcon, IndianRupeeIcon,
  LayoutGridIcon, Loader2, LogOutIcon, MenuIcon, SettingsIcon, UserIcon, XIcon
} from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api/axios";

const Sidebar = () => {
  const { pathname } = useLocation();
  const [userName, setUserName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    api.get("/profile").then(({ data }) => {
      if (data.firstName) setUserName(`${data.firstName} ${data.lastName || ""}`.trim());
    });
  },[]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const role = user?.role;

  // const navItems = [
  //   { name: "Dashboard", href: "/dashboard", icon: LayoutGridIcon },
  //   role === "ADMIN"
  //     ? { name: "Employees", href: "/employees", icon: UserIcon }
  //     : { name: "Attendance", href: "/attendance", icon: CalendarIcon },
  //   { name: "Leave", href: "/leave", icon: FileTextIcon },
  //   { name: "Payslips", href: "/payslips", icon: IndianRupeeIcon },
  //   { name: "Settings", href: "/settings", icon: SettingsIcon },
  // ];


  const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGridIcon },
  ...(role === "ADMIN"
    ? [{ name: "Employees", href: "/employees", icon: UserIcon }]
    : [{ name: "Attendance", href: "/attendance", icon: CalendarIcon }]
  ),
  { name: "Leave",     href: "/leave",     icon: FileTextIcon    },
  { name: "Payslips",  href: "/payslips",  icon: IndianRupeeIcon },
  { name: "Settings",  href: "/settings",  icon: SettingsIcon    },
];

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const sidebarContent = (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes sb-fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes sb-blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        @keyframes sb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 0 5px rgba(99,102,241,0); }
        }

        .sb-wrap {
          display: flex; flex-direction: column; height: 100%;
          background: #080b14;
          border-right: 1px solid rgba(255,255,255,0.06);
          font-family: 'DM Sans', sans-serif;
          position: relative; overflow: hidden;
        }

        /* background orb */
        .sb-orb {
          position: absolute; border-radius: 50%; pointer-events: none; filter: blur(60px);
          width: 220px; height: 220px; top: -60px; left: -60px;
          background: radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%);
        }
        .sb-orb2 {
          position: absolute; border-radius: 50%; pointer-events: none; filter: blur(50px);
          width: 160px; height: 160px; bottom: 60px; right: -40px;
          background: radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%);
        }

        /* brand */
        .sb-brand {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between;
        }
        .sb-logo {
          display: flex; align-items: center; gap: 10px;
        }
        .sb-logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(99,102,241,0.2);
        }
        .sb-logo-icon svg { width: 17px; height: 17px; stroke: #818cf8; }
        .sb-logo-text {}
        .sb-logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 800;
          color: #fff; letter-spacing: -0.01em; line-height: 1;
        }
        .sb-logo-sub {
          font-size: 10px; font-weight: 300;
          color: rgba(255,255,255,0.25); letter-spacing: 0.04em;
          margin-top: 2px;
        }
        .sb-close {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); padding: 4px;
          border-radius: 6px; transition: color 0.2s, background 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .sb-close:hover { color: #fff; background: rgba(255,255,255,0.06); }

        /* user card */
        .sb-user {
          margin: 16px 12px 8px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          display: flex; align-items: center; gap: 12px;
          position: relative; z-index: 1;
          animation: sb-fadeIn 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .sb-avatar {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          display: flex; align-items: center; justify-content: center;
        }
        .sb-avatar span {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 800;
          background: linear-gradient(120deg, #818cf8, #38bdf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sb-user-name {
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.85); line-height: 1;
        }
        .sb-user-role {
          font-size: 11px; font-weight: 300;
          color: rgba(255,255,255,0.3); margin-top: 3px;
        }
        .sb-live {
          margin-left: auto; flex-shrink: 0;
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          animation: sb-blink 2.5s ease-in-out infinite;
          box-shadow: 0 0 6px #22c55e;
        }

        /* section label */
        .sb-section {
          padding: 16px 20px 8px;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          position: relative; z-index: 1;
        }

        /* nav */
        .sb-nav {
          flex: 1; padding: 0 10px;
          display: flex; flex-direction: column; gap: 3px;
          overflow-y: auto; position: relative; z-index: 1;
        }

        .sb-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 11px;
          font-size: 13px; font-weight: 400;
          text-decoration: none;
          color: rgba(255,255,255,0.45);
          position: relative; overflow: hidden;
          transition: color 0.2s, background 0.2s;
        }
        .sb-item:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
        }
        .sb-item.active {
          color: #a5b4fc;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.18);
          font-weight: 500;
        }
        .sb-item-bar {
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 18px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #818cf8, #38bdf8);
          box-shadow: 0 0 8px rgba(99,102,241,0.6);
        }
        .sb-item svg {
          width: 16px; height: 16px; flex-shrink: 0;
          transition: color 0.2s;
        }
        .sb-item:not(.active) svg { color: rgba(255,255,255,0.3); }
        .sb-item.active svg { color: #818cf8; }
        .sb-item:hover:not(.active) svg { color: rgba(255,255,255,0.6); }
        .sb-item-chevron {
          margin-left: auto; width: 12px; height: 12px;
          color: rgba(99,102,241,0.4);
        }

        /* loading */
        .sb-loading {
          display: flex; align-items: center; gap: 8px;
          padding: 12px; color: rgba(255,255,255,0.25); font-size: 13px;
        }
        .sb-loading svg { animation: spin 1s linear infinite; width: 14px; height: 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* logout */
        .sb-footer {
          padding: 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
          position: relative; z-index: 1;
        }
        .sb-logout {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 12px; border-radius: 11px;
          font-size: 13px; font-weight: 400;
          color: rgba(255,255,255,0.3);
          background: none; border: none; cursor: pointer;
          transition: color 0.2s, background 0.2s;
        }
        .sb-logout:hover {
          color: #f87171;
          background: rgba(248,113,113,0.08);
        }
        .sb-logout svg { width: 16px; height: 16px; flex-shrink: 0; }

        /* divider */
        .sb-divider {
          height: 1px; background: rgba(255,255,255,0.05);
          margin: 4px 12px;
        }
          @media (min-width: 1024px) {
  .sb-close {
    display: none;
  }
}
      `}</style>

      <div className="sb-wrap">
        <div className="sb-orb" />
        <div className="sb-orb2" />

        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <UserIcon />
            </div>
            <div className="sb-logo-text">
              <div className="sb-logo-name">LIVEDIGIT.</div>
              <div className="sb-logo-sub">Management System</div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="sb-close lg:hidden" >
            <XIcon size={18} />
          </button>
        </div>

        {/* User card */}
        {userName && (
          <div className="sb-user">
            <div className="sb-avatar">
              <span>{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="sb-user-name">{userName}</div>
              <div className="sb-user-role">{role === "ADMIN" ? "Administrator" : "Employee"}</div>
            </div>
            <div className="sb-live" />
          </div>
        )}

        {/* Nav label */}
        <div className="sb-section">Navigation</div>

        {/* Nav items */}
        <nav className="sb-nav">
          {loading ? (
            <div className="sb-loading">
              <Loader2 />
              <span>Loading...</span>
            </div>
          ) : (
            navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sb-item ${isActive ? "active" : ""}`}
                >
                  {isActive && <div className="sb-item-bar" />}
                  <item.icon />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {isActive && <ChevronRightIcon className="sb-item-chevron" />}
                </Link>
              );
            })
          )}
        </nav>

        {/* Logout */}
        <div className="sb-footer">
          <button onClick={handleLogout} className="sb-logout">
            <LogOutIcon />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
  onClick={() => setMobileOpen(true)}
  className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-black flex items-center justify-center"
  style={{
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  }}
>
  <MenuIcon size={18} />
</button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
          className="lg:hidden"
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block h-full w-64 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed", inset: "0 auto 0 0",
          width: "272px", zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;