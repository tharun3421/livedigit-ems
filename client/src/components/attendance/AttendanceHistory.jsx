import React from 'react'
import { format } from 'date-fns'
import { BotIcon } from 'lucide-react'
import { getDayTypeDisplay, getWorkingHoursDisplay } from '../../assets/assets.js'

const AttendanceHistory = ({ history }) => {
  return (
    <div className='card overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='table-modern'>
          <thead>
            <tr>
              <th className='px-6 py-4'>Date</th>
              <th className='px-6 py-4'>Check In</th>
              <th className='px-6 py-4'>Check Out</th>
              <th className='px-6 py-4'>Working Hours</th>
              <th className='px-6 py-4'>Day Type</th>
              <th className='px-6 py-4'>Status</th>
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

                    {/* Date */}
                    <td className='px-6 py-4 font-medium text-slate-600'>
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>

                    {/* Check In */}
                    <td className='px-6 py-4 text-slate-600'>
                      {record.checkIn
                        ? format(new Date(record.checkIn), 'hh:mm a')
                        : '-'}
                    </td>

                    {/* Check Out */}
                    <td className='px-6 py-4 text-slate-600'>
                      {record.checkOut ? (
                        <div className='flex items-center gap-1.5'>
                          {format(new Date(record.checkOut), 'hh:mm a')}
                          {record.autoCheckedOut && (
                            <span
                              title='Auto checked out by system after 12 hours'
                              className='inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200'
                            >
                              <BotIcon className='w-3 h-3' />
                              Auto
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Working Hours */}
                    <td className='px-6 py-4 font-medium text-slate-600'>
                      {getWorkingHoursDisplay(record)}
                    </td>

                    {/* Day Type */}
                    <td className='px-6 py-4'>
                      {dayType.label !== '-' ? (
                        <span className={`badge ${dayType.className}`}>
                          {dayType.label}
                        </span>
                      ) : '-'}
                    </td>

                    {/* Status */}
                    <td className='px-6 py-4'>
                      <span
                        className={`badge ${
                          record.status === 'PRESENT'
                            ? 'badge-success'
                            : record.status === 'LATE'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
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
}

export default AttendanceHistory