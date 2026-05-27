import cron       from 'node-cron'
import Attendance from '../models/Attendance.js'

const MAX_HOURS    = 10
const EXPECTED_HOURS = 9

const getDayType = (hours) => {
    if (hours >= EXPECTED_HOURS)        return 'Full Day'
    if (hours >= EXPECTED_HOURS * 0.75) return 'Three Quarter Day'
    if (hours >= EXPECTED_HOURS * 0.5)  return 'Half Day'
    return 'Short Day'
}

export const startAutoCheckoutJob = () => {
    cron.schedule('*/15 * * * *', async () => {
        try {
            const cutoff = new Date(Date.now() - MAX_HOURS * 60 * 60 * 1000)

            const stale = await Attendance.find({
                checkOut: null,
                checkIn:  { $lte: cutoff },
            })

            if (!stale.length) return

            for (const record of stale) {
                const workingHours = parseFloat(
                    ((Date.now() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(2)
                )

                record.checkOut       = new Date()
                record.workingHours   = workingHours
                record.autoCheckedOut = true
                record.dayType        = getDayType(workingHours)

                if (record.status !== 'LATE') {
                    record.status = workingHours >= EXPECTED_HOURS * 0.5 ? 'PRESENT' : 'LATE'
                }

                await record.save()
                console.log(`[AutoCheckout] Employee ${record.employeeId} checked out after ${workingHours}h`)
            }

        } catch (err) {
            console.error('[AutoCheckout] Job failed:', err)
        }
    })

    console.log('[AutoCheckout] Cron job started — runs every 15 minutes')
}