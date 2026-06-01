// import React from 'react'
// import { format } from 'date-fns'
// import { BotIcon } from 'lucide-react'
// import { getDayTypeDisplay, getWorkingHoursDisplay } from '../../assets/assets.js'

// const COLUMNS = ['Date', 'Check In', 'Check Out', 'Working Hours', 'Day Type', 'Status']

// const STATUS_BADGE = {
//     PRESENT: 'badge-success',
//     LATE:    'badge-warning',
//     ABSENT:  'badge-danger',
// }

// const AttendanceHistory = ({ history }) => (
//     <div className='card overflow-hidden'>
//         <div className='overflow-x-auto'>
//             <table className='table-modern'>
//                 <thead>
//                     <tr>
//                         {COLUMNS.map((col) => (
//                             <th key={col} className='px-6 py-4'>{col}</th>
//                         ))}
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {history.length === 0 ? (
//                         <tr>
//                             <td colSpan={6} className='text-center py-12 text-slate-400'>
//                                 No records found
//                             </td>
//                         </tr>
//                     ) : (
//                         history.map((record) => {
//                             const dayType = getDayTypeDisplay(record)
//                             return (
//                                 <tr key={record._id || record.id}>
//                                     <td className='px-6 py-4 font-medium text-slate-600'>
//                                         {format(new Date(record.date), 'MMM dd, yyyy')}
//                                     </td>

//                                     <td className='px-6 py-4 text-slate-600'>
//                                         {record.checkIn
//                                             ? format(new Date(record.checkIn), 'hh:mm a')
//                                             : '-'}
//                                     </td>

//                                     <td className='px-6 py-4 text-slate-600'>
//                                         {record.checkOut ? (
//                                             <div className='flex items-center gap-1.5'>
//                                                 {format(new Date(record.checkOut), 'hh:mm a')}
//                                                 {record.autoCheckedOut && (
//                                                     <span
//                                                         title='Auto checked out by system after 10 hours'
//                                                         className='inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200'
//                                                     >
//                                                         <BotIcon className='w-3 h-3' /> Auto
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         ) : '-'}
//                                     </td>

//                                     <td className='px-6 py-4 font-medium text-slate-600'>
//                                         {getWorkingHoursDisplay(record)}
//                                     </td>

//                                     <td className='px-6 py-4'>
//                                         {dayType.label !== '-'
//                                             ? <span className={`badge ${dayType.className}`}>{dayType.label}</span>
//                                             : '-'}
//                                     </td>

//                                     <td className='px-6 py-4'>
//                                         <span className={`badge ${STATUS_BADGE[record.status] ?? 'badge-danger'}`}>
//                                             {record.status}
//                                         </span>
//                                     </td>
//                                 </tr>
//                             )
//                         })
//                     )}
//                 </tbody>
//             </table>
//         </div>
//     </div>
// )

// export default AttendanceHistory


import React from 'react'
import { format } from 'date-fns'
import { BotIcon } from 'lucide-react'
import { getDayTypeDisplay, getWorkingHoursDisplay } from '../../assets/assets.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMNS = ['Date', 'Check In', 'Check Out', 'Working Hours', 'Day Type', 'Status']

const STATUS_BADGE = {
    PRESENT: 'badge-success',
    LATE:    'badge-warning',
    ABSENT:  'badge-danger',
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Shifts a UTC date string into IST before formatting, so the displayed
// calendar date matches the IST day the record belongs to.
// e.g. "2026-05-31T18:30:00.000Z" → Jun 01, 2026  (not May 31)
const toISTDate = (utcString) => new Date(new Date(utcString).getTime() + IST_OFFSET_MS)

// ─── Component ────────────────────────────────────────────────────────────────

const AttendanceHistory = ({ history }) => (
    <div className='card overflow-hidden'>
        <div className='overflow-x-auto'>
            <table className='table-modern'>
                <thead>
                    <tr>
                        {COLUMNS.map((col) => (
                            <th key={col} className='px-6 py-4'>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {history.length === 0 ? (
                        <tr>
                            <td colSpan={6} className='text-center py-12 text-slate-400'>
                                No records found
                            </td>
                        </tr>
                    ) : (
                        history.map((record) => {
                            const dayType = getDayTypeDisplay(record)
                            return (
                                <tr key={record._id || record.id}>
                                    {/* ✅ Use toISTDate so "May 31 18:30 UTC" displays as "Jun 01" */}
                                    <td className='px-6 py-4 font-medium text-slate-600'>
                                        {format(toISTDate(record.date), 'MMM dd, yyyy')}
                                    </td>

                                    <td className='px-6 py-4 text-slate-600'>
                                        {record.checkIn
                                            ? format(new Date(record.checkIn), 'hh:mm a')
                                            : '-'}
                                    </td>

                                    <td className='px-6 py-4 text-slate-600'>
                                        {record.checkOut ? (
                                            <div className='flex items-center gap-1.5'>
                                                {format(new Date(record.checkOut), 'hh:mm a')}
                                                {record.autoCheckedOut && (
                                                    <span
                                                        title='Auto checked out by system after 10 hours'
                                                        className='inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200'
                                                    >
                                                        <BotIcon className='w-3 h-3' /> Auto
                                                    </span>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>

                                    <td className='px-6 py-4 font-medium text-slate-600'>
                                        {getWorkingHoursDisplay(record)}
                                    </td>

                                    <td className='px-6 py-4'>
                                        {dayType.label !== '-'
                                            ? <span className={`badge ${dayType.className}`}>{dayType.label}</span>
                                            : '-'}
                                    </td>

                                    <td className='px-6 py-4'>
                                        <span className={`badge ${STATUS_BADGE[record.status] ?? 'badge-danger'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    </div>
)

export default AttendanceHistory