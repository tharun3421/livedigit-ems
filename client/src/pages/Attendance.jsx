import { use, useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading";
import CheckinButton from "../components/attendance/CheckinButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import api from "../api/axios";
import toast from "react-hot-toast";


const Attendance = () => {
  const [history,setHistory]= useState([]);
  const [loading,setLoading]=useState(true);
  const [isDeleted,setDeleted]= useState(false);

  const fetchDate= useCallback(async ()=>{
    try {
      const res = await api.get("/attendance")
      const json = res.data;
      setHistory(json.data || [])
      if(json.employee?.isDeleted)setDeleted(true)
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    }finally{
      setLoading(false)
    }
  },[])
  useEffect(()=>{
    fetchDate()
  },[fetchDate])


  if(loading )return <Loading/>
  const today =new Date()
  today.setHours(0,0,0,0)
  const todayRecord = history.find((r)=> new Date(r.date).toDateString()=== today.toDateString())
  return (
    <div className="animate-fade-in"> 
        <div className="page-header">
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your work hours and daily check-ins</p>
        </div>
        {isDeleted ? (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <p>You can no longer clock in or out because your employee records have been marked as deleted.</p>
        </div>):(
          <div className="mb-8">
            <CheckinButton todayRecord={todayRecord} onAction={fetchDate}/>
          </div>
        )}
        <AttendanceStats history={history}/>
        <AttendanceHistory history={history}/>
    </div>
  )
}

export default Attendance