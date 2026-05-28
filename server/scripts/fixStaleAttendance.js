import 'dotenv/config'
import connectDB    from '../config/db.js'
import Attendance   from '../models/Attendance.js'

const MAX_HOURS      = 10
const EXPECTED_HOURS = 9

const getDayType = (hours) => {
    if (hours >= EXPECTED_HOURS)        return 'Full Day'
    if (hours >= EXPECTED_HOURS * 0.75) return 'Three Quarter Day'
    if (hours >= EXPECTED_HOURS * 0.5)  return 'Half Day'
    return 'Short Day'
}

const run = async () => {
    await connectDB()

    const cutoff = new Date(Date.now() - MAX_HOURS * 60 * 60 * 1000)

    const stale = await Attendance.find({
        checkOut: null,
        checkIn:  { $lte: cutoff },
    })

    console.log(`Found ${stale.length} stale record(s)`)

    for (const record of stale) {
        const checkOutTime = new Date(new Date(record.checkIn).getTime() + MAX_HOURS * 60 * 60 * 1000)

        record.checkOut       = checkOutTime
        record.workingHours   = MAX_HOURS
        record.autoCheckedOut = true
        record.dayType        = getDayType(MAX_HOURS)

        if (record.status !== 'LATE') {
            record.status = 'PRESENT'
        }

        await record.save()
        console.log(`✓ Fixed employee ${record.employeeId} | checkIn: ${record.checkIn} | checkOut: ${checkOutTime.toISOString()}`)
    }

    console.log('Done')
    process.exit(0)
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})