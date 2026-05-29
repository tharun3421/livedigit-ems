import cron       from 'node-cron'
import Attendance from '../models/Attendance.js'

const MAX_HOURS      = 9
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
                const checkOutTime = new Date(new Date(record.checkIn).getTime() + MAX_HOURS * 60 * 60 * 1000)

                record.checkOut       = checkOutTime
                record.workingHours   = MAX_HOURS
                record.autoCheckedOut = true
                record.dayType        = getDayType(MAX_HOURS)  // → 'Full Day' (10 >= 9)

                if (record.status !== 'LATE') {
                    record.status = 'PRESENT'
                }

                await record.save()
                console.log(`[AutoCheckout] Employee ${record.employeeId} — checkIn: ${record.checkIn} | checkOut: ${checkOutTime.toISOString()} | ${MAX_HOURS}h | ${record.dayType}`)
            }

        } catch (err) {
            console.error('[AutoCheckout] Job failed:', err)
        }
    })

    console.log('[AutoCheckout] Cron job started — auto checkout after', MAX_HOURS, 'hours')
}